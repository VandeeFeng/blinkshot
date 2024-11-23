import OpenAI from "openai";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { headers } from "next/headers";

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY
});

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

export async function POST(req: Request) {
  const { prompt } = await req.json();

  // Check rate limit
  if (ratelimit) {
    const ip = headers().get("x-forwarded-for") ?? "127.0.0.1";
    const { success, limit, remaining, reset } = await ratelimit.limit(ip);

    if (!success) {
      return Response.json(
        { error: "Rate limit exceeded" },
        { status: 429, headers: { "X-RateLimit-Limit": limit.toString(), "X-RateLimit-Remaining": remaining.toString(), "X-RateLimit-Reset": reset.toString() } }
      );
    }
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "meta-llama/llama-3.1-405b-instruct:free",
      messages: [
        {
          role: "system",
          content: "You are an AI assistant that helps optimize image generation prompts. Your task is to improve the given prompt to make it more detailed and effective for image generation. If the prompt is in Chinese or another language, translate it to English first and output the optimized prompt in English.important: You must just output the optimized prompt without any other text or comments."
        },
        {
          role: "user",
          content: `"${prompt}"`
        }
      ],
      temperature: 0.7,
      max_tokens: 150,
    });
    const optimizedPrompt = completion.choices[0].message.content;
    return Response.json({ optimizedPrompt });
  } catch (error) {
    console.error('Error optimizing prompt:', error);
    return Response.json({ error: 'Failed to optimize prompt' }, { status: 500 });
  }
}

export const runtime = "edge";