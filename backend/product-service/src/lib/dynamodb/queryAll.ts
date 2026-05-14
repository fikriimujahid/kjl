import { QueryCommand } from "@aws-sdk/lib-dynamodb";
import { dynamoDbDocumentClient } from "../../clients/awsClients";
import { DynamoDbItem, QueryAllOptions } from "./types";

export const queryAll = async <TItem extends DynamoDbItem = DynamoDbItem>(
  options: QueryAllOptions
): Promise<TItem[]> => {
  const { tableName, input, client = dynamoDbDocumentClient } = options;
  const items: TItem[] = [];
  let lastEvaluatedKey: Record<string, unknown> | undefined;

  do {
    const response = await client.send(
      new QueryCommand({
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
