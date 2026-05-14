const http = require("http");
const { URL } = require("url");
const { handler } = require("./build/lambda/services/auth-service/src/handler.js");
const { ROUTES } = require("./build/lambda/services/auth-service/src/routes.js");

const PORT = Number(process.env.PORT || 3004);
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
  const rawBody = await readRequestBody(req);

  const event = {
    version: "2.0",
    routeKey: route.routeKey,
    rawPath: requestUrl.pathname,
    rawQueryString: requestUrl.search.startsWith("?") ? requestUrl.search.slice(1) : requestUrl.search,
    cookies: headers.cookie ? [headers.cookie] : undefined,
    headers,
    requestContext: {
      http: {
        method: req.method || "GET",
        path: requestUrl.pathname
      }
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

    if (Array.isArray(result.cookies) && result.cookies.length > 0) {
      responseHeaders["set-cookie"] = result.cookies;
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
  console.log(`auth-service local server is running at http://localhost:${PORT}`);
});
