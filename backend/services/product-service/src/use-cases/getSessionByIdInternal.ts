import { findSessionByIdInternal } from "../repositories/findSessionByIdInternal";
import { SessionRecord } from "../types/productTypes";

export interface GetSessionByIdInternalInput {
  productId: string;
  topicId: string;
  sessionId: string;
}

export const getSessionByIdInternal = async (
  input: GetSessionByIdInternalInput
): Promise<SessionRecord | null> => {
  return findSessionByIdInternal(input.productId, input.topicId, input.sessionId);
};