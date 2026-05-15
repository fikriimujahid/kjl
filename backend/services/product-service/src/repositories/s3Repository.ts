import { GetObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3Client } from "../clients/awsClients";
import { QuizQuestionRecord } from "../types/productTypes";
import { logProductServiceInfo } from "../utils/logger";
import { getBodyAsString } from "../utils/s3BodyParser";
import { isQuizQuestionRecord } from "../utils/validators";
import { getProductServiceEnv } from "../config/env";

const SIGNED_URL_TTL_SECONDS = 3600;

const getMediaBucketName = (): string => {
  return getProductServiceEnv().MEDIA_PRIVATE_BUCKET_NAME;
};

const getObjectIdFromKey = (key: string): string => {
  const segments = key.split("/");
  return segments[segments.length - 1] ?? key;
};

const getQuizQuestionKey = (objectKeys: string[]): string | null => {
  const exactMatch = objectKeys.find((key) => getObjectIdFromKey(key).toLowerCase() === "question.json");
  return exactMatch ?? null;
};

export const buildSignedObjectUrl = async (key: string): Promise<string> => {
  const bucketName = getMediaBucketName();
  const logContext = {
    bucketName,
    key,
    expiresInSeconds: SIGNED_URL_TTL_SECONDS
  };

  logProductServiceInfo("s3.getSignedUrl.start", logContext);

  try {
    const signedUrl = await getSignedUrl(
      s3Client,
      new GetObjectCommand({
        Bucket: bucketName,
        Key: key
      }),
      { expiresIn: SIGNED_URL_TTL_SECONDS }
    );

    logProductServiceInfo("s3.getSignedUrl.success", {
      ...logContext,
      hasSignedUrl: Boolean(signedUrl)
    });

    return signedUrl;
  } catch (error) {
    console.log("[ERROR]", "s3.getSignedUrl.failure", {
      ...logContext,
      error
    });
    throw error;
  }
};

export const listSessionObjectKeys = async (prefix: string): Promise<string[]> => {
  const bucketName = getMediaBucketName();
  const logContext = {
    bucketName,
    prefix
  };
  const objectKeys: string[] = [];
  let continuationToken: string | undefined;

  logProductServiceInfo("s3.listObjects.start", logContext);

  try {
    do {
      const response = await s3Client.send(
        new ListObjectsV2Command({
          Bucket: bucketName,
          Prefix: prefix,
          ContinuationToken: continuationToken
        })
      );

      logProductServiceInfo("s3.listObjects.page", {
        ...logContext,
        keyCount: response.KeyCount ?? 0,
        isTruncated: response.IsTruncated ?? false,
        hasContinuationToken: Boolean(continuationToken),
        hasNextContinuationToken: Boolean(response.NextContinuationToken)
      });

      for (const item of response.Contents ?? []) {
        if (item.Key && !item.Key.endsWith("/")) {
          objectKeys.push(item.Key);
        }
      }

      continuationToken = response.NextContinuationToken;
    } while (continuationToken);

    const sortedKeys = objectKeys.sort((left, right) => left.localeCompare(right));

    logProductServiceInfo("s3.listObjects.success", {
      ...logContext,
      objectKeyCount: sortedKeys.length,
      objectKeys: sortedKeys
    });

    return sortedKeys;
  } catch (error) {
    console.log("[ERROR]", "s3.listObjects.failure", {
      ...logContext,
      error
    });
    throw error;
  }
};

export const fetchQuizQuestionsFromSessionObjects = async (
  objectKeys: string[]
): Promise<QuizQuestionRecord[]> => {
  const bucketName = getMediaBucketName();
  const questionKey = getQuizQuestionKey(objectKeys);

  if (!questionKey) {
    return [];
  }

  const logContext = {
    bucketName,
    key: questionKey
  };

  logProductServiceInfo("s3.getQuizQuestions.start", logContext);

  try {
    const response = await s3Client.send(
      new GetObjectCommand({
        Bucket: bucketName,
        Key: questionKey
      })
    );

    if (!response.Body) {
      throw new Error("question.json body is empty");
    }

    const questionPayloadText = await getBodyAsString(response.Body);
    const parsedPayload: unknown = JSON.parse(questionPayloadText);

    if (!Array.isArray(parsedPayload)) {
      throw new Error("Invalid question.json format: expected array");
    }

    const questions = parsedPayload.filter(isQuizQuestionRecord);

    logProductServiceInfo("s3.getQuizQuestions.success", {
      ...logContext,
      questionCount: questions.length
    });

    return questions;
  } catch (error) {
    console.log("[ERROR]", "s3.getQuizQuestions.failure", {
      ...logContext,
      error
    });
    throw error;
  }
};
