import { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from "aws-lambda";
import { submitQuizExam } from "./handlers/submitQuizExam";
import { ROUTES } from "./routes";
import { jsonResponse, optionsResponse } from "./utils/response";

export const handler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyStructuredResultV2> => {
  if (event.requestContext.http.method === "OPTIONS") {
    return optionsResponse();
  }

  if (event.routeKey === ROUTES.SUBMIT_QUIZ_EXAM.routeKey) {
    return submitQuizExam(event);
  }

  return jsonResponse(404, { message: "Route not found" });
};

export const main = handler;
