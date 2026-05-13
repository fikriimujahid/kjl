"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchProductById = void 0;
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const product_1 = require("../models/product");
const PRODUCT_PARTITION_KEY_PREFIX = "PRODUCT#";
const PRODUCT_METADATA_SORT_KEY = "METADATA";
const dynamoDbClient = lib_dynamodb_1.DynamoDBDocumentClient.from(new client_dynamodb_1.DynamoDBClient({}));
const fetchProductById = async (productId, tableName) => {
    const response = await dynamoDbClient.send(new lib_dynamodb_1.GetCommand({
        TableName: tableName,
        Key: {
            PK: `${PRODUCT_PARTITION_KEY_PREFIX}${productId}`,
            SK: PRODUCT_METADATA_SORT_KEY
        }
    }));
    const item = response.Item;
    if (!(0, product_1.isProduct)(item)) {
        return null;
    }
    return item;
};
exports.fetchProductById = fetchProductById;
