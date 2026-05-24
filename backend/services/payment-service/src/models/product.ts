export interface Product {
  id: string;
  name: string;
  price: number;
  accessDurationDays: number;
  level?: string;
}

export const isProduct = (value: unknown): value is Product => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const record = value as Record<string, unknown>;

  return (
    typeof record.id === "string" &&
    typeof record.name === "string" &&
    typeof record.price === "number" &&
    typeof record.accessDurationDays === "number" &&
    (record.level === undefined || typeof record.level === "string")
  );
};
