import type {
  DeleteCommandInput,
  DynamoDBDocumentClient,
  GetCommandInput,
  PutCommandInput,
  QueryCommandInput,
  ScanCommandInput,
  UpdateCommandInput
} from "@aws-sdk/lib-dynamodb";

export type DynamoDbItem = object;
export type DynamoDbKey = Record<string, unknown>;

export interface DynamoDbOperationOptions {
  tableName: string;
  client?: DynamoDBDocumentClient;
}

export interface ScanAllOptions extends DynamoDbOperationOptions {
  input?: Omit<ScanCommandInput, "TableName" | "ExclusiveStartKey">;
}

export interface QueryAllOptions extends DynamoDbOperationOptions {
  input: Omit<QueryCommandInput, "TableName" | "ExclusiveStartKey">;
}

export interface PutItemOptions<TItem extends DynamoDbItem> extends DynamoDbOperationOptions {
  input: Omit<PutCommandInput, "TableName" | "Item">;
  item: TItem;
}

export interface UpdateItemOptions extends DynamoDbOperationOptions {
  input: Omit<UpdateCommandInput, "TableName">;
}

export interface DeleteItemOptions extends DynamoDbOperationOptions {
  input: Omit<DeleteCommandInput, "TableName">;
}

export interface GetItemOptions extends DynamoDbOperationOptions {
  input: Omit<GetCommandInput, "TableName">;
}
