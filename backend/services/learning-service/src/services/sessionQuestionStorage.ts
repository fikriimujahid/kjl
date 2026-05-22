import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { createLogger } from "@shared-utils/logger";
import {
  InvalidSessionQuestionsPayloadError,
  SessionQuestionsNotFoundError
} from "../errors/applicationErrors";
import { getLearningServiceEnv } from "../config/env";
import { SessionQuestion } from "../types/learningTypes";

const logger = createLogger("learning-service");
const QUESTION_FILE_NAME = "question.json";

interface GetSessionQuestionsInput {
  productId: string;
  topicId: string;
  sessionId: string;
}

const isString = (value: unknown): value is string => typeof value === "string";

const isQuestionOption = (
  value: unknown
): value is {
  id: string;
  text: string;
} => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return isString(candidate.id) && isString(candidate.text);
};

const isQuestion = (value: unknown): value is SessionQuestion => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  if (!isString(candidate.id) || !isString(candidate.text)) {
    return false;
  }

  if (candidate.image !== undefined && !isString(candidate.image)) {
    return false;
  }

  if (candidate.audio !== undefined && !isString(candidate.audio)) {
    return false;
  }

  if (!Array.isArray(candidate.options)) {
    return false;
  }

  return candidate.options.every(isQuestionOption);
};

const readBodyAsString = async (body: unknown): Promise<string> => {
  if (!body) {
    return "";
  }

  if (typeof (body as { transformToString?: () => Promise<string> }).transformToString === "function") {
    return (body as { transformToString: () => Promise<string> }).transformToString();
  }

  const chunks: Buffer[] = [];
  for await (const chunk of body as AsyncIterable<Uint8Array>) {
    chunks.push(Buffer.from(chunk));
  }

  return Buffer.concat(chunks).toString("utf-8");
};

const isNoSuchKeyError = (error: unknown): boolean => {
  if (!error || typeof error !== "object") {
    return false;
  }

  const candidate = error as Record<string, unknown>;
  return candidate.name === "NoSuchKey" || candidate.Code === "NoSuchKey";
};

export const getSessionQuestionsFromStorage = async (
  input: GetSessionQuestionsInput
): Promise<SessionQuestion[]> => {
  const environment = getLearningServiceEnv();
  const bucketName = environment.MEDIA_PRIVATE_BUCKET_NAME;
  const key = `learning-content/${input.productId}/${input.topicId}/${input.sessionId}/${QUESTION_FILE_NAME}`;
  const s3Client = new S3Client({});

  try {
    const getObjectResponse = await s3Client.send(
      new GetObjectCommand({
        Bucket: bucketName,
        Key: key
      })
    );

    const bodyString = await readBodyAsString(getObjectResponse.Body);
    const payload: unknown = JSON.parse(bodyString);

    if (!Array.isArray(payload) || !payload.every(isQuestion)) {
      throw new InvalidSessionQuestionsPayloadError();
    }

    return payload;
  } catch (error) {
    if (isNoSuchKeyError(error)) {
      logger.warn("s3.learningContent.questions.notFound", {
        bucketName,
        key
      });
      throw new SessionQuestionsNotFoundError();
    }

    if (error instanceof InvalidSessionQuestionsPayloadError) {
      logger.error("s3.learningContent.questions.invalidPayload", {
        bucketName,
        key
      });
      throw error;
    }

    logger.error("s3.learningContent.questions.failure", {
      bucketName,
      key,
      error
    });
    throw error;
  }
};
