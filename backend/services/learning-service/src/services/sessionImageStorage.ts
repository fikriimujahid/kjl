import { GetObjectCommand, ListObjectsV2Command, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { createLogger } from "@shared-utils/logger";
import { getLearningServiceEnv } from "../config/env";

const logger = createLogger("learning-service");
const SIGNED_URL_TTL_SECONDS = 900;
const IMAGE_FILE_PATTERN = /\.(jpg|jpeg|png|webp|gif)$/i;

interface GetSessionImageSignedUrlsInput {
  productId: string;
  topicId: string;
  sessionId: string;
}

const resolveImageSortWeight = (key: string): number => {
  const fileName = key.split("/").pop() ?? "";
  const match = fileName.match(/image(\d+)/i);

  if (!match) {
    return Number.MAX_SAFE_INTEGER;
  }

  const parsedValue = Number.parseInt(match[1], 10);
  return Number.isFinite(parsedValue) ? parsedValue : Number.MAX_SAFE_INTEGER;
};

const sortImageKeys = (keys: string[]): string[] => {
  return [...keys].sort((left, right) => {
    const leftWeight = resolveImageSortWeight(left);
    const rightWeight = resolveImageSortWeight(right);

    if (leftWeight !== rightWeight) {
      return leftWeight - rightWeight;
    }

    return left.localeCompare(right, undefined, { numeric: true, sensitivity: "base" });
  });
};

export const getSessionImageSignedUrls = async (
  input: GetSessionImageSignedUrlsInput
): Promise<string[]> => {
  const environment = getLearningServiceEnv();
  const bucketName = environment.MEDIA_PRIVATE_BUCKET_NAME;
  const keyPrefix = `learning-content/${input.productId}/${input.topicId}/${input.sessionId}/`;

  const s3Client = new S3Client({});

  const listResponse = await s3Client.send(
    new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: keyPrefix
    })
  );

  const imageKeys = sortImageKeys(
    (listResponse.Contents ?? [])
      .map((content) => content.Key)
      .filter((key): key is string => typeof key === "string" && IMAGE_FILE_PATTERN.test(key))
  );

  if (imageKeys.length === 0) {
    logger.warn("s3.learningContent.images.empty", {
      bucketName,
      keyPrefix
    });
    return [];
  }

  const signedUrls = await Promise.all(
    imageKeys.map(async (key) => {
      const command = new GetObjectCommand({
        Bucket: bucketName,
        Key: key
      });

      return getSignedUrl(s3Client, command, {
        expiresIn: SIGNED_URL_TTL_SECONDS
      });
    })
  );

  return signedUrls;
};
