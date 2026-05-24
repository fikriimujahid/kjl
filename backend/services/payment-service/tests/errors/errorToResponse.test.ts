import { createErrorResponse } from "@shared-utils/response";
import { ValidationError } from "../../src/errors/applicationErrors";
import { mapErrorToResponse } from "../../src/errors/errorToResponse";

jest.mock("@shared-utils/response", () => ({
  createErrorResponse: jest.fn()
}));

describe("mapErrorToResponse", () => {
  const createErrorResponseMock = createErrorResponse as jest.MockedFunction<typeof createErrorResponse>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns null when error is not an ApplicationError", () => {
    const response = mapErrorToResponse({ headers: {}, requestContext: { requestId: "req-1" } }, new Error("boom"));

    expect(response).toBeNull();
    expect(createErrorResponseMock).not.toHaveBeenCalled();
  });

  it("maps ApplicationError using createErrorResponse and exposeMessage=true", () => {
    const mapped = { statusCode: 400, body: "{}" } as never;
    createErrorResponseMock.mockReturnValue(mapped);

    const event = {
      headers: { origin: "https://app.kjl.test" },
      requestContext: { requestId: "req-123" }
    };
    const error = new ValidationError("Invalid payload");

    const response = mapErrorToResponse(event, error);

    expect(createErrorResponseMock).toHaveBeenCalledWith(
      {
        headers: { origin: "https://app.kjl.test" },
        requestContext: { requestId: "req-123" }
      },
      400,
      "Invalid payload",
      { exposeMessage: true }
    );
    expect(response).toBe(mapped);
  });

  it("normalizes undefined headers to empty object", () => {
    const mapped = { statusCode: 401, body: "{}" } as never;
    createErrorResponseMock.mockReturnValue(mapped);

    const response = mapErrorToResponse({ requestContext: { requestId: "req-2" } }, new ValidationError("X", 401));

    expect(createErrorResponseMock).toHaveBeenCalledWith(
      {
        headers: {},
        requestContext: { requestId: "req-2" }
      },
      401,
      "X",
      { exposeMessage: true }
    );
    expect(response).toBe(mapped);
  });
});
