import { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from "aws-lambda";
import { parseEventBody } from "../utils/request";
import { jsonResponse } from "../utils/response";
import { CognitoOperationError, registerWithPassword } from "../services/cognito";

export const register = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyStructuredResultV2> => {
  let payload: Record<string, unknown>;

  try {
    payload = parseEventBody(event);
  } catch {
    return jsonResponse(event, 400, { message: "Invalid JSON body" });
  }

  const email = typeof payload.email === "string" ? payload.email.trim() : "";
  const password = typeof payload.password === "string" ? payload.password : "";
  const fullName = typeof payload.fullName === "string" ? payload.fullName.trim() : "";

  if (!email || !password || !fullName) {
    return jsonResponse(event, 400, { message: "fullName, email, and password are required" });
  }

  try {
    const result = await registerWithPassword(email, password, fullName);

    return jsonResponse(event, 200, {
      userConfirmed: result.userConfirmed,
      codeDeliveryDetails: result.codeDeliveryDetails
    });
  } catch (error) {
    if (error instanceof CognitoOperationError) {
      return jsonResponse(event, error.statusCode, { message: error.message, code: error.code });
    }

    return jsonResponse(event, 500, { message: "Registration failed" });
  }
};
