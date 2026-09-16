import { NextResponse, type NextRequest } from "next/server";

import { getCurrentUser } from "@/server/auth";
import { saveUpload, UPLOAD_KINDS, UploadError, type UploadKind } from "@/server/uploads";

/**
 * Receives a raw file body (not multipart) so large audio streams straight to
 * disk. This is a route handler rather than a Server Action because actions
 * buffer the entire body and cap it at 1MB by default.
 */
export async function POST(request: NextRequest) {
  if (!(await getCurrentUser())) {
    return NextResponse.json({ error: "ابتدا وارد شوید." }, { status: 401 });
  }

  // Unlike Server Actions, route handlers get no built-in CSRF protection.
  const origin = request.headers.get("origin");
  if (!origin || new URL(origin).host !== request.headers.get("host")) {
    return NextResponse.json({ error: "درخواست نامعتبر است." }, { status: 403 });
  }

  const kind = request.nextUrl.searchParams.get("kind") as UploadKind;
  if (!Object.hasOwn(UPLOAD_KINDS, kind) || !request.body) {
    return NextResponse.json({ error: "درخواست نامعتبر است." }, { status: 400 });
  }

  const declared = Number(request.headers.get("content-length") ?? 0);
  if (declared > UPLOAD_KINDS[kind].maxBytes) {
    return NextResponse.json({ error: "حجم فایل بیش از حد مجاز است." }, { status: 413 });
  }

  try {
    const file = await saveUpload(kind, request.headers.get("content-type") ?? "", request.body);
    return NextResponse.json(file, { status: 201 });
  } catch (error) {
    if (error instanceof UploadError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[uploads]", error);
    return NextResponse.json({ error: "بارگذاری ناموفق بود." }, { status: 500 });
  }
}
