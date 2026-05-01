const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, QueryCommand } = require("@aws-sdk/lib-dynamodb");

const PRODUCT_DATA_URL = "https://kjl.fikri.dev/public-data/product.json";
const PURCHASES_TABLE_NAME = process.env.PURCHASES_TABLE_NAME;
const dynamoDbClient = DynamoDBDocumentClient.from(new DynamoDBClient({}));

const isProduct = (value) => {
  if (!value || typeof value !== "object") {
    return false;
  }

  return (
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    typeof value.price === "number" &&
    typeof value.description === "string"
  );
};

const fetchProducts = async () => {
  const response = await fetch(PRODUCT_DATA_URL);

  if (!response.ok) {
    throw new Error(`Failed to fetch product data: ${response.status}`);
  }

  const payload = await response.json();

  if (!Array.isArray(payload)) {
    throw new Error("Invalid product payload format");
  }

  return payload.filter(isProduct);
};

const isPurchaseRecord = (value) => {
  if (!value || typeof value !== "object") {
    return false;
  }

  return (
    typeof value.PK === "string" &&
    typeof value.SK === "string" &&
    value.entityType === "PURCHASE" &&
    typeof value.userId === "string" &&
    typeof value.productId === "string" &&
    typeof value.purchaseDate === "string" &&
    typeof value.expiryDate === "string"
  );
};

const mapPurchaseRecord = (item) => {
  const derivedId = item.SK.startsWith("PURCHASE#")
    ? item.SK.slice("PURCHASE#".length)
    : item.SK;

  return {
    id: item.purchaseId || derivedId,
    productId: item.productId,
    userId: item.userId,
    purchaseDate: item.purchaseDate,
    accessExpiryDate: item.expiryDate
  };
};

const jsonResponse = (statusCode, body) => ({
  statusCode,
  headers: {
    "content-type": "application/json",
    "access-control-allow-origin": "*"
  },
  body: JSON.stringify(body)
});

const handler = async (event) => {
  if (event.routeKey === "GET /api/products") {
    try {
      const products = await fetchProducts();
      const list = products.map(({ id, name, price }) => ({ id, name, price }));
      return jsonResponse(200, list);
    } catch {
      return jsonResponse(502, { message: "Failed to load product data" });
    }
  }

  if (event.routeKey === "GET /api/products/{id}") {
    const productId = event.pathParameters && event.pathParameters.id;
    if (!productId) {
      return jsonResponse(400, { message: "Missing product id" });
    }

    try {
      const products = await fetchProducts();
      const product = products.find((item) => item.id === productId);

      if (!product) {
        return jsonResponse(404, { message: "Product not found" });
      }

      return jsonResponse(200, product);
    } catch {
      return jsonResponse(502, { message: "Failed to load product data" });
    }
  }

  if (event.routeKey === "GET /api/purchased-products/{userId}") {
    const userId = event.pathParameters && event.pathParameters.userId;
    const claims = event.requestContext && event.requestContext.authorizer && event.requestContext.authorizer.jwt && event.requestContext.authorizer.jwt.claims;
    const authenticatedUserId = (claims && (claims.sub || claims["cognito:username"])) || null;

    if (!userId) {
      return jsonResponse(400, { message: "Missing user id" });
    }

    if (!authenticatedUserId) {
      return jsonResponse(401, { message: "Unauthorized" });
    }

    if (authenticatedUserId !== userId) {
      return jsonResponse(403, { message: "Forbidden" });
    }

    try {
      if (!PURCHASES_TABLE_NAME) {
        throw new Error("Missing PURCHASES_TABLE_NAME environment variable");
      }

      const response = await dynamoDbClient.send(
        new QueryCommand({
          TableName: PURCHASES_TABLE_NAME,
          KeyConditionExpression: "#pk = :pk AND begins_with(#sk, :skPrefix)",
          ExpressionAttributeNames: {
            "#pk": "PK",
            "#sk": "SK"
          },
          ExpressionAttributeValues: {
            ":pk": `USER#${userId}`,
            ":skPrefix": "PURCHASE#"
          }
        })
      );

      const purchases = (response.Items || []).filter(isPurchaseRecord).map(mapPurchaseRecord);
      return jsonResponse(200, purchases);
    } catch {
      return jsonResponse(502, { message: "Failed to load purchased product data" });
    }
  }

  return jsonResponse(404, { message: "Route not found" });
};

exports.handler = handler;
exports.main = handler;
