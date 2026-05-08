import { mapQuizQuestionToSessionDetail } from "../mappers/quizMapper";
import { Product, ProductDetail, PurchasedProduct, Session, SessionDetail, Topic } from "../types/productTypes";
import { fetchProducts, findProductDetailsById } from "../repositories/productRepository";
import { getUserPurchase, listPurchasedProducts } from "../repositories/purchaseRepository";
import {
  buildSignedObjectUrl,
  fetchQuizQuestionsFromSessionObjects,
  listSessionObjectKeys
} from "../repositories/s3Repository";
import { isPurchaseActive } from "../utils/dateUtils";
import { logProductServiceInfo } from "../utils/logger";

// const DYNAMO_DB_TABLE_NAME = process.env.DYNAMO_DB_TABLE_NAME;
// const IMAGE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg"]);
// const AUDIO_EXTENSIONS = new Set([".mp3", ".wav", ".m4a", ".aac", ".ogg"]);

// const getFileExtension = (key: string): string => {
//   const lastDotIndex = key.lastIndexOf(".");
//   return lastDotIndex >= 0 ? key.slice(lastDotIndex).toLowerCase() : "";
// };

// const getObjectIdFromKey = (key: string): string => {
//   const segments = key.split("/");
//   return segments[segments.length - 1] ?? key;
// };

// const resolveTopicAndSession = (
//   product: Product,
//   topicId: string,
//   sessionId: string
// ): { topic: Topic; session: Session } | null => {
//   const topic = product.topics.find((item) => item.id === topicId);

//   if (!topic) {
//     return null;
//   }

//   const session = topic.sessions.find((item) => item.id === sessionId);

//   if (!session) {
//     return null;
//   }

//   return { topic, session };
// };

// const fetchSessionMediaDetails = async (
//   session: Session,
//   objectKeys: string[]
// ): Promise<SessionDetail[]> => {
//   if (session.type === "quiz") {
//     const quizQuestions = await fetchQuizQuestionsFromSessionObjects(objectKeys);
//     return quizQuestions.map(mapQuizQuestionToSessionDetail);
//   }

//   if (objectKeys.length === 0) {
//     return [];
//   }

//   if (session.type === "images") {
//     const imageKeys = objectKeys.filter((key) => IMAGE_EXTENSIONS.has(getFileExtension(key)));

//     return Promise.all(
//       imageKeys.map(async (key) => ({
//         id: getObjectIdFromKey(key),
//         contentUrl: await buildSignedObjectUrl(key)
//       }))
//     );
//   }

//   const primaryKey = objectKeys[0];
//   const primaryExtension = getFileExtension(primaryKey);

//   return [
//     {
//       id: getObjectIdFromKey(primaryKey),
//       contentUrl: await buildSignedObjectUrl(primaryKey),
//       audio: AUDIO_EXTENSIONS.has(primaryExtension) ? await buildSignedObjectUrl(primaryKey) : undefined
//     }
//   ];
// };

export const listProducts = async (): Promise<Product[]> => {
  return fetchProducts();
};

export const getProductDetailsById = async (id: string): Promise<ProductDetail | null> => {
  return findProductDetailsById(id);
};

// export const getProductSessionDetails = async (
//   userId: string,
//   productId: string,
//   topicId: string,
//   sessionId: string
// ): Promise<SessionDetail[] | null> => {
//   if (!DYNAMO_DB_TABLE_NAME) {
//     throw new Error("Missing DYNAMO_DB_TABLE_NAME environment variable");
//   }

//   const product = await getProductById(productId);

//   if (!product) {
//     logProductServiceInfo("sessionDetails.productNotFound", {
//       userId,
//       productId,
//       topicId,
//       sessionId
//     });
//     return null;
//   }

//   const resolvedSession = resolveTopicAndSession(product, topicId, sessionId);

//   if (!resolvedSession) {
//     logProductServiceInfo("sessionDetails.topicOrSessionNotFound", {
//       userId,
//       productId,
//       topicId,
//       sessionId
//     });
//     return null;
//   }

//   const purchaseLogContext = {
//     userId,
//     productId,
//     topicId,
//     sessionId,
//     tableName: DYNAMO_DB_TABLE_NAME,
//     purchasePartitionKey: `USER#${userId}`,
//     purchaseSortKey: `PURCHASE#${productId}`
//   };

//   const purchase = await getUserPurchase(userId, productId, topicId, sessionId);

//   if (!purchase) {
//     return null;
//   }

//   if (!isPurchaseActive(purchase)) {
//     logProductServiceInfo("dynamodb.getPurchase.inactive", {
//       ...purchaseLogContext,
//       expiryDate: purchase.expiryDate
//     });
//     return null;
//   }

//   const prefix = `products/${productId}/${topicId}/${sessionId}`;
//   logProductServiceInfo("sessionDetails.s3Lookup.start", {
//     userId,
//     productId,
//     topicId,
//     sessionId,
//     prefix,
//     sessionType: resolvedSession.session.type
//   });
//   const objectKeys = await listSessionObjectKeys(prefix);
//   const sessionDetails = await fetchSessionMediaDetails(resolvedSession.session, objectKeys);

//   logProductServiceInfo("sessionDetails.s3Lookup.success", {
//     userId,
//     productId,
//     topicId,
//     sessionId,
//     prefix,
//     objectKeyCount: objectKeys.length,
//     sessionDetailCount: sessionDetails.length,
//     sessionType: resolvedSession.session.type
//   });

//   return sessionDetails;
// };

// export const listPurchasedProductsByUser = async (
//   userId: string
// ): Promise<PurchasedProduct[]> => {
//   if (!DYNAMO_DB_TABLE_NAME) {
//     throw new Error("Missing DYNAMO_DB_TABLE_NAME environment variable");
//   }

//   return listPurchasedProducts(userId);
// };
