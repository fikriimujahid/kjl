"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseEventBody = void 0;
const parseEventBody = (event) => {
    if (!event.body) {
        return {};
    }
    const rawBody = event.isBase64Encoded
        ? Buffer.from(event.body, "base64").toString("utf8")
        : event.body;
    return JSON.parse(rawBody);
};
exports.parseEventBody = parseEventBody;
