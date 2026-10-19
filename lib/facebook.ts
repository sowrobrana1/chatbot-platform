const GRAPH = "https://graph.facebook.com/v20.0";

/** Send a text message via Facebook Messenger Send API. */
export async function sendFacebookMessage(
  pageAccessToken: string,
  recipientId: string,
  text: string
): Promise<void> {
  const res = await fetch(`${GRAPH}/me/messages?access_token=${pageAccessToken}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      recipient: { id: recipientId },
      message: { text: text.slice(0, 2000) },
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Facebook send failed: ${err}`);
  }
}

/** Verify the webhook signature using the app secret (TODO: set FB_APP_SECRET). */
export async function verifyFacebookSignature(
  rawBody: string,
  signature: string | null
): Promise<boolean> {
  const secret = process.env.FB_APP_SECRET;
  if (!secret) {
    console.warn("FB_APP_SECRET not set — skipping signature verification (dev only)");
    return true;
  }
  if (!signature) return false;
  const crypto = await import("crypto");
  const expected =
    "sha256=" + crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
}
