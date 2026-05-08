// import {
//   APIGatewayProxyEventV2,
//   APIGatewayProxyEventV2WithJWTAuthorizer,
//   APIGatewayProxyStructuredResultV2
// } from "aws-lambda";
// import { SessionDetail } from "../models/product";
// import { getProductSessionDetails } from "../services/productService";
// import { jsonResponse } from "../utils/response";

// const serializeError = (error: unknown) => {
//   if (error instanceof Error) {
//     return {
//       name: error.name,
//       message: error.message,
//       stack: error.stack
//     };
//   }

//   return {
//     message: String(error)
//   };
// };

// const summarizeResponseBody = (body: unknown) => {
//   if (Array.isArray(body)) {
//     return {
//       itemCount: body.length,
//       items: body.map((item) => {
//         const sessionDetail = item as SessionDetail;

//         return {
//           id: sessionDetail.id,
//           hasText: Boolean(sessionDetail.text),
//           hasContentUrl: Boolean(sessionDetail.contentUrl),
//           hasImage: Boolean(sessionDetail.image),
//           hasAudio: Boolean(sessionDetail.audio),
//           optionCount: sessionDetail.options?.length ?? 0
//         };
//       })
//     };
//   }

//   return body;
// };

// const createLogContext = (
//   event: APIGatewayProxyEventV2,
//   authenticatedUserId?: string
// ) => {
//   return {
//     requestId: event.requestContext.requestId,
//     routeKey: event.routeKey,
//     path: event.rawPath,
//     method: event.requestContext.http.method,
//     sourceIp: event.requestContext.http.sourceIp,
//     userAgent: event.requestContext.http.userAgent,
//     hasAuthorizationHeader: Boolean(event.headers?.authorization),
//     userId: authenticatedUserId ?? null,
//     pathParameters: event.pathParameters ?? {}
//   };
// };

// const logAndRespond = (
//   statusCode: number,
//   body: unknown,
//   logContext: ReturnType<typeof createLogContext>
// ): APIGatewayProxyStructuredResultV2 => {
//   console.info("productSessionDetails.response", {
//     ...logContext,
//     statusCode,
//     body: summarizeResponseBody(body)
//   });

//   return jsonResponse(statusCode, body);
// };

// export const getProductSessionDetailsHandler = async (
//   event: APIGatewayProxyEventV2
// ): Promise<APIGatewayProxyStructuredResultV2> => {
//   const productId = event.pathParameters?.productId;
//   const topicId = event.pathParameters?.topicId;
//   const sessionId = event.pathParameters?.sessionId;
//   const claims = (event as APIGatewayProxyEventV2WithJWTAuthorizer).requestContext.authorizer?.jwt
//     ?.claims as Record<string, string> | undefined;
//   const authenticatedUserId = claims?.sub ?? claims?.["cognito:username"];
//   const logContext = createLogContext(event, authenticatedUserId);

//   console.info("productSessionDetails.request", logContext);

//   if (!authenticatedUserId) {
//     return logAndRespond(401, { message: "Unauthorized" }, logContext);
//   }

//   if (!productId || !topicId || !sessionId) {
//     return logAndRespond(400, { message: "Missing session path parameters" }, logContext);
//   }

//   try {
//     const sessionDetails = await getProductSessionDetails(
//       authenticatedUserId,
//       productId,
//       topicId,
//       sessionId
//     );

//     if (!sessionDetails) {
//       return logAndRespond(404, { message: "Session not found or not accessible" }, logContext);
//     }

//     if (sessionDetails.length === 0) {
//       return logAndRespond(404, { message: "Session media not found" }, logContext);
//     }

//     return logAndRespond(200, sessionDetails, logContext);
//   } catch (error) {
//     console.error("productSessionDetails.error", {
//       ...logContext,
//       error: serializeError(error)
//     });

//     return logAndRespond(502, { message: "Failed to load session data" }, logContext);
//   }
// };