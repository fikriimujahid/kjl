const COGNITO_API_ENDPOINT = (process.env.COGNITO_API_ENDPOINT ?? "").trim();
const COGNITO_USER_POOL_CLIENT_ID = (process.env.COGNITO_USER_POOL_CLIENT_ID ?? "").trim();

export interface CognitoAuthResult {
  accessToken: string;
  idToken: string;
  refreshToken?: string;
  expiresIn?: number;
  tokenType?: string;
}

interface CognitoErrorPayload {
  __type?: string;
  message?: string;
}

interface CognitoInitiateAuthSuccess {
  AuthenticationResult?: {
    AccessToken?: string;
    IdToken?: string;
    RefreshToken?: string;
    ExpiresIn?: number;
    TokenType?: string;
  };
  ChallengeName?: string;
}

interface CognitoSignUpSuccess {
  UserConfirmed?: boolean;
  CodeDeliveryDetails?: {
    AttributeName?: string;
    DeliveryMedium?: string;
    Destination?: string;
  };
}

interface CognitoForgotPasswordSuccess {
  CodeDeliveryDetails?: {
    AttributeName?: string;
    DeliveryMedium?: string;
    Destination?: string;
  };
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

export class CognitoOperationError extends Error {
  readonly code: string;
  readonly statusCode: number;

  constructor(message: string, code = "InternalError", statusCode = 500) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
  }
}

const ensureConfig = (): void => {
  if (!COGNITO_API_ENDPOINT) {
    throw new CognitoOperationError("Missing COGNITO_API_ENDPOINT environment variable", "ConfigError", 500);
  }

  if (!COGNITO_USER_POOL_CLIENT_ID) {
    throw new CognitoOperationError("Missing COGNITO_USER_POOL_CLIENT_ID environment variable", "ConfigError", 500);
  }
};

const normalizeEndpoint = (endpoint: string): string => {
  if (endpoint.endsWith("/")) {
    return endpoint;
  }

  return `${endpoint}/`;
};

const mapCognitoErrorToHttp = (payload: CognitoErrorPayload): CognitoOperationError => {
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

const postToCognito = async <TResponse>(target: string, payload: Record<string, unknown>): Promise<TResponse> => {
  ensureConfig();

  const response = await fetch(normalizeEndpoint(COGNITO_API_ENDPOINT), {
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

const validateAuthResult = (result: CognitoInitiateAuthSuccess): CognitoAuthResult => {
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

export const loginWithPassword = async (email: string, password: string): Promise<CognitoAuthResult> => {
  const result = await postToCognito<CognitoInitiateAuthSuccess>(
    "AWSCognitoIdentityProviderService.InitiateAuth",
    {
      AuthFlow: "USER_PASSWORD_AUTH",
      ClientId: COGNITO_USER_POOL_CLIENT_ID,
      AuthParameters: {
        USERNAME: email,
        PASSWORD: password
      }
    }
  );

  const authResult = validateAuthResult(result);

  if (!authResult.refreshToken) {
    throw new CognitoOperationError("Login succeeded but refresh token is missing", "MissingRefreshToken", 502);
  }

  return authResult;
};

export const refreshWithToken = async (refreshToken: string): Promise<CognitoAuthResult> => {
  const result = await postToCognito<CognitoInitiateAuthSuccess>(
    "AWSCognitoIdentityProviderService.InitiateAuth",
    {
      AuthFlow: "REFRESH_TOKEN_AUTH",
      ClientId: COGNITO_USER_POOL_CLIENT_ID,
      AuthParameters: {
        REFRESH_TOKEN: refreshToken
      }
    }
  );

  return validateAuthResult(result);
};

export const revokeRefreshToken = async (refreshToken: string): Promise<void> => {
  await postToCognito<Record<string, unknown>>(
    "AWSCognitoIdentityProviderService.RevokeToken",
    {
      ClientId: COGNITO_USER_POOL_CLIENT_ID,
      Token: refreshToken
    }
  );
};

export const registerWithPassword = async (
  email: string,
  password: string,
  fullName: string
): Promise<SignUpResult> => {
  const result = await postToCognito<CognitoSignUpSuccess>(
    "AWSCognitoIdentityProviderService.SignUp",
    {
      ClientId: COGNITO_USER_POOL_CLIENT_ID,
      Username: email,
      Password: password,
      UserAttributes: [
        {
          Name: "email",
          Value: email
        },
        {
          Name: "name",
          Value: fullName
        }
      ]
    }
  );

  return {
    userConfirmed: Boolean(result.UserConfirmed),
    codeDeliveryDetails: result.CodeDeliveryDetails
      ? {
          attributeName: result.CodeDeliveryDetails.AttributeName,
          deliveryMedium: result.CodeDeliveryDetails.DeliveryMedium,
          destination: result.CodeDeliveryDetails.Destination
        }
      : null
  };
};

export const requestForgotPassword = async (email: string): Promise<ForgotPasswordResult> => {
  const result = await postToCognito<CognitoForgotPasswordSuccess>(
    "AWSCognitoIdentityProviderService.ForgotPassword",
    {
      ClientId: COGNITO_USER_POOL_CLIENT_ID,
      Username: email
    }
  );

  return {
    codeDeliveryDetails: result.CodeDeliveryDetails
      ? {
          attributeName: result.CodeDeliveryDetails.AttributeName,
          deliveryMedium: result.CodeDeliveryDetails.DeliveryMedium,
          destination: result.CodeDeliveryDetails.Destination
        }
      : null
  };
};

export const confirmForgotPassword = async (
  email: string,
  confirmationCode: string,
  newPassword: string
): Promise<void> => {
  await postToCognito<Record<string, unknown>>(
    "AWSCognitoIdentityProviderService.ConfirmForgotPassword",
    {
      ClientId: COGNITO_USER_POOL_CLIENT_ID,
      Username: email,
      ConfirmationCode: confirmationCode,
      Password: newPassword
    }
  );
};
