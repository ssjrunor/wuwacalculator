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
  if (process.env.KARMITIS_BASE_URL || process.env.VITE_KARMITIS_BASE_URL) return;
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
    // Ignore local env fallback errors.
  }
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "method_not_allowed" });
  }

  await loadLocalEnvIfNeeded();

  const BASE =
    process.env.KARMITIS_BASE_URL ||
    process.env.VITE_KARMITIS_BASE_URL ||
    "https://karmitis.com";

  const authHeader = req.headers?.authorization || req.headers?.Authorization;
  if (!authHeader || typeof authHeader !== "string") {
    return res.status(401).json({ error: "missing_authorization" });
  }

  try {
    const fetchFn = await getFetch();
    const headers = { Authorization: authHeader };
    if (req.headers?.origin) headers.Origin = req.headers.origin;

    const upstream = await fetchFn(`${BASE}/me`, {
      method: "GET",
      headers,
    });
    const text = await upstream.text();
    const requestId =
      upstream.headers.get("x-request-id") ||
      upstream.headers.get("x-amzn-requestid") ||
      null;

    if (!text) {
      return res.status(upstream.status).json({
        error: upstream.ok ? null : "karmitis_upstream_error",
        detail: upstream.ok ? null : "Empty response from Karmitis /me",
        requestId,
      });
    }

    try {
      const data = JSON.parse(text);
      return res.status(upstream.status).json({
        ...data,
        ...(requestId ? { requestId } : {}),
      });
    } catch {
      return res.status(upstream.status).send(text);
    }
  } catch (err) {
    return res.status(500).json({
      error: "karmitis_me_proxy_failed",
      detail: err?.message || "Unknown error",
    });
  }
}

