import { GetObjectCommand } from "@aws-sdk/client-s3";
import { QuizAnswerKeyRecord } from "../models/quiz";
import { s3Client } from "../clients/awsClients";
import { getBodyAsString } from "../utils/s3BodyParser";
import { isQuizAnswerKeyRecord } from "../utils/validators";

const MEDIA_PRIVATE_BUCKET_NAME = process.env.MEDIA_PRIVATE_BUCKET_NAME;

const getMediaBucketName = (): string => {
  if (!MEDIA_PRIVATE_BUCKET_NAME) {
    throw new Error("Missing MEDIA_PRIVATE_BUCKET_NAME environment variable");
  }

  return MEDIA_PRIVATE_BUCKET_NAME;
};

export const fetchQuizAnswerKey = async (
  productId: string,
  topicId: string,
  sessionId: string
): Promise<QuizAnswerKeyRecord[]> => {
  const bucketName = getMediaBucketName();
  const answerKeyPath = `products/${productId}/${topicId}/${sessionId}/answer.json`;

  const response = await s3Client.send(
    new GetObjectCommand({
      Bucket: bucketName,
      Key: answerKeyPath
    })
  );

  if (!response.Body) {
    throw new Error("answer.json body is empty");
  }

  const payloadText = await getBodyAsString(response.Body);
  const parsedPayload: unknown = JSON.parse(payloadText);

  if (!Array.isArray(parsedPayload)) {
    throw new Error("Invalid answer.json format: expected array");
  }

  return parsedPayload.filter(isQuizAnswerKeyRecord);
};
