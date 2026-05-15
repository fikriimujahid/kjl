import { getAuthServiceEnv } from "../config/env";
import {
  CognitoOperationError,
  postToCognito,
  validateAuthResult
} from "@shared-cognito/core";
import type {
  CognitoAuthResult,
  CognitoForgotPasswordSuccess,
  CognitoInitiateAuthSuccess,
  CognitoSignUpSuccess,
  ForgotPasswordResult,
  SignUpResult
} from "@shared-cognito/core";

const getCognitoConfig = () => {
  const { COGNITO_API_ENDPOINT, COGNITO_USER_POOL_CLIENT_ID } = getAuthServiceEnv();

  return {
    apiEndpoint: String(COGNITO_API_ENDPOINT).trim(),
    userPoolClientId: String(COGNITO_USER_POOL_CLIENT_ID).trim()
  };
};

const postToConfiguredCognito = async <TResponse>(target: string, payload: Record<string, unknown>): Promise<TResponse> => {
  const { apiEndpoint } = getCognitoConfig();

  return postToCognito<TResponse>(apiEndpoint, target, payload);
};

export const loginWithPassword = async (email: string, password: string): Promise<CognitoAuthResult> => {
  const { userPoolClientId } = getCognitoConfig();

  const result = await postToConfiguredCognito<CognitoInitiateAuthSuccess>(
    "AWSCognitoIdentityProviderService.InitiateAuth",
    {
      AuthFlow: "USER_PASSWORD_AUTH",
      ClientId: userPoolClientId,
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
  const { userPoolClientId } = getCognitoConfig();

  const result = await postToConfiguredCognito<CognitoInitiateAuthSuccess>(
    "AWSCognitoIdentityProviderService.InitiateAuth",
    {
      AuthFlow: "REFRESH_TOKEN_AUTH",
      ClientId: userPoolClientId,
      AuthParameters: {
        REFRESH_TOKEN: refreshToken
      }
    }
  );

  return validateAuthResult(result);
};

export const revokeRefreshToken = async (refreshToken: string): Promise<void> => {
  const { userPoolClientId } = getCognitoConfig();

  await postToConfiguredCognito<Record<string, unknown>>(
    "AWSCognitoIdentityProviderService.RevokeToken",
    {
      ClientId: userPoolClientId,
      Token: refreshToken
    }
  );
};

export const registerWithPassword = async (
  email: string,
  password: string,
  fullName: string
): Promise<SignUpResult> => {
  const { userPoolClientId } = getCognitoConfig();

  const result = await postToConfiguredCognito<CognitoSignUpSuccess>(
    "AWSCognitoIdentityProviderService.SignUp",
    {
      ClientId: userPoolClientId,
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
  const { userPoolClientId } = getCognitoConfig();

  const result = await postToConfiguredCognito<CognitoForgotPasswordSuccess>(
    "AWSCognitoIdentityProviderService.ForgotPassword",
    {
      ClientId: userPoolClientId,
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
  const { userPoolClientId } = getCognitoConfig();

  await postToConfiguredCognito<Record<string, unknown>>(
    "AWSCognitoIdentityProviderService.ConfirmForgotPassword",
    {
      ClientId: userPoolClientId,
      Username: email,
      ConfirmationCode: confirmationCode,
      Password: newPassword
    }
  );
};
