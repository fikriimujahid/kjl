import { APIGatewayProxyEventV2, APIGatewayProxyEventV2WithJWTAuthorizer } from "aws-lambda";

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
}

export const getAuthenticatedUser = (event: APIGatewayProxyEventV2): AuthenticatedUser | null => {
  const claims = (event as APIGatewayProxyEventV2WithJWTAuthorizer).requestContext.authorizer?.jwt
    ?.claims as Record<string, string> | undefined;

  if (!claims) {
    return null;
  }

  const userId = claims.sub ?? claims["cognito:username"];

  if (!userId) {
    return null;
  }

  return {
    id: userId,
    email: claims.email ?? "",
    name: claims.name ?? ""
  };
};
