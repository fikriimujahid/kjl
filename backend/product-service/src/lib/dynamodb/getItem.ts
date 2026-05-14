import { GetCommand } from "@aws-sdk/lib-dynamodb";
import { dynamoDbDocumentClient } from "../../clients/awsClients";
import { DynamoDbItem, GetItemOptions } from "./types";

export const getItem = async <TItem extends DynamoDbItem = DynamoDbItem>(
  options: GetItemOptions
): Promise<TItem | null> => {
  const { tableName, input, client = dynamoDbDocumentClient } = options;

  const response = await client.send(
    new GetCommand({
      ...input,
      TableName: tableName
    })
  );

  return (response.Item as TItem | undefined) ?? null;
};
