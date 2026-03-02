export const config = { runtime: "nodejs" };

let fetchImpl;
async function getFetch() {
  if (fetchImpl) return fetchImpl;
  if (typeof fetch === "function") {
    fetchImpl = fetch;
    return fetchImpl;
  }
  const mod = await import("node-fetch");
  fetchImpl = mod.default || mod;
  return fetchImpl;
}

async function loadLocalEnvIfNeeded() {
  if (process.env.KARMITIS_CLIENT_ID && process.env.KARMITIS_CLIENT_SECRET) return;
  try {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const { fileURLToPath } = await import("node:url");

    const findEnvFile = (startDir, name) => {
      let dir = startDir;
      for (let i = 0; i < 8; i += 1) {
        const candidate = path.join(dir, name);
        if (fs.existsSync(candidate)) return candidate;
        const parent = path.dirname(dir);
        if (parent === dir) break;
        dir = parent;
      }
      return null;
    };

    const parseFile = (filePath) => {
      const contents = fs.readFileSync(filePath, "utf8");
      for (const line of contents.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
        if (!match) continue;
        const key = match[1];
        if (process.env[key] !== undefined) continue;
        let value = match[2] ?? "";
        if (
          (value.startsWith("\"") && value.endsWith("\"")) ||
          (value.startsWith("'") && value.endsWith("'"))
        ) {
          value = value.slice(1, -1);
        }
        process.env[key] = value;
      }
    };

    const roots = [process.cwd(), path.dirname(fileURLToPath(import.meta.url))];
    const seen = new Set();
    for (const root of roots) {
      const localEnv = findEnvFile(root, ".env.local");
      if (localEnv && !seen.has(localEnv)) {
        parseFile(localEnv);
        seen.add(localEnv);
      }
      const env = findEnvFile(root, ".env");
      if (env && !seen.has(env)) {
        parseFile(env);
        seen.add(env);
      }
    }
  } catch {
    // If fs/path are unavailable (edge runtime), skip local env loading.
  }
}

function missingConfig(res) {
  return res.status(500).json({
    error: "missing_karmitis_config",
    detail: "Set KARMITIS_CLIENT_ID and KARMITIS_CLIENT_SECRET",
  });
}

async function tryFetchKarmitisUser({ fetchFn, baseUrl, accessToken, originHeader }) {
  if (!accessToken) return null;
  try {
    const headers = { Authorization: `Bearer ${accessToken}` };
    if (originHeader) headers.Origin = originHeader;
    const meRes = await fetchFn(`${baseUrl}/me`, { method: "GET", headers });
    if (!meRes.ok) return null;
    return await meRes.json();
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "method_not_allowed" });
  }

  await loadLocalEnvIfNeeded();

  const BASE =
    process.env.KARMITIS_BASE_URL ||
    process.env.VITE_KARMITIS_BASE_URL ||
    "https://karmitis.com";

  const CLIENT_ID = process.env.KARMITIS_CLIENT_ID || process.env.VITE_KARMITIS_CLIENT_ID;
  const CLIENT_SECRET = process.env.KARMITIS_CLIENT_SECRET || process.env.KARMITIS_APP_KEY;
  const REDIRECT_URI = process.env.KARMITIS_REDIRECT_URI || process.env.VITE_KARMITIS_REDIRECT_URI;

  if (!CLIENT_ID || !CLIENT_SECRET) return missingConfig(res);

  const body = req.body || {};
  const grantType = body.grant_type || (body.refresh_token ? "refresh_token" : "authorization_code");

  const payload = {
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    grant_type: grantType,
  };

  if (grantType === "authorization_code") {
    if (!body.code) return res.status(400).json({ error: "missing_code" });
    const redirectUri = body.redirect_uri || REDIRECT_URI;
    if (!redirectUri) return res.status(400).json({ error: "missing_redirect_uri" });
    payload.code = body.code;
    payload.redirect_uri = redirectUri;
  }

  if (grantType === "refresh_token") {
    if (!body.refresh_token) return res.status(400).json({ error: "missing_refresh_token" });
    payload.refresh_token = body.refresh_token;
  }

  try {
    const fetchFn = await getFetch();
    const incomingOrigin = req.headers?.origin;
    console.log("KARMITIS token proxy origin", incomingOrigin);
    const upstreamHeaders = { "Content-Type": "application/json" };
    if (req.headers?.origin) upstreamHeaders.Origin = req.headers.origin;
    const upstream = await fetchFn(`${BASE}/auth/token`, {
      method: "POST",
      headers: upstreamHeaders,
      body: JSON.stringify(payload),
    });

    const text = await upstream.text();
    const upstreamRequestId =
      upstream.headers.get("x-request-id") ||
      upstream.headers.get("x-amzn-requestid") ||
      null;

    if (!upstream.ok) {
      let parsed = null;
      try {
        parsed = text ? JSON.parse(text) : null;
      } catch {
        parsed = null;
      }

      const detailParts = [];
      if (parsed?.message) detailParts.push(String(parsed.message));
      if (parsed?.detail) detailParts.push(String(parsed.detail));
      if (!detailParts.length && parsed?.error) detailParts.push(String(parsed.error));
      if (!detailParts.length && text) detailParts.push(String(text).slice(0, 800));
      if (!detailParts.length) detailParts.push(`Upstream token exchange failed with ${upstream.status}.`);
      if (upstreamRequestId) detailParts.push(`requestId=${upstreamRequestId}`);

      return res.status(upstream.status).json({
        error: parsed?.error || "karmitis_upstream_error",
        detail: detailParts.join(" | "),
        upstreamStatus: upstream.status,
        requestId: upstreamRequestId || parsed?.requestId || null,
      });
    }

    try {
      const data = JSON.parse(text);
      if (upstream.ok && data && typeof data === "object" && data.access_token) {
        const user = await tryFetchKarmitisUser({
          fetchFn,
          baseUrl: BASE,
          accessToken: data.access_token,
          originHeader: req.headers?.origin,
        });
        if (user) data.user = user;
      }
      return res.status(upstream.status).json(data);
    } catch {
      return res.status(upstream.status).send(text);
    }
  } catch (err) {
    console.error("KARMITIS token proxy error:", err);
    return res.status(500).json({
      error: "karmitis_token_proxy_failed",
      detail: err?.message || "Unknown error",
    });
  }
}
