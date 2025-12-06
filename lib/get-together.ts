import Together from "together-ai";

export function getTogether(userAPIKey: string | null) {
  const options: ConstructorParameters<typeof Together>[0] = {};

  if (process.env.HELICONE_API_KEY) {
    options.baseURL = "https://together.helicone.ai/v1";
    options.defaultHeaders = {
      "Helicone-Auth": `Bearer ${process.env.HELICONE_API_KEY}`,
      "Helicone-Property-BYOK": userAPIKey ? "true" : "false",
      "Helicone-Property-appname": "EasyEdit",
      "Helicone-Property-environment":
        process.env.VERCEL_ENV === "production" ? "prod" : "dev",
    };
  }

  // Set API key - prioritize user API key, fallback to environment variable
  const apiKey = userAPIKey || process.env.TOGETHER_API_KEY;
  if (apiKey) {
    options.apiKey = apiKey;
  }

  // If no API key is provided, Together client will throw an error
  // This should be caught by the caller
  const together = new Together(options);

  return together;
}
