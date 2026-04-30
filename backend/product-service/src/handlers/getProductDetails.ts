import { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from "aws-lambda";
import { getProductById } from "../services/productService";
import { jsonResponse } from "../utils/response";

export const getProductDetails = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyStructuredResultV2> => {
  const productId = event.pathParameters?.id;

  if (!productId) {
    return jsonResponse(400, { message: "Missing product id" });
  }

  try {
    const product = await getProductById(productId);

    if (!product) {
      return jsonResponse(404, { message: "Product not found" });
    }

    return jsonResponse(200, product);
  } catch {
    return jsonResponse(502, { message: "Failed to load product data" });
  }
};
