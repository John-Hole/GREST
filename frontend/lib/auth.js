'use strict';

const { SignJWT, jwtVerify } = require('jose');
const { cookies } = require('next/headers');

const JWT_SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET || 'grest-psg-tournament-secret-key-2026'
);

const COOKIE_NAME = 'token';

async function signToken(payload) {
    return new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('7d')
        .sign(JWT_SECRET);
}

async function verifyToken(token) {
    try {
        const { payload } = await jwtVerify(token, JWT_SECRET);
        return payload;
    } catch {
        return null;
    }
}

async function getAuthUser() {
    try {
        const cookieStore = await cookies();
        const tokenCookie = cookieStore.get(COOKIE_NAME);
        if (!tokenCookie) return null;
        const payload = await verifyToken(tokenCookie.value);
        return payload;
    } catch {
        return null;
    }
}

async function requireAuth() {
    const user = await getAuthUser();
    if (!user) {
        throw new Error('Unauthorized');
    }
    return user;
}

async function requireAdmin() {
    const user = await requireAuth();
    if (user.role !== 'admin') {
        throw new Error('Forbidden');
    }
    return user;
}

async function requireAdminGiochi() {
    const user = await requireAuth();
    // admin_giochi or higher (admin)
    if (user.role !== 'admin' && user.role !== 'admin_giochi') {
        throw new Error('Forbidden');
    }
    return user;
}

async function requireArbitro() {
    const user = await requireAuth();
    // arbitro or higher (admin_giochi, admin)
    if (user.role !== 'admin' && user.role !== 'admin_giochi' && user.role !== 'arbitro') {
        throw new Error('Forbidden');
    }
    return user;
}

function createTokenCookie(token) {
    return `${COOKIE_NAME}=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${60 * 60 * 24 * 7}`;
}

function clearTokenCookie() {
    return `${COOKIE_NAME}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0`;
}

module.exports = {
    signToken,
    verifyToken,
    getAuthUser,
    requireAuth,
    requireAdmin,
    requireAdminGiochi,
    requireArbitro,
    createTokenCookie,
    clearTokenCookie,
    COOKIE_NAME,
};
