"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchProductById = void 0;
const product_1 = require("../models/product");
const fetchProductById = async (productId, productDataUrl) => {
    const response = await fetch(productDataUrl);
    if (!response.ok) {
        throw new Error(`Failed to fetch product data: ${response.status}`);
    }
    const payload = (await response.json());
    if (!Array.isArray(payload)) {
        throw new Error("Invalid product payload format");
    }
    const product = payload.filter(product_1.isProduct).find((item) => item.id === productId);
    return product ?? null;
};
exports.fetchProductById = fetchProductById;
