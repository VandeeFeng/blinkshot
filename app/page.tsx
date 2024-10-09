"use client";

import Spinner from "@/components/spinner";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import imagePlaceholder from "@/public/image-placeholder.png";
import { useQuery } from "@tanstack/react-query";
import { useDebounce } from "@uidotdev/usehooks";
import Image from "next/image";
import { useEffect, useState, useRef } from "react";

type ImageResponse = {
  b64_json: string;
  timings: { inference: number };
};

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [iterativeMode, setIterativeMode] = useState(false);
  const [userAPIKey, setUserAPIKey] = useState("");
  const [optimizeSettings, setOptimizeSettings] = useState({
    enabled: false,
    optimizedPrompt: "",
  });
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [generations, setGenerations] = useState<
    { prompt: string; image: ImageResponse }[]
  >([]);
  let [activeIndex, setActiveIndex] = useState<number>();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const debouncedPrompt = useDebounce(prompt, 300);

  const [pendingOptimizedPrompt, setPendingOptimizedPrompt] = useState("");
  const [shouldGenerateImage, setShouldGenerateImage] = useState(false);

  const optimizePrompt = async (inputPrompt: string) => {
    setIsOptimizing(true);
    try {
      const res = await fetch("/api/optimizePrompt", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt: inputPrompt }),
      });

      if (!res.ok) {
        throw new Error(await res.text());
      }

      const data = await res.json();
      setPendingOptimizedPrompt(data.optimizedPrompt);
    } catch (error) {
      console.error('Error optimizing prompt:', error);
    } finally {
      setIsOptimizing(false);
    }
  };

  const acceptOptimizedPrompt = () => {
    setOptimizeSettings(prev => ({ ...prev, optimizedPrompt: pendingOptimizedPrompt }));
    setPendingOptimizedPrompt("");
    setShouldGenerateImage(true);
  };

  const rejectOptimizedPrompt = () => {
    setPendingOptimizedPrompt("");
    setShouldGenerateImage(true);
  };

  useEffect(() => {
    if (optimizeSettings.enabled && debouncedPrompt.trim()) {
      optimizePrompt(debouncedPrompt);
      setShouldGenerateImage(false);
    } else if (!optimizeSettings.enabled) {
      setShouldGenerateImage(true);
    }
  }, [optimizeSettings.enabled, debouncedPrompt]);

  const currentPrompt = optimizeSettings.enabled && optimizeSettings.optimizedPrompt
    ? optimizeSettings.optimizedPrompt
    : debouncedPrompt;

  const { data: image, isFetching } = useQuery({
    queryKey: [currentPrompt, iterativeMode],
    queryFn: async () => {
      let res = await fetch("/api/generateImages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          prompt: currentPrompt, 
          userAPIKey, 
          iterativeMode 
        }),
      });

      if (!res.ok) {
        throw new Error(await res.text());
      }
      return (await res.json()) as ImageResponse;
    },
    enabled: !!currentPrompt.trim() && !isOptimizing && shouldGenerateImage,
    staleTime: Infinity,
    retry: false,
  });

  useEffect(() => {
    if (image && !generations.map((g) => g.image).includes(image)) {
      setGenerations((images) => [...images, { 
        prompt: currentPrompt, 
        image 
      }]);
      setActiveIndex(generations.length);
    }
  }, [generations, image, currentPrompt]);

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
              <Textarea
                ref={textareaRef}
                rows={4}
                spellCheck={false}
                placeholder="Describe your image..."
                required
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="w-full resize-none border-gray-300 border-opacity-50 bg-gray-400 px-4 text-base placeholder-gray-300"
              />
              {optimizeSettings.enabled && pendingOptimizedPrompt && (
                <div className="mt-2 text-sm text-gray-300">
                  <p>AI optimized: {pendingOptimizedPrompt}</p>
                  <div className="mt-2 flex justify-end space-x-2">
                    <Button onClick={acceptOptimizedPrompt} variant="secondary" size="sm">
                      Accept
                    </Button>
                    <Button onClick={rejectOptimizedPrompt} variant="outline" size="sm">
                      Reject
                    </Button>
                  </div>
                </div>
              )}
              {optimizeSettings.enabled && optimizeSettings.optimizedPrompt && !pendingOptimizedPrompt && (
                <div className="mt-2 text-sm text-gray-300">
                  Using AI optimized: {optimizeSettings.optimizedPrompt}
                </div>
              )}
              <div
                className={`${isFetching || isOptimizing ? "flex" : "hidden"} absolute bottom-3 right-3 items-center justify-center`}
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
              <label
                className="inline-flex items-center gap-2 ml-4"
                title="Optimize prompt using AI"
              >
                AI mode
                <Switch
                  id="optimize-mode"
                  checked={optimizeSettings.enabled}
                  onCheckedChange={(checked) => {
                    setOptimizeSettings(prev => ({ ...prev, enabled: checked }));
                    if (!checked) {
                      setOptimizeSettings(prev => ({ ...prev, optimizedPrompt: "" }));
                    } else if (debouncedPrompt.trim()) {
                      optimizePrompt(debouncedPrompt);
                    }
                  }}
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