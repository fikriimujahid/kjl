"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isProduct = void 0;
const isProduct = (value) => {
    if (!value || typeof value !== "object") {
        return false;
    }
    const record = value;
    return (typeof record.id === "string" &&
        typeof record.name === "string" &&
        typeof record.price === "number" &&
        typeof record.accessDurationDays === "number");
};
exports.isProduct = isProduct;
