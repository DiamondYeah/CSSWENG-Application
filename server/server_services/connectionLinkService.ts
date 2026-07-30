import crypto from "crypto";

const LINK_TOKEN_SECRET = process.env.LINK_TOKEN_SECRET as string;
const LINK_TOKEN_TTL_MS = 10 * 60 * 1000; // 10 minutes — plenty of time to paste into another window

if (!LINK_TOKEN_SECRET) {
    throw new Error("LINK_TOKEN_SECRET is not set in environment variables!");
}

// Creates a signed, tamper-proof token that proves "this request belongs to userId"
// without needing a cookie. Used so a LinkedIn connect flow started in an
// incognito window can still be attributed to the correct logged-in user.
export function createOwnerLinkToken(userId: string): string {
    const payload = JSON.stringify({ uid: userId, exp: Date.now() + LINK_TOKEN_TTL_MS });
    const payloadB64 = Buffer.from(payload).toString("base64url");

    const signature = crypto
        .createHmac("sha256", LINK_TOKEN_SECRET)
        .update(payloadB64)
        .digest("base64url");

    return `${payloadB64}.${signature}`;
}

// Verifies the token's signature and expiry, returns the userId if valid, else null.
export function verifyOwnerLinkToken(token: string): string | null {
    const [payloadB64, signature] = token.split(".");
    if (!payloadB64 || !signature) return null;

    const expectedSignature = crypto
        .createHmac("sha256", LINK_TOKEN_SECRET)
        .update(payloadB64)
        .digest("base64url");

    const sigBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expectedSignature);

    if (sigBuffer.length !== expectedBuffer.length) return null;
    if (!crypto.timingSafeEqual(sigBuffer, expectedBuffer)) return null;

    try {
        const payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString());
        if (typeof payload.exp !== "number" || Date.now() > payload.exp) return null;
        if (typeof payload.uid !== "string") return null;
        return payload.uid;
    } catch {
        return null;
    }
}