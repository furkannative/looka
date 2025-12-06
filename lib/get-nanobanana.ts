// Nano Banana API client for image generation
// Nano Banana provides free AI model APIs

export interface NanoBananaOptions {
  apiKey?: string;
  baseURL?: string;
}

export class NanoBananaClient {
  private apiKey?: string;
  private baseURL: string;

  constructor(options: NanoBananaOptions = {}) {
    this.apiKey = options.apiKey || process.env.NANOBANANA_API_KEY;
    this.baseURL = options.baseURL || "https://api.nanobanana.ai";
  }

  async generateImage(params: {
    model: string;
    prompt: string;
    width: number;
    height: number;
    image_url: string;
  }): Promise<{ data: Array<{ url: string }> }> {
    const { model, prompt, width, height, image_url } = params;

    // Nano Banana API endpoint for image generation
    const endpoint = `${this.baseURL}/v1/images/generations`;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (this.apiKey) {
      headers["Authorization"] = `Bearer ${this.apiKey}`;
    }

    const body = {
      model,
      prompt,
      width,
      height,
      image_url,
      n: 1,
    };

    const response = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Nano Banana API error: ${response.status} ${response.statusText} - ${errorText}`,
      );
    }

    const data = await response.json();
    return data;
  }

  async chatCompletions(params: {
    model: string;
    messages: Array<{ role: string; content: string | Array<any> }>;
  }): Promise<{
    choices: Array<{ message: { content: string } }>;
  }> {
    const { model, messages } = params;

    const endpoint = `${this.baseURL}/v1/chat/completions`;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (this.apiKey) {
      headers["Authorization"] = `Bearer ${this.apiKey}`;
    }

    const body = {
      model,
      messages,
    };

    const response = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Nano Banana API error: ${response.status} ${response.statusText} - ${errorText}`,
      );
    }

    const data = await response.json();
    return data;
  }
}

export function getNanoBanana(userAPIKey: string | null) {
  return new NanoBananaClient({
    apiKey: userAPIKey || process.env.NANOBANANA_API_KEY || undefined,
  });
}

