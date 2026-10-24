import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { issueSignedToken } from "@vercel/blob";
import {
  handleUpload,
  handleUploadPresigned,
  type HandleUploadBody,
  type HandleUploadPresignedBody,
} from "@vercel/blob/client";
import { authOptions } from "@/lib/auth";
import { ALLOWED_VIDEO_TYPES, MAX_VIDEO_BYTES, blobToken, uploadMode } from "@/lib/storage";

export const runtime = "nodejs";

/**
 * Lets the signed-in admin upload a video straight from their browser to Vercel Blob.
 * (Videos are far bigger than the ~4.5 MB a Vercel server request can carry, so they can't pass through the server.)
 * This route only hands out a short-lived permission slip, limited to one file path, video types and a size cap.
 */

// The browser picks a random file name of this shape; anything else is refused.
const PATH_RE = /^portfolio\/videos\/[a-z0-9-]{8,80}\.(mp4|webm|mov)$/;

function checkPath(pathname: string) {
  if (!PATH_RE.test(pathname)) throw new Error("That upload path is not allowed.");
}

const fail = (message: string, status = 400) => NextResponse.json({ error: message }, { status });

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return fail("Unauthorized", 401);

  const mode = uploadMode();
  if (mode === "local") return fail("Video uploads to Vercel Blob are not configured on this server.");

  let body: { type?: string };
  try {
    body = await request.json();
  } catch {
    return fail("Invalid request");
  }

  try {
    // Older stores: a read/write token signs a client token for the browser.
    if (body.type === "blob.generate-client-token") {
      if (mode !== "token") return fail("This storage does not use client tokens.");
      const json = await handleUpload({
        token: blobToken(),
        request,
        body: body as HandleUploadBody,
        onBeforeGenerateToken: async (pathname) => {
          checkPath(pathname);
          return {
            allowedContentTypes: ALLOWED_VIDEO_TYPES,
            maximumSizeInBytes: MAX_VIDEO_BYTES,
            validUntil: Date.now() + 15 * 60 * 1000,
          };
        },
      });
      return NextResponse.json(json);
    }

    // Newer stores (BLOB_STORE_ID): the server issues a signed token and returns a presigned upload URL.
    if (body.type === "blob.generate-presigned-url") {
      if (mode !== "presigned") return fail("This storage does not use presigned uploads.");
      const json = await handleUploadPresigned({
        request,
        body: body as HandleUploadPresignedBody,
        getSignedToken: async (pathname) => {
          checkPath(pathname);
          const validUntil = Date.now() + 15 * 60 * 1000;
          const token = await issueSignedToken({
            pathname,
            operations: ["put"],
            allowedContentTypes: ALLOWED_VIDEO_TYPES,
            maximumSizeInBytes: MAX_VIDEO_BYTES,
            validUntil,
          });
          return { token, urlOptions: { validUntil } };
        },
      });
      return NextResponse.json(json);
    }

    return fail("Unsupported request");
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Could not start the upload");
  }
}
