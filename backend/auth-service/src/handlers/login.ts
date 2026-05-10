import { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from "aws-lambda";
import { buildRefreshCookie } from "../utils/cookies";
import { parseEventBody } from "../utils/request";
import { jsonResponse } from "../utils/response";
import { getAuthUserFromIdToken } from "../utils/token";
import { CognitoOperationError, loginWithPassword } from "../services/cognito";

export const login = async (
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

  if (!email || !password) {
    return jsonResponse(event, 400, { message: "email and password are required" });
  }

  try {
    const authResult = await loginWithPassword(email, password);
    const user = getAuthUserFromIdToken(authResult.idToken) ?? {
      id: email,
      email,
      name: email.split("@")[0] || "Pengguna"
    };

    return jsonResponse(
      event,
      200,
      {
        accessToken: authResult.accessToken,
        idToken: authResult.idToken,
        expiresIn: authResult.expiresIn,
        tokenType: authResult.tokenType,
        user
      },
      {
        cookies: [buildRefreshCookie(authResult.refreshToken ?? "")]
      }
    );
  } catch (error) {
    if (error instanceof CognitoOperationError) {
      return jsonResponse(event, error.statusCode, { message: error.message, code: error.code });
    }

    return jsonResponse(event, 500, { message: "Login failed" });
  }
};
