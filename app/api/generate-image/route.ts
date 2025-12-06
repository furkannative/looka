import { NextRequest, NextResponse } from "next/server";
import { generateImage } from "@/app/actions";

export const maxDuration = 60; // 60 seconds
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    // Body size limit kontrolü - Next.js route handler'ları varsayılan olarak daha yüksek limit'e sahip
    const body = await request.json();
    const result = await generateImage(body);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("API route error:", error);
    if (error.message?.includes("Body exceeded") || error.message?.includes("413")) {
      return NextResponse.json(
        { success: false, error: "Resim boyutu çok büyük. Lütfen daha küçük bir resim deneyin." },
        { status: 413 }
      );
    }
    return NextResponse.json(
      { success: false, error: error.message || "Bir hata oluştu" },
      { status: 500 }
    );
  }
}

