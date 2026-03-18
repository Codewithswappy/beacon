import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkLimit, uploadLimiter } from "@/lib/rate-limit";
import {
  generateUploadSignature,
  SIGNATURE_TTL_SECONDS,
} from "@/lib/cloudinary";

export const runtime = "nodejs";

/**
 * POST /api/cloudinary/sign-upload
 *
 * Issues a short-lived Cloudinary upload signature.
 * The client uses this to POST a file DIRECTLY to Cloudinary — the file
 * never passes through this server, saving bandwidth and reducing latency.
 *
 * Security model:
 *  1. Auth    — unauthenticated requests are rejected immediately.
 *  2. Rate    — reuses the same uploadLimiter (10 uploads / 5 min per user).
 *  3. Folder  — the signature locks the upload to `beacon/posts/{userId}/{postId}`.
 *               The client cannot change the folder without breaking the sig.
 *  4. Formats — `allowed_formats` is baked into the signature; Cloudinary
 *               enforces it independently of what the client sends.
 *  5. Expiry  — `timestamp` is ~SIGNATURE_TTL_SECONDS; Cloudinary rejects
 *               signatures that are too old, preventing replay attacks.
 *
 * Architecture — postId in folder path:
 *  The server generates a UUID for every signature request. This UUID becomes
 *  the postId AND the last segment of the Cloudinary folder. All media for one
 *  post is therefore physically co-located under beacon/posts/{userId}/{postId}/,
 *  making folder-level deletion, auditing, and moderation trivial.
 *
 * Response:
 *  { signature, timestamp, apiKey, cloudName, folder, postId }
 */
export async function POST(request: NextRequest) {
  // ── 1. Auth ───────────────────────────────────────────────────────────────
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  // ── 2. Rate limit (same quota as uploads — 1 sig = 1 upload) ─────────────
  const limited = await checkLimit(uploadLimiter, user.id);
  if (limited) return limited;

  // ── 3. Generate a server-side postId ──────────────────────────────────────
  //
  // We generate the ID here, not on the client, for two reasons:
  //  a) It's included in the signed folder path — the client can't forge it.
  //  b) Predictable IDs from the client could be used to pollute namespaces
  //     if the signature check ever had a gap.
  //
  // crypto.randomUUID() is available in Node 18+ and all modern browsers.
  const postId = crypto.randomUUID();

  // ── 4. Generate signature ─────────────────────────────────────────────────
  const { params, signature, apiKey, cloudName } = generateUploadSignature(
    user.id,
    postId
  );

  return NextResponse.json(
    {
      signature,
      timestamp: params.timestamp,
      apiKey,
      cloudName,
      folder: params.folder,
      postId,
    },
    {
      status: 200,
      headers: {
        // Prevent browsers from caching the signature — each one is single-use
        "Cache-Control": "no-store, max-age=0",
        // Inform the client how long this signature is valid
        "X-Signature-Expires-In": String(SIGNATURE_TTL_SECONDS),
      },
    }
  );
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed." }, { status: 405 });
}
