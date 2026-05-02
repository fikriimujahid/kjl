"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionsResponse = exports.jsonResponse = void 0;
const corsHeaders = {
    "content-type": "application/json",
    "access-control-allow-origin": "*",
    "access-control-allow-headers": "content-type,authorization",
    "access-control-allow-methods": "OPTIONS,POST"
};
const jsonResponse = (statusCode, body) => {
    return {
        statusCode,
        headers: corsHeaders,
        body: JSON.stringify(body)
    };
};
exports.jsonResponse = jsonResponse;
const optionsResponse = () => {
    return {
        statusCode: 204,
        headers: corsHeaders,
        body: ""
    };
};
exports.optionsResponse = optionsResponse;
