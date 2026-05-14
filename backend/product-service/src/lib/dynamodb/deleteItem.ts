import { DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { dynamoDbDocumentClient } from "../../clients/awsClients";
import { DeleteItemOptions } from "./types";

export const deleteItem = async (options: DeleteItemOptions): Promise<void> => {
  const { tableName, input, client = dynamoDbDocumentClient } = options;

  await client.send(
    new DeleteCommand({
      ...input,
      TableName: tableName
    })
  );
};
