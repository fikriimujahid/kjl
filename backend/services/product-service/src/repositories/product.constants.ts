export const PRODUCT_ENTITY_TYPE = "PRODUCT";
export const PRODUCT_PARTITION_KEY_PREFIX = "PRODUCT#";
export const TOPIC_SORT_KEY_PREFIX = "TOPIC#";
export const SESSION_SORT_KEY_PREFIX = "SESSION#";
export const PRODUCT_METADATA_SORT_KEY = "METADATA";
export const productListColumns = [
  "PK",
  "SK",
  "entityType",
  "id",
  "name",
  "price",
  "normalPrice",
  "shortDescription",
  "level",
  "topicsCount",
  "featuredProducts",
  "accessDurationDays"
];