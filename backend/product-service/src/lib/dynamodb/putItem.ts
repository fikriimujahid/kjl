import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { dynamoDbDocumentClient } from "../../clients/awsClients";
import { DynamoDbItem, PutItemOptions } from "./types";

export const putItem = async <TItem extends DynamoDbItem>(
  options: PutItemOptions<TItem>
): Promise<void> => {
  const { tableName, item, input, client = dynamoDbDocumentClient } = options;

  await client.send(
    new PutCommand({
      ...input,
      TableName: tableName,
      Item: item
    })
  );
};
