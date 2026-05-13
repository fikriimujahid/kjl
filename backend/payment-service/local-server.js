const http = require("http");
const { URL } = require("url");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.resolve(__dirname, ".env") });

const { handler } = require("./build/lambda/handler.js");
const { ROUTES } = require("./build/lambda/routes.js");

const PORT = Number(process.env.PORT || 3002);
const routeDefinitions = Object.values(ROUTES);

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

function splitPath(pathname) {
  return pathname.split("/").filter(Boolean);
}

function isPathParameterSegment(segment) {
  return segment.startsWith("{") && segment.endsWith("}");
}

function safeDecodeURIComponent(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function matchPath(templatePath, pathname) {
  const templateSegments = splitPath(templatePath);
  const actualSegments = splitPath(pathname);

  if (templateSegments.length !== actualSegments.length) {
    return null;
  }

  const pathParameters = {};

  for (let index = 0; index < templateSegments.length; index += 1) {
    const templateSegment = templateSegments[index];
    const actualSegment = actualSegments[index];

    if (isPathParameterSegment(templateSegment)) {
      const parameterName = templateSegment.slice(1, -1);
      pathParameters[parameterName] = safeDecodeURIComponent(actualSegment);
      continue;
    }

    if (templateSegment !== actualSegment) {
      return null;
    }
  }

  return Object.keys(pathParameters).length > 0 ? pathParameters : undefined;
}

function resolveRoute(method, pathname) {
  if (method === "OPTIONS") {
    return { routeKey: `OPTIONS ${pathname}`, pathParameters: undefined };
  }

  for (const route of routeDefinitions) {
    if (route.method !== method) {
      continue;
    }

    const pathParameters = matchPath(route.path, pathname);
    if (pathParameters === null) {
      continue;
    }

    return { routeKey: route.routeKey, pathParameters };
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
    pathParameters: route.pathParameters,
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
