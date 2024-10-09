import OpenAI from "openai";

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    "HTTP-Referer": process.env.YOUR_SITE_URL, // Optional, for including your app on openrouter.ai rankings.
    "X-Title": process.env.YOUR_SITE_NAME, // Optional. Shows in rankings on openrouter.ai.
  }
});

export async function POST(req: Request) {
  const { prompt } = await req.json();

  try {
    const completion = await openai.chat.completions.create({
      model: "meta-llama/llama-3.1-405b-instruct:free",
      messages: [
        {
          role: "system",
          content: "You are an AI assistant that helps optimize image generation prompts. Your task is to improve the given prompt to make it more detailed and effective for image generation.",
        },
        {
          role: "user",
          content: `Please optimize this image generation prompt: "${prompt}"`,
        },
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
