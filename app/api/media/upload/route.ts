/**
 * @deprecated
 *
 * This route (POST /api/media/upload) relayed files through our server
 * before sending them to Cloudinary, wasting bandwidth and latency.
 *
 * Use the new direct signed-upload flow instead:
 *
 *   Server: POST /api/cloudinary/sign-upload  → sign-upload/route.ts
 *   Client: lib/cloudinary-client.ts → uploadFile()
 *
 * The client uploads directly to Cloudinary using a signed token.
 * This route is kept here to avoid breaking anything in-flight but
 * will be removed in a future cleanup.
 */

import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      error:
        "This endpoint is deprecated. Use POST /api/cloudinary/sign-upload " +
        "to get a signed token, then upload directly to Cloudinary from the client.",
      newFlow: {
        step1: "POST /api/cloudinary/sign-upload → { signature, timestamp, apiKey, cloudName, folder }",
        step2: "POST https://api.cloudinary.com/v1_1/{cloudName}/auto/upload (from client)",
        helper: "lib/cloudinary-client.ts → uploadFile(file)",
      },
    },
    { status: 410 } // 410 Gone
  );
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed." }, { status: 405 });
}
