import { ScanCommand } from "@aws-sdk/lib-dynamodb";
import { dynamoDbDocumentClient } from "../../clients/awsClients";
import { DynamoDbItem, ScanAllOptions } from "./types";

export const scanAll = async <TItem extends DynamoDbItem = DynamoDbItem>(
  options: ScanAllOptions
): Promise<TItem[]> => {
  const { tableName, input = {}, client = dynamoDbDocumentClient } = options;
  const items: TItem[] = [];
  let lastEvaluatedKey: Record<string, unknown> | undefined;

  do {
    const response = await client.send(
      new ScanCommand({
        ...input,
        TableName: tableName,
        ExclusiveStartKey: lastEvaluatedKey
      })
    );

    items.push(...((response.Items ?? []) as TItem[]));
    lastEvaluatedKey = response.LastEvaluatedKey as Record<string, unknown> | undefined;
  } while (lastEvaluatedKey);

  return items;
};
