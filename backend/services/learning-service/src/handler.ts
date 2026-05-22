import { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from "aws-lambda";
import { createLogger } from "@shared-utils/logger";
import { logRequestReceived, logRequestResult } from "@shared-utils/requestLifecycle";
import { createErrorResponse, optionsResponse } from "@shared-utils/response";
import { getLearningServiceEnv } from "./config/env";
import { checkSessionAnswerHandler } from "./handlers/checkSessionAnswerHandler";
import { finishSessionAttemptHandler } from "./handlers/finishSessionAttemptHandler";
import { getSessionAttemptsHandler } from "./handlers/getSessionAttemptsHandler";
import { getSessionImagesHandler } from "./handlers/getSessionImagesHandler";
import { getSessionQuestionsHandler } from "./handlers/getSessionQuestionsHandler";
import { startSessionAttemptHandler } from "./handlers/startSessionAttemptHandler";
import { ROUTES } from "./routes";

getLearningServiceEnv();

const logger = createLogger("learning-service");

const routeHandlers: Record<
  string,
  (event: APIGatewayProxyEventV2) => Promise<APIGatewayProxyStructuredResultV2>
> = {
  [ROUTES.GET_SESSION_IMAGES.routeKey]: getSessionImagesHandler,
  [ROUTES.GET_SESSION_QUESTIONS.routeKey]: getSessionQuestionsHandler,
  [ROUTES.CHECK_SESSION_ANSWER.routeKey]: checkSessionAnswerHandler,
  [ROUTES.START_SESSION_ATTEMPT.routeKey]: startSessionAttemptHandler,
  [ROUTES.GET_SESSION_ATTEMPTS.routeKey]: getSessionAttemptsHandler,
  [ROUTES.FINISH_SESSION_ATTEMPT.routeKey]: finishSessionAttemptHandler
};

export const handler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyStructuredResultV2> => {
  const requestContext = {
    requestId: event.requestContext?.requestId,
    routeKey: event.routeKey,
    method: event.requestContext.http.method
  };

  logRequestReceived(logger, requestContext);

  if (event.requestContext.http.method === "OPTIONS") {
    return logRequestResult(logger, requestContext, optionsResponse(event));
  }

  const routeHandler = routeHandlers[event.routeKey ?? ""];

  if (routeHandler) {
    return logRequestResult(logger, requestContext, await routeHandler(event));
  }

  return logRequestResult(
    logger,
    requestContext,
    createErrorResponse(event, 404, "Route not found", {
      code: "ROUTE_NOT_FOUND"
    })
  );
};

export const main = handler;
