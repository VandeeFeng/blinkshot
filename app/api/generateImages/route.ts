import Together from "together-ai";
import { z } from "zod";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { headers } from "next/headers";
import OpenAI from "openai";

let ratelimit: Ratelimit | undefined;

// Add rate limiting if Upstash API keys are set, otherwise skip
if (process.env.UPSTASH_REDIS_REST_URL) {
  ratelimit = new Ratelimit({
    redis: Redis.fromEnv(),
    // Allow 100 requests per day (~5-10 prompts)
    limiter: Ratelimit.fixedWindow(100, "1440 m"),
    analytics: true,
    prefix: "blinkshot",
  });
}

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    "HTTP-Referer": process.env.YOUR_SITE_URL,
    "X-Title": process.env.YOUR_SITE_NAME,
  }
});

async function optimizePrompt(userPrompt: string): Promise<string> {
  try {
    const completion = await openai.chat.completions.create({
      model: "meta-llama/llama-3.1-405b-instruct:free",
      messages: [
        {
          role: "system",
          content: "You are an AI assistant that helps optimize and expand image generation prompts. Provide a detailed and creative expansion of the user's prompt, focusing on visual elements, style, and atmosphere."
        },
        {
          role: "user",
          content: `Optimize and expand this image generation prompt: "${userPrompt}"`
        }
      ]
    });

    return completion.choices[0].message.content || userPrompt;
  } catch (error) {
    console.error("Error optimizing prompt:", error);
    return userPrompt;
  }
}

export async function POST(req: Request) {
  let json = await req.json();
  let { prompt, userAPIKey, iterativeMode, useOptimizedPrompt } = z
    .object({
      prompt: z.string(),
      iterativeMode: z.boolean(),
      userAPIKey: z.string().optional(),
      useOptimizedPrompt: z.boolean(),
    })
    .parse(json);

  // Add observability if a Helicone key is specified, otherwise skip
  let options: ConstructorParameters<typeof Together>[0] = {};
  if (process.env.HELICONE_API_KEY) {
    options.baseURL = "https://together.helicone.ai/v1";
    options.defaultHeaders = {
      "Helicone-Auth": `Bearer ${process.env.HELICONE_API_KEY}`,
      "Helicone-Property-BYOK": userAPIKey ? "true" : "false",
    };
  }

  const client = new Together(options);

  if (userAPIKey) {
    client.apiKey = userAPIKey;
  }

  if (ratelimit && !userAPIKey) {
    const identifier = getIPAddress();

    const { success } = await ratelimit.limit(identifier);
    if (!success) {
      return Response.json(
        "No requests left. Please add your own API key or try again in 24h.",
        {
          status: 429,
        },
      );
    }
  }

  let optimizedPrompt = prompt;
  if (useOptimizedPrompt) {
    optimizedPrompt = await optimizePrompt(prompt);
  }

  let response;
  try {
    response = await client.images.create({
      prompt: optimizedPrompt,
      model: "black-forest-labs/FLUX.1-schnell",
      width: 1024,
      height: 768,
      seed: iterativeMode ? 123 : undefined,
      steps: 3,
      // @ts-expect-error - this is not typed in the API
      response_format: "base64",
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (e: any) {
    return Response.json(
      { error: e.toString() },
      {
        status: 500,
      },
    );
  }

  return Response.json({ ...response.data[0], optimizedPrompt });
}

export const runtime = "edge";

function getIPAddress() {
  const FALLBACK_IP_ADDRESS = "0.0.0.0";
  const forwardedFor = headers().get("x-forwarded-for");

  if (forwardedFor) {
    return forwardedFor.split(",")[0] ?? FALLBACK_IP_ADDRESS;
  }

  return headers().get("x-real-ip") ?? FALLBACK_IP_ADDRESS;
}
