import { UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { dynamoDbDocumentClient } from "../../clients/awsClients";
import { DynamoDbItem, UpdateItemOptions } from "./types";

export const updateItem = async <TAttributes extends DynamoDbItem = DynamoDbItem>(
  options: UpdateItemOptions
): Promise<TAttributes | undefined> => {
  const { tableName, input, client = dynamoDbDocumentClient } = options;

  const response = await client.send(
    new UpdateCommand({
      ...input,
      TableName: tableName
    })
  );

  return response.Attributes as TAttributes | undefined;
};
