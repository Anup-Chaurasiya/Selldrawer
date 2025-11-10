import crypto from "node:crypto";

const HMAC_HEADER = "x-shopify-hmac-sha256";

export function verifyShopifyWebhookSignature(rawBody: ArrayBuffer, headers: Headers) {
  const secret = process.env.SHOPIFY_API_SECRET;
  if (!secret) {
    throw new Error("Missing SHOPIFY_API_SECRET environment variable");
  }

  const hmacHeader = headers.get(HMAC_HEADER);
  if (!hmacHeader) {
    return false;
  }

  const bodyBuffer = Buffer.from(rawBody);
  const computed = crypto
    .createHmac("sha256", secret)
    .update(bodyBuffer)
    .digest("base64");

  const headerBuffer = Buffer.from(hmacHeader, "utf-8");
  const computedBuffer = Buffer.from(computed, "utf-8");

  if (headerBuffer.length !== computedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(headerBuffer, computedBuffer);
}
