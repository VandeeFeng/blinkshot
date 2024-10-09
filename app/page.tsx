"use client";

import OpenAI from "openai";

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    "HTTP-Referer": process.env.YOUR_SITE_URL,
    "X-Title": process.env.YOUR_SITE_NAME,
  }
});

// import GithubIcon from "@/components/icons/github-icon";//
// import XIcon from "@/components/icons/x-icon";//
// import Logo from "@/components/logo"; //
import Spinner from "@/components/spinner";
// import { Button } from "@/components/ui/button";//
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import imagePlaceholder from "@/public/image-placeholder.png";
import { useQuery } from "@tanstack/react-query";
import { useDebounce } from "@uidotdev/usehooks";
import Image from "next/image";
import { useEffect, useState } from "react";

type ImageResponse = {
  b64_json: string;
  timings: { inference: number };
};

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

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [iterativeMode, setIterativeMode] = useState(false);
  const [userAPIKey, setUserAPIKey] = useState("");
  const debouncedPrompt = useDebounce(prompt, 300);
  const [generations, setGenerations] = useState<
    { prompt: string; image: ImageResponse }[]
  >([]);
  let [activeIndex, setActiveIndex] = useState<number>();
  const [optimizedPrompt, setOptimizedPrompt] = useState("");
  const [useOptimizedPrompt, setUseOptimizedPrompt] = useState(false);

  const { data: image, isFetching } = useQuery({
    placeholderData: (previousData) => previousData,
    queryKey: [debouncedPrompt],
    queryFn: async () => {
      let res = await fetch("/api/generateImages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          prompt: useOptimizedPrompt ? optimizedPrompt : prompt, 
          userAPIKey, 
          iterativeMode 
        }),
      });

      if (!res.ok) {
        throw new Error(await res.text());
      }
      return (await res.json()) as ImageResponse;
    },
    enabled: !!(useOptimizedPrompt ? optimizedPrompt.trim() : prompt.trim()),
    staleTime: Infinity,
    retry: false,
  });

  let isDebouncing = prompt !== debouncedPrompt;

  useEffect(() => {
    if (debouncedPrompt.trim()) {
      optimizePrompt(debouncedPrompt).then(setOptimizedPrompt);
    }
  }, [debouncedPrompt]);

  useEffect(() => {
    if (image && !generations.map((g) => g.image).includes(image)) {
      setGenerations((images) => [...images, { prompt, image }]);
      setActiveIndex(generations.length);
    }
  }, [generations, image, prompt]);

  let activeImage =
    activeIndex !== undefined ? generations[activeIndex].image : undefined;

  return (
    <div className="flex h-full flex-col px-5">
      <header className="flex flex-col items-center pt-20 md:pt-3">
  <h1 className="text-2xl font-bold text-center mb-4">
    Free image generator
  </h1>
  <div className="w-full md:w-auto md:self-end">
    <label className="text-xs text-gray-200">
      [Optional] Add your{" "}
      <a
        href="https://api.together.xyz/settings/api-keys"
        target="_blank"
        className="underline underline-offset-4 transition hover:text-blue-500"
      >
        Together API Key
      </a>{" "}
    </label>
    <Input
      placeholder="API Key"
      type="password"
      value={userAPIKey}
      className="mt-1 bg-gray-400 text-gray-200 placeholder:text-gray-300"
      onChange={(e) => setUserAPIKey(e.target.value)}
    />
  </div>
</header>

      <div className="flex justify-center">
        <form className="mt-10 w-full max-w-lg">
          <fieldset>
            <div className="relative">
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm text-gray-300">Prompt</label>
                <div className="flex items-center space-x-2">
                  <label className="text-sm text-gray-300">Use optimized prompt</label>
                  <Switch
                    checked={useOptimizedPrompt}
                    onCheckedChange={setUseOptimizedPrompt}
                  />
                </div>
              </div>
              <Textarea
                rows={4}
                spellCheck={false}
                placeholder="Describe your image..."
                required
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="w-full resize-none border-gray-300 border-opacity-50 bg-gray-400 px-4 text-base placeholder-gray-300"
              />
              {optimizedPrompt && optimizedPrompt !== prompt && (
                <div className="mt-2 text-sm text-gray-300">
                  <p>Optimized prompt:</p>
                  <p className="italic">{optimizedPrompt}</p>
                </div>
              )}
              <div
                className={`${isFetching || isDebouncing ? "flex" : "hidden"} absolute bottom-3 right-3 items-center justify-center`}
              >
                <Spinner className="size-4" />
              </div>
            </div>

            <div className="mt-3 text-sm md:text-right">
              <label
                title="Use earlier images as references"
                className="inline-flex items-center gap-2"
              >
                Consistency mode
                <Switch
                  checked={iterativeMode}
                  onCheckedChange={setIterativeMode}
                />
              </label>
            </div>
          </fieldset>
        </form>
      </div>

      <div className="flex w-full grow flex-col items-center justify-center pb-8 pt-4 text-center">
        {!activeImage || !prompt ? (
          <div className="max-w-xl md:max-w-4xl lg:max-w-3xl">
            <p className="text-xl font-semibold text-gray-200 md:text-3xl lg:text-4xl">
              Generate images in real-time
            </p>
            <p className="mt-4 text-balance text-sm text-gray-300 md:text-base lg:text-lg">
              Enter a prompt and generate images in milliseconds as you type.
              Powered by Flux on Together AI.
            </p>
          </div>
        ) : (
          <div className="mt-4 flex w-full max-w-4xl flex-col justify-center">
            <div>
              <Image
                placeholder="blur"
                blurDataURL={imagePlaceholder.blurDataURL}
                width={1024}
                height={768}
                src={`data:image/png;base64,${activeImage.b64_json}`}
                alt=""
                className={`${isFetching ? "animate-pulse" : ""} max-w-full rounded-lg object-cover shadow-sm shadow-black`}
              />
            </div>

            <div className="mt-4 flex gap-4 overflow-x-scroll pb-4">
              {generations.map((generatedImage, i) => (
                <button
                  key={i}
                  className="w-32 shrink-0 opacity-50 hover:opacity-100"
                  onClick={() => setActiveIndex(i)}
                >
                  <Image
                    placeholder="blur"
                    blurDataURL={imagePlaceholder.blurDataURL}
                    width={1024}
                    height={768}
                    src={`data:image/png;base64,${generatedImage.image.b64_json}`}
                    alt=""
                    className="max-w-full rounded-lg object-cover shadow-sm shadow-black"
                  />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <footer className="mt-16 w-full items-center pb-10 text-center text-gray-300 md:mt-4 md:flex md:justify-between md:pb-5 md:text-xs lg:text-sm">
        <p>
          Powered by{" "}
          <a
            href="https://www.dub.sh/together-ai"
            target="_blank"
            className="underline underline-offset-4 transition hover:text-blue-500"
          >
            Together.ai
          </a>{" "}
          &{" "}
          <a
            href="https://dub.sh/together-flux"
            target="_blank"
            className="underline underline-offset-4 transition hover:text-blue-500"
          >
            Flux
          </a>
        </p>

        <div className="mt-8 flex items-center justify-center md:mt-0 md:justify-between md:gap-6">
          <p className="hidden whitespace-nowrap md:block">
            100% free and{" "}
            <a
              href="https://github.com/Nutlope/blinkshot"
              target="_blank"
              className="underline underline-offset-4 transition hover:text-blue-500"
            >
              open source
            </a>
          </p>

          
        </div>
      </footer>
    </div>
  );
}
