import {
  AuthenticationRequiredError,
  ForbiddenLearningContentAccessError,
  SessionNotFoundError,
  UnsupportedSessionTypeError
} from "../errors/applicationErrors";
import {
  getOwnedProductsByUserIdInternal,
  getSessionByIdInternal
} from "../services/productServiceInternalClient";
import { getSessionImageSignedUrls } from "../services/sessionImageStorage";
import { SessionImageContent } from "../types/learningTypes";

export interface GetSessionImagesInput {
  productId: string;
  topicId: string;
  sessionId: string;
  authenticatedUserId?: string | null;
}

export const getSessionImages = async (
  input: GetSessionImagesInput
): Promise<SessionImageContent> => {
  if (!input.authenticatedUserId) {
    throw new AuthenticationRequiredError();
  }

  const ownedProducts = await getOwnedProductsByUserIdInternal(input.authenticatedUserId);
  const hasAccess = ownedProducts.some((ownedProduct) => ownedProduct.productId === input.productId);

  if (!hasAccess) {
    throw new ForbiddenLearningContentAccessError();
  }

  const session = await getSessionByIdInternal(input.productId, input.topicId, input.sessionId);

  if (!session) {
    throw new SessionNotFoundError();
  }

  if (session.type !== "images") {
    throw new UnsupportedSessionTypeError(session.type);
  }

  const images = await getSessionImageSignedUrls({
    productId: input.productId,
    topicId: input.topicId,
    sessionId: input.sessionId
  });

  return {
    productId: input.productId,
    topicId: input.topicId,
    sessionId: input.sessionId,
    images
  };
};
