import OpenAI from "openai";
const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY
});
export async function POST(req: Request) {
  const { prompt } = await req.json();
  try {
    const completion = await openai.chat.completions.create({
      model: "meta-llama/llama-3.1-70b-instruct:free",
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