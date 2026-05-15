export interface CognitoAuthResult {
  accessToken: string;
  idToken: string;
  refreshToken?: string;
  expiresIn?: number;
  tokenType?: string;
}

export interface SignUpResult {
  userConfirmed: boolean;
  codeDeliveryDetails: {
    attributeName?: string;
    deliveryMedium?: string;
    destination?: string;
  } | null;
}

export interface ForgotPasswordResult {
  codeDeliveryDetails: {
    attributeName?: string;
    deliveryMedium?: string;
    destination?: string;
  } | null;
}

export interface CognitoErrorPayload {
  __type?: string;
  message?: string;
}

export interface CognitoInitiateAuthSuccess {
  AuthenticationResult?: {
    AccessToken?: string;
    IdToken?: string;
    RefreshToken?: string;
    ExpiresIn?: number;
    TokenType?: string;
  };
  ChallengeName?: string;
}

export interface CognitoSignUpSuccess {
  UserConfirmed?: boolean;
  CodeDeliveryDetails?: {
    AttributeName?: string;
    DeliveryMedium?: string;
    Destination?: string;
  };
}

export interface CognitoForgotPasswordSuccess {
  CodeDeliveryDetails?: {
    AttributeName?: string;
    DeliveryMedium?: string;
    Destination?: string;
  };
}

export class CognitoOperationError extends Error {
  readonly code: string;
  readonly statusCode: number;

  constructor(message: string, code = "InternalError", statusCode = 500) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
  }
}

export const normalizeEndpoint = (endpoint: string): string => {
  if (endpoint.endsWith("/")) {
    return endpoint;
  }

  return `${endpoint}/`;
};

export const mapCognitoErrorToHttp = (payload: CognitoErrorPayload): CognitoOperationError => {
  const errorCode = typeof payload.__type === "string" ? payload.__type.split("#").pop() ?? "CognitoError" : "CognitoError";
  const message = payload.message || "Cognito request failed";

  switch (errorCode) {
    case "NotAuthorizedException":
    case "UserNotFoundException":
      return new CognitoOperationError(message, errorCode, 401);
    case "UserNotConfirmedException":
      return new CognitoOperationError(message, errorCode, 403);
    case "UsernameExistsException":
      return new CognitoOperationError(message, errorCode, 409);
    case "InvalidParameterException":
    case "InvalidPasswordException":
      return new CognitoOperationError(message, errorCode, 400);
    case "TooManyRequestsException":
      return new CognitoOperationError(message, errorCode, 429);
    default:
      return new CognitoOperationError(message, errorCode, 502);
  }
};

export const postToCognito = async <TResponse>(
  endpoint: string,
  target: string,
  payload: Record<string, unknown>,
  fetcher: typeof fetch = fetch
): Promise<TResponse> => {
  const response = await fetcher(normalizeEndpoint(endpoint), {
    method: "POST",
    headers: {
      "content-type": "application/x-amz-json-1.1",
      "x-amz-target": target
    },
    body: JSON.stringify(payload)
  });

  const data = (await response.json().catch(() => ({}))) as TResponse & CognitoErrorPayload;

  if (!response.ok) {
    throw mapCognitoErrorToHttp(data);
  }

  return data;
};

export const validateAuthResult = (result: CognitoInitiateAuthSuccess): CognitoAuthResult => {
  if (result.ChallengeName) {
    throw new CognitoOperationError(
      "Account requires additional challenge. This flow is not supported yet.",
      "ChallengeRequired",
      400
    );
  }

  const accessToken = result.AuthenticationResult?.AccessToken;
  const idToken = result.AuthenticationResult?.IdToken;

  if (!accessToken || !idToken) {
    throw new CognitoOperationError("Authentication response is missing token data", "InvalidAuthResponse", 502);
  }

  return {
    accessToken,
    idToken,
    refreshToken: result.AuthenticationResult?.RefreshToken,
    expiresIn: result.AuthenticationResult?.ExpiresIn,
    tokenType: result.AuthenticationResult?.TokenType
  };
};