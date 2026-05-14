import { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from "aws-lambda";
import { getProducts } from "../services/productService";
import { jsonResponse } from "../utils/response";

export const getProductsHandler = async (
  _event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyStructuredResultV2> => {
  try {
    const products = await getProducts();
    return jsonResponse(200, products);
  } catch {
    return jsonResponse(502, { message: "Failed to load product data" });
  }
};
