import { withBearerAuth } from "@shared-swagger/auth";
import { commonErrorResponses } from "@shared-swagger/errors";
import { OpenApiPathItem } from "@shared-swagger/openapi";
import { createOkResponse } from "@shared-swagger/responses";

export const loginDocPath = "/api/auth/login";

export const loginDocPathItem: OpenApiPathItem = {
  post: {
    summary: "Authenticate with email and password",
    tags: ["Auth"],
    security: withBearerAuth(),
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["email", "password"],
            properties: {
              email: { type: "string", format: "email" },
              password: { type: "string" }
            }
          }
        }
      }
    },
    responses: {
      "200": createOkResponse({
        type: "object",
        required: ["accessToken", "idToken", "user"],
        properties: {
          accessToken: { type: "string" },
          idToken: { type: "string" },
          expiresIn: { type: "number" },
          tokenType: { type: "string" },
          user: {
            type: "object",
            required: ["id", "email", "name"],
            properties: {
              id: { type: "string" },
              email: { type: "string", format: "email" },
              name: { type: "string" }
            }
          }
        }
      }),
      ...commonErrorResponses
    }
  }
};
