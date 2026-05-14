import { Product, ProductDetail, OwnedProduct, Session, SessionDetail, Topic } from "../types/productTypes";
import { findProducts, findProductDetailsById, findOwnedProducts } from "../repositories/productRepository";

export const getProducts = async (): Promise<Product[]> => {
  return findProducts();
};

export const getProductDetailsById = async (id: string): Promise<ProductDetail | null> => {
  return findProductDetailsById(id);
};

export const getOwnedProducts = async (
  userId: string
): Promise<OwnedProduct[]> => {
  return findOwnedProducts(userId);
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
