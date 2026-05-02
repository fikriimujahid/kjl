"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAuthenticatedUser = void 0;
const getAuthenticatedUser = (event) => {
    const claims = event.requestContext.authorizer?.jwt
        ?.claims;
    if (!claims) {
        return null;
    }
    const userId = claims.sub ?? claims["cognito:username"];
    if (!userId) {
        return null;
    }
    return {
        id: userId,
        email: claims.email ?? "",
        name: claims.name ?? ""
    };
};
exports.getAuthenticatedUser = getAuthenticatedUser;
