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
  if (
    (process.env.KARMITIS_CLIENT_ID || process.env.KARMITIS_APP_ID) &&
    process.env.KARMITIS_APP_KEY
  )
    return;
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
    detail: "Set KARMITIS_CLIENT_ID (or KARMITIS_APP_ID) and KARMITIS_APP_KEY",
  });
}

export default async function handler(req, res) {
  await loadLocalEnvIfNeeded();

  const BASE =
    process.env.VITE_KARMITIS_BASE_URL ||
    process.env.KARMITIS_BASE_URL ||
    "https://karmitis.com";

  const APP_ID =
    process.env.KARMITIS_CLIENT_ID ||
    process.env.VITE_KARMITIS_CLIENT_ID ||
    process.env.KARMITIS_APP_ID;
  const APP_KEY = process.env.KARMITIS_APP_KEY;

  if (!APP_ID || !APP_KEY) return missingConfig(res);

  try {
    const fetchFn = await getFetch();
    if (req.method === "POST") {
      const { payload, userId } = req.body || {};
      if (!payload) return res.status(400).json({ error: "payload_required" });

      const body = {
        payload: {
          appdata: payload,
          meta: { savedAt: new Date().toISOString(), source: "wuwacalculator" },
        },
        uploadedByUserId: userId || null,
      };

      const upstream = await fetchFn(`${BASE}/apps/${APP_ID}/appdata`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-app-key": APP_KEY,
          ...(req.headers.cookie ? { cookie: req.headers.cookie } : {}),
        },
        body: JSON.stringify(body),
      });

      const data = await upstream.json().catch(() => ({}));
      return res.status(upstream.status).json(data);
    }

    if (req.method === "GET") {
      const userId = req.query?.userId ? String(req.query.userId) : null;
      const query = userId ? `?userId=${encodeURIComponent(userId)}` : "";
      const upstream = await fetchFn(`${BASE}/apps/${APP_ID}/appdata/latest${query}`, {
        headers: {
          "x-app-key": APP_KEY,
          ...(req.headers.cookie ? { cookie: req.headers.cookie } : {}),
          ...(userId ? { "x-user-id": userId } : {}),
        },
      });
      const data = await upstream.json().catch(() => ({}));
      return res.status(upstream.status).json(data);
    }

    return res.status(405).json({ error: "method_not_allowed" });
  } catch (err) {
    console.error("KARMITIS backup proxy error:", err);
    return res.status(500).json({ error: "karmitis_proxy_failed", detail: err.message });
  }
}
