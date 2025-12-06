/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { fal } from "@fal-ai/client";
import { getAdjustedDimensions } from "@/lib/get-adjusted-dimentions";
import { getIPAddress, getRateLimiter } from "@/lib/rate-limiter";
import { z } from "zod";

const ratelimit = getRateLimiter();

const schema = z.object({
  imageUrl: z.string().optional(),
  modelImageUrl: z.string().optional(),
  productImageUrl: z.string().optional(),
  prompt: z.string(),
  width: z.number(),
  height: z.number(),
  userAPIKey: z.string().nullable(),
  model: z
    .enum([
      "black-forest-labs/FLUX.1-kontext-dev",
      "black-forest-labs/FLUX.1-kontext-pro",
    ])
    .default("black-forest-labs/FLUX.1-kontext-dev"),
});

export async function generateImage(
  unsafeData: z.infer<typeof schema>,
): Promise<{ success: true; url: string } | { success: false; error: string }> {
  const { imageUrl, modelImageUrl, productImageUrl, prompt, width, height, userAPIKey } =
    schema.parse(unsafeData);

  // Fal.ai API key'i ayarla
  // Next.js environment variable'ları .env.local dosyasından otomatik yükler
  // Fal.ai client da FAL_KEY environment variable'ını otomatik okur
  const falKey = process.env.FAL_KEY?.trim();
  
  // Debug: Tüm environment variable'ları kontrol et
  console.log("=== Fal.ai API Key Debug ===");
  console.log("process.env.FAL_KEY var mı:", !!process.env.FAL_KEY);
  console.log("process.env.FAL_KEY değeri:", process.env.FAL_KEY ? process.env.FAL_KEY.substring(0, 20) + "..." : "YOK");
  console.log("Tüm env keys:", Object.keys(process.env).filter(k => k.includes("FAL") || k.includes("KEY")).join(", "));
  
  if (!falKey) {
    // Fal.ai client environment variable'ı otomatik okumayı deneyebilir
    // Ama yine de hata döndürelim
    console.error("FAL_KEY environment variable bulunamadı!");
    return {
      success: false,
      error: "Fal.ai API key'i bulunamadı. Lütfen .env.local dosyasına FAL_KEY ekleyin ve sunucuyu yeniden başlatın.",
    };
  }
  
  console.log("Fal.ai API key uzunluğu:", falKey.length);
  console.log("Fal.ai API key formatı (ilk 30 karakter):", falKey.substring(0, 30));
  
  // Fal.ai client'ı yapılandır
  fal.config({
    credentials: falKey,
  });

  const adjustedDimensions = getAdjustedDimensions(width, height);

  try {
    // İki resim varsa (model + product), ikisini de gönder
    // Tek resim varsa (backward compatibility), onu kullan
    let imageUrls: string[] = [];
    
    if (modelImageUrl && productImageUrl) {
      // İki resim varsa: model (base) + product (reference)
      imageUrls = [modelImageUrl, productImageUrl];
    } else if (imageUrl) {
      // Backward compatibility: tek resim
      imageUrls = [imageUrl];
    } else if (modelImageUrl) {
      imageUrls = [modelImageUrl];
    } else if (productImageUrl) {
      imageUrls = [productImageUrl];
    }

    if (imageUrls.length === 0) {
      return {
        success: false,
        error: "Lütfen en az bir resim yükleyin.",
      };
    }

    // Fal.ai Nano Banana Pro API'sini kullan
    // Base64 data URI'leri direkt kabul ediyor
    const result = await fal.subscribe("fal-ai/nano-banana-pro/edit", {
      input: {
        prompt: prompt,
        image_urls: imageUrls, // İki resim varsa: [model, product]
        num_images: 1,
        resolution: adjustedDimensions.width >= 2048 ? "2K" : "1K",
        output_format: "png",
      },
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === "IN_PROGRESS") {
          console.log("Processing image...");
        }
      },
    });

    // Fal.ai response formatı: result.data.images[0].url (dokümantasyona göre)
    console.log("Fal.ai response:", JSON.stringify(result, null, 2));
    
    if (result?.data?.images && result.data.images.length > 0) {
      return {
        success: true,
        url: result.data.images[0].url,
      };
    } else if (result?.images && result.images.length > 0) {
      // Fallback: Eğer data wrapper yoksa direkt images'e bak
      return {
        success: true,
        url: result.images[0].url,
      };
    } else {
      console.error("Fal.ai response formatı beklenmedik:", result);
      return {
        success: false,
        error: "Resim üretilemedi. Lütfen tekrar deneyin.",
      };
    }
  } catch (e: any) {
    console.error("Fal.ai API hatası:", e);
    const errorMessage = e?.message || e?.toString() || "Unknown error";
    
    // Fal.ai spesifik hata mesajlarını kontrol et
    if (errorMessage.includes("401") || errorMessage.includes("Unauthorized")) {
      return {
        success: false,
        error: "Fal.ai API key'i geçersiz. Lütfen API key'inizi kontrol edin.",
      };
    }
    
    if (errorMessage.includes("429") || errorMessage.includes("rate limit")) {
      return {
        success: false,
        error: "Rate limit aşıldı. Lütfen bir süre sonra tekrar deneyin.",
      };
    }
    
    return {
      success: false,
      error: `Resim işleme hatası: ${errorMessage}`,
    };
  }
}
