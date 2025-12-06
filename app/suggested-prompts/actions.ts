"use server";

import { getIPAddress, getRateLimiter } from "@/lib/rate-limiter";
import invariant from "tiny-invariant";
import { z } from "zod";

const schema = z.array(z.string());
const ratelimit = getRateLimiter();

// Google AI Studio API Key
const DEFAULT_GOOGLE_AI_KEY = "AIzaSyBakNiY3J_zxOPaj0nmrFEFhUufpNvOHSc";

export async function getSuggestions(
  imageUrl: string,
  userAPIKey: string | null,
) {
  invariant(typeof imageUrl === "string");

  // Hızlı çalışması için basit öneriler döndür
  // Google AI Studio entegrasyonu zaman alıyor, bu yüzden şimdilik basit öneriler
  return [
    "Add more vibrant colors",
    "Change the background",
    "Adjust the lighting",
  ];
}
