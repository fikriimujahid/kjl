import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { createLogger } from "@shared-utils/logger";
import {
  InvalidSessionAnswersPayloadError,
  SessionAnswersNotFoundError
} from "../errors/applicationErrors";
import { getLearningServiceEnv } from "../config/env";
import { SessionAnswerKey } from "../types/learningTypes";

const logger = createLogger("learning-service");
const ANSWER_FILE_NAME = "answer.json";

interface GetSessionAnswersInput {
  productId: string;
  topicId: string;
  sessionId: string;
}

const isString = (value: unknown): value is string => typeof value === "string";
const isNumber = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);

const isSessionAnswerKey = (value: unknown): value is SessionAnswerKey => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  if (!isString(candidate.id) || !isString(candidate.correctAnswer) || !isNumber(candidate.score)) {
    return false;
  }

  if (candidate.explanation !== undefined && !isString(candidate.explanation)) {
    return false;
  }

  return true;
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

export const getSessionAnswersFromStorage = async (
  input: GetSessionAnswersInput
): Promise<SessionAnswerKey[]> => {
  const environment = getLearningServiceEnv();
  const bucketName = environment.MEDIA_PRIVATE_BUCKET_NAME;
  const key = `learning-content/${input.productId}/${input.topicId}/${input.sessionId}/${ANSWER_FILE_NAME}`;
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

    if (!Array.isArray(payload) || !payload.every(isSessionAnswerKey)) {
      throw new InvalidSessionAnswersPayloadError();
    }

    return payload;
  } catch (error) {
    if (isNoSuchKeyError(error)) {
      logger.warn("s3.learningContent.answers.notFound", {
        bucketName,
        key
      });
      throw new SessionAnswersNotFoundError();
    }

    if (error instanceof InvalidSessionAnswersPayloadError) {
      logger.error("s3.learningContent.answers.invalidPayload", {
        bucketName,
        key
      });
      throw error;
    }

    logger.error("s3.learningContent.answers.failure", {
      bucketName,
      key,
      error
    });
    throw error;
  }
};
