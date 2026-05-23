import { createDynamoDocumentClient } from "@shared-dynamodb/client";
import { queryItems } from "@shared-dynamodb/queryItems";
import { updateItem } from "@shared-dynamodb/updateItem";
import { getAuthServiceEnv } from "../config/env";

const CHECKIN_PK_PREFIX = "USER#";
const CHECKIN_SK_PREFIX = "CHECKIN#";
const CHECKIN_ENTITY_TYPE = "USER_CHECKIN";

export interface UserSessionCheckinRecord extends Record<string, unknown> {
  PK: string;
  SK: string;
  entityType: string;
  userId: string;
  productId: string;
  topicId: string;
  sessionId: string;
  activityDate: string;
  checkInAt: string;
  updatedAt: string;
}

interface SaveUserSessionCheckinInput {
  userId: string;
  productId: string;
  topicId: string;
  sessionId: string;
  activityDate: string;
  timestampIso: string;
}

interface ListUserSessionCheckinsInput {
  userId: string;
  fromActivityDate: string;
  toActivityDate: string;
}

const toPartitionKey = (userId: string): string => `${CHECKIN_PK_PREFIX}${userId}`;
const toSortKey = (activityDate: string): string => `${CHECKIN_SK_PREFIX}${activityDate}`;

export const saveUserSessionCheckin = async (
  input: SaveUserSessionCheckinInput
): Promise<UserSessionCheckinRecord> => {
  const dynamoDbDocumentClient = createDynamoDocumentClient();
  const tableName = getAuthServiceEnv().DYNAMO_DB_TABLE_NAME;

  const savedCheckin = await updateItem<UserSessionCheckinRecord>(
    dynamoDbDocumentClient,
    {
      TableName: tableName,
      Key: {
        PK: toPartitionKey(input.userId),
        SK: toSortKey(input.activityDate)
      },
      UpdateExpression: [
        "SET #entityType = :entityType",
        "#userId = :userId",
        "#productId = :productId",
        "#topicId = :topicId",
        "#sessionId = :sessionId",
        "#activityDate = :activityDate",
        "#checkInAt = :checkInAt",
        "#updatedAt = :updatedAt"
      ].join(", "),
      ExpressionAttributeNames: {
        "#entityType": "entityType",
        "#userId": "userId",
        "#productId": "productId",
        "#topicId": "topicId",
        "#sessionId": "sessionId",
        "#activityDate": "activityDate",
        "#checkInAt": "checkInAt",
        "#updatedAt": "updatedAt"
      },
      ExpressionAttributeValues: {
        ":entityType": CHECKIN_ENTITY_TYPE,
        ":userId": input.userId,
        ":productId": input.productId,
        ":topicId": input.topicId,
        ":sessionId": input.sessionId,
        ":activityDate": input.activityDate,
        ":checkInAt": input.timestampIso,
        ":updatedAt": input.timestampIso
      },
      ReturnValues: "ALL_NEW"
    }
  );

  if (!savedCheckin) {
    throw new Error("Failed to save user session checkin");
  }

  return savedCheckin;
};

export const listUserSessionCheckins = async (
  input: ListUserSessionCheckinsInput
): Promise<UserSessionCheckinRecord[]> => {
  const dynamoDbDocumentClient = createDynamoDocumentClient();
  const tableName = getAuthServiceEnv().DYNAMO_DB_TABLE_NAME;

  const response = await queryItems<UserSessionCheckinRecord>(
    dynamoDbDocumentClient,
    {
      TableName: tableName,
      KeyConditionExpression: "#pk = :pk AND #sk BETWEEN :fromSk AND :toSk",
      ExpressionAttributeNames: {
        "#pk": "PK",
        "#sk": "SK"
      },
      ExpressionAttributeValues: {
        ":pk": toPartitionKey(input.userId),
        ":fromSk": toSortKey(input.fromActivityDate),
        ":toSk": toSortKey(input.toActivityDate)
      },
      ScanIndexForward: true
    }
  );

  return response.items;
};
