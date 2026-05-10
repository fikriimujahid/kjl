import { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from "aws-lambda";
import { getProductDetailsById } from "../services/productService";
import { jsonResponse } from "../utils/response";

export const getProductDetails = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyStructuredResultV2> => {
  const productId = event.pathParameters?.id;

  if (!productId) {
    return jsonResponse(400, { message: "Missing product id" });
  }

  try {
    const productDetails = await getProductDetailsById(productId);

    if (!productDetails) {
      return jsonResponse(404, { message: "Product not found" });
    }

    return jsonResponse(200, productDetails);
  } catch {
    return jsonResponse(502, { message: "Failed to load product data" });
  }
};
