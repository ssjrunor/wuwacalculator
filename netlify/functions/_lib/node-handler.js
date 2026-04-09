function normalizeHeaders(headers = {}) {
  const normalized = {};

  for (const [key, value] of Object.entries(headers)) {
    if (value == null) continue;
    normalized[key] = value;
    normalized[key.toLowerCase()] = value;
  }

  return normalized;
}

function parseBody(event) {
  if (!event.body) return {};

  const contentType = String(event.headers?.["content-type"] || event.headers?.["Content-Type"] || "").toLowerCase();
  const rawBody = event.isBase64Encoded
    ? Buffer.from(event.body, "base64").toString("utf8")
    : event.body;

  if (contentType.includes("application/json")) {
    try {
      return JSON.parse(rawBody);
    } catch {
      return {};
    }
  }

  if (contentType.includes("application/x-www-form-urlencoded")) {
    return Object.fromEntries(new URLSearchParams(rawBody));
  }

  return rawBody;
}

function createRequest(event) {
  return {
    method: event.httpMethod,
    headers: normalizeHeaders(event.headers),
    body: parseBody(event),
    query: event.queryStringParameters || {},
    url: event.rawUrl || event.path,
    path: event.path,
  };
}

function createResponse() {
  let statusCode = 200;
  let body = "";
  let isBase64Encoded = false;
  const headers = {};

  const response = {
    status(code) {
      statusCode = code;
      return response;
    },
    setHeader(name, value) {
      headers[name] = value;
      return response;
    },
    getHeader(name) {
      return headers[name];
    },
    json(payload) {
      if (!headers["Content-Type"] && !headers["content-type"]) {
        headers["Content-Type"] = "application/json; charset=utf-8";
      }
      body = JSON.stringify(payload);
      return response;
    },
    send(payload = "") {
      if (Buffer.isBuffer(payload)) {
        body = payload.toString("base64");
        isBase64Encoded = true;
        return response;
      }

      if (typeof payload === "object" && payload !== null) {
        return response.json(payload);
      }

      body = String(payload);
      return response;
    },
    end(payload = "") {
      return response.send(payload);
    },
    toNetlifyResponse() {
      return {
        statusCode,
        headers,
        body,
        isBase64Encoded,
      };
    },
  };

  return response;
}

export function withNodeHandler(handler) {
  return async function netlifyHandler(event) {
    const req = createRequest(event);
    const res = createResponse();

    await handler(req, res);

    return res.toNetlifyResponse();
  };
}
