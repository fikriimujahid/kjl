import { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from "aws-lambda";
import { getAuthenticatedUser } from "@shared-utils/auth";
import { createSuccessResponse } from "@shared-utils/response";
import { mapPaymentErrorToResponse } from "../errors/errorToResponse";
import { UnauthorizedError } from "../errors/applicationErrors";
import { getPaymentHistory } from "../use-cases/getPaymentHistory";

export const getPaymentHistoryHandler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyStructuredResultV2> => {
  try {
    const authenticatedUser = getAuthenticatedUser(event);

    if (!authenticatedUser) {
      throw new UnauthorizedError("Unauthorized");
    }

    const history = await getPaymentHistory({
      authenticatedUser
    });

    return createSuccessResponse(event, 200, history);
  } catch (error) {
    return mapPaymentErrorToResponse(event, error, {
      statusCode: 502,
      message: "Failed to load payment history",
      code: "PAYMENT_HISTORY_FETCH_FAILED"
    });
  }
};
