const http = require("http");
const { URL } = require("url");
const { handler } = require("./build/lambda/handler.js");

const PORT = Number(process.env.PORT || 3002);

function normalizeHeaders(headers) {
  const normalized = {};
  for (const [key, value] of Object.entries(headers)) {
    if (Array.isArray(value)) {
      normalized[key.toLowerCase()] = value.join(",");
      continue;
    }
    if (value != null) {
      normalized[key.toLowerCase()] = String(value);
    }
  }
  return normalized;
}

function decodeJwtClaims(authorizationHeader) {
  if (!authorizationHeader || !authorizationHeader.toLowerCase().startsWith("bearer ")) {
    return undefined;
  }

  const token = authorizationHeader.slice(7).trim();
  const parts = token.split(".");

  if (parts.length < 2) {
    return undefined;
  }

  try {
    const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const paddedPayload = payload + "=".repeat((4 - (payload.length % 4)) % 4);
    return JSON.parse(Buffer.from(paddedPayload, "base64").toString("utf8"));
  } catch {
    return undefined;
  }
}

function readRequestBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

function resolveRoute(method, pathname) {
  if (method === "POST" && pathname === "/api/payments/create") {
    return { routeKey: "POST /api/payments/create" };
  }

  if (method === "POST" && pathname === "/api/payments/webhook") {
    return { routeKey: "POST /api/payments/webhook" };
  }

  if (method === "OPTIONS") {
    return { routeKey: `OPTIONS ${pathname}` };
  }

  return null;
}

const server = http.createServer(async (req, res) => {
  const requestUrl = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
  const route = resolveRoute(req.method || "GET", requestUrl.pathname);

  if (!route) {
    res.writeHead(404, { "content-type": "application/json" });
    res.end(JSON.stringify({ message: "Route not found" }));
    return;
  }

  const headers = normalizeHeaders(req.headers);
  const claims = decodeJwtClaims(headers.authorization);
  const rawBody = await readRequestBody(req);

  const event = {
    version: "2.0",
    routeKey: route.routeKey,
    rawPath: requestUrl.pathname,
    rawQueryString: requestUrl.search.startsWith("?") ? requestUrl.search.slice(1) : requestUrl.search,
    headers,
    requestContext: {
      http: {
        method: req.method || "GET",
        path: requestUrl.pathname
      },
      authorizer: claims ? { jwt: { claims } } : undefined
    },
    isBase64Encoded: false,
    body: rawBody || undefined
  };

  try {
    const result = await handler(event);
    const responseHeaders = { ...(result.headers || {}) };

    if (!responseHeaders["content-type"]) {
      responseHeaders["content-type"] = "application/json";
    }

    res.writeHead(result.statusCode || 200, responseHeaders);
    res.end(result.body || "");
  } catch (error) {
    res.writeHead(500, { "content-type": "application/json" });
    res.end(
      JSON.stringify({
        message: "Local server error",
        error: error instanceof Error ? error.message : String(error)
      })
    );
  }
});

server.listen(PORT, () => {
  console.log(`payment-service local server is running at http://localhost:${PORT}`);
});
