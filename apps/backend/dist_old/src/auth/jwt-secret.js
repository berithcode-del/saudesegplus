"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getJwtSecret = getJwtSecret;
exports.getJwtExpiresIn = getJwtExpiresIn;
exports.getPortalJwtExpiresIn = getPortalJwtExpiresIn;
function cleanEnvValue(value) {
    const cleaned = value?.trim().replace(/^['"]|['"]$/g, '');
    return cleaned || undefined;
}
function getJwtSecret() {
    const secret = cleanEnvValue(process.env.JWT_SECRET);
    if (!secret || secret.length < 32) {
        throw new Error('JWT_SECRET must be configured with at least 32 characters');
    }
    return secret;
}
function getJwtExpiresIn() {
    return cleanEnvValue(process.env.JWT_EXPIRES_IN) ?? '24h';
}
function getPortalJwtExpiresIn() {
    return cleanEnvValue(process.env.PORTAL_JWT_EXPIRES_IN)
        ?? cleanEnvValue(process.env.JWT_EXPIRES_IN)
        ?? '4h';
}
//# sourceMappingURL=jwt-secret.js.map