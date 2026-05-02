"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.main = exports.handler = void 0;
const createPayment_1 = require("./handlers/createPayment");
const handleWebhook_1 = require("./handlers/handleWebhook");
const response_1 = require("./utils/response");
const handler = async (event) => {
    if (event.requestContext.http.method === "OPTIONS") {
        return (0, response_1.optionsResponse)();
    }
    if (event.routeKey === "POST /api/payments/create") {
        return (0, createPayment_1.createPayment)(event);
    }
    if (event.routeKey === "POST /api/payments/webhook") {
        return (0, handleWebhook_1.handleWebhook)(event);
    }
    return (0, response_1.jsonResponse)(404, { message: "Route not found" });
};
exports.handler = handler;
exports.main = exports.handler;
