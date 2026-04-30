const PRODUCT_DATA_URL = "https://kjl.fikri.dev/public-data/product.json";

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

  return jsonResponse(404, { message: "Route not found" });
};

exports.handler = handler;
exports.main = handler;
