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
import { useEffect, useState, useRef, useCallback } from "react";
import TypewriterEffect from '@/components/TypewriterEffect';
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSearchParams } from 'next/navigation';
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { X } from "lucide-react";
import PasswordDialog from "@/components/PasswordDialog";

export type DreamJournal = {
  id: string;
  user_id: string;
  title: string;
  content: string;
  dream_date: string;
  generated_image_b64?: string;
  created_at: string;
  updated_at: string;
};

type ImageResponse = {
  b64_json: string;
  timings: { inference: number };
};

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [iterativeMode, setIterativeMode] = useState(false);
  const [userAPIKey, setUserAPIKey] = useState("");
  const [pendingOptimizedPrompt, setPendingOptimizedPrompt] = useState("");
  const [optimizeSettings, setOptimizeSettings] = useState({
    enabled: false,
    optimizedPrompt: "",
  });
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [shouldGenerateImage, setShouldGenerateImage] = useState(false);
  const [generations, setGenerations] = useState<
    { prompt: string; image: ImageResponse }[]
  >([]);
  let [activeIndex, setActiveIndex] = useState<number>();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 将 debounce 时间保持在 1500ms (1.5秒)
  const debouncedPrompt = useDebounce(prompt, 1500);

  // 新增一个状态来追踪是否应该开始生成图片
  const [shouldStartGenerating, setShouldStartGenerating] = useState(false);

  const [lastOptimizedPrompt, setLastOptimizedPrompt] = useState("");

  const [showTitleDialog, setShowTitleDialog] = useState(false);
  const [journalTitle, setJournalTitle] = useState('');

  // 添加一个新的状态来跟踪保存状态
  const [isSaving, setIsSaving] = useState(false);

  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      const auth = localStorage.getItem("isAuthenticated") === "true";
      setIsAuthenticated(auth);
    };

    checkAuth();
    window.addEventListener('storage', checkAuth);
    return () => window.removeEventListener('storage', checkAuth);
  }, []);

  const optimizePrompt = useCallback(async (prompt: string) => {
    setIsOptimizing(true);
    try {
      const response = await fetch("/api/optimizePrompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data = await response.json();
      
      if (data.optimizedPrompt) {
        setPendingOptimizedPrompt(data.optimizedPrompt);
        setLastOptimizedPrompt(prompt);
      }
    } catch (error) {
      console.error("Error optimizing prompt:", error);
      toast.error("Failed to optimize prompt");
    } finally {
      setIsOptimizing(false);
    }
  }, []);

  const acceptOptimizedPrompt = () => {
    setOptimizeSettings(prev => ({ ...prev, optimizedPrompt: pendingOptimizedPrompt }));
    setPendingOptimizedPrompt("");
    setShouldGenerateImage(true);
  };

  const rejectOptimizedPrompt = () => {
    setPendingOptimizedPrompt("");
    setOptimizeSettings(prev => ({ ...prev, optimizedPrompt: "" }));
    setShouldGenerateImage(false);
    setShouldStartGenerating(false);
  };

  useEffect(() => {
    if (debouncedPrompt.trim()) {
      if (optimizeSettings.enabled) {
        if (!pendingOptimizedPrompt && !optimizeSettings.optimizedPrompt && debouncedPrompt !== lastOptimizedPrompt) {
          optimizePrompt(debouncedPrompt);
          setShouldGenerateImage(false);
        }
      } else {
        setShouldGenerateImage(true);
      }
      setShouldStartGenerating(true);
    } else {
      setOptimizeSettings(prev => ({ ...prev, optimizedPrompt: "" }));
      setPendingOptimizedPrompt("");
      setShouldStartGenerating(false);
      setLastOptimizedPrompt("");
    }
  }, [debouncedPrompt, optimizeSettings.enabled, pendingOptimizedPrompt, optimizeSettings.optimizedPrompt, lastOptimizedPrompt, optimizePrompt]);

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
    enabled: !!currentPrompt.trim() && !isOptimizing && shouldGenerateImage && shouldStartGenerating && (!optimizeSettings.enabled || !!optimizeSettings.optimizedPrompt),
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
      
      // 将当前状态添加到 URL
      const searchParams = new URLSearchParams(window.location.search);
      searchParams.set('prompt', currentPrompt);
      searchParams.set('activeIndex', String(generations.length));
      const newUrl = `${window.location.pathname}?${searchParams.toString()}`;
      window.history.replaceState({}, '', newUrl);
    }
  }, [generations, image, currentPrompt]);

  let activeImage =
    activeIndex !== undefined ? generations[activeIndex].image : undefined;

  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setPrompt(newValue);
    if (!newValue.trim()) {
      setOptimizeSettings(prev => ({ ...prev, optimizedPrompt: "" }));
      setPendingOptimizedPrompt("");
      setShouldGenerateImage(false);
      setShouldStartGenerating(false);
      setLastOptimizedPrompt("");
    } else if (newValue !== prompt) {
      setOptimizeSettings(prev => ({ ...prev, optimizedPrompt: "" }));
      setPendingOptimizedPrompt("");
      setShouldGenerateImage(false);
      setShouldStartGenerating(false);
    }
  };

  const searchParams = useSearchParams();

  useEffect(() => {
    const savedPrompt = searchParams.get('prompt');
    const savedActiveIndex = searchParams.get('activeIndex');
    
    if (savedPrompt) {
      setPrompt(savedPrompt);
      setShouldGenerateImage(true);
      setShouldStartGenerating(true);
    }
    
    if (savedActiveIndex) {
      setActiveIndex(parseInt(savedActiveIndex));
    }
  }, [searchParams]);

  // 添加一个保存到日志的函数
  const getDefaultTitle = () => {
    const now = new Date();
    return `Dream on ${format(now, 'MMM dd, yyyy HH:mm')}`;
  };

  const handleSaveToJournal = async (e: React.MouseEvent) => {
    e.preventDefault();
    
    if (!activeImage) return;
    
    setJournalTitle(getDefaultTitle());
    setShowTitleDialog(true);
  };

  const handleConfirmSave = async () => {
    if (!activeImage?.b64_json) {
      toast.error('No image to save');
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('dream_journals')
        .insert([{
          title: journalTitle,
          content: prompt,
          dream_date: new Date().toISOString(),
          generated_image_b64: activeImage.b64_json
        }]);

      if (error) {
        console.error('Error saving to journal:', error);
        toast.error('Failed to save to journal');
        return;
      }

      toast.success('Successfully saved to journal');
      setShowTitleDialog(false);
    } catch (error) {
      console.error('Error saving to journal:', error);
      toast.error('Failed to save to journal');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      {!isAuthenticated ? (
        <PasswordDialog onCorrectPassword={() => setIsAuthenticated(true)} />
      ) : (
        <div className="flex h-full flex-col px-5">
          <header className="flex flex-col items-center pt-20 md:pt-3">
    <h1 className="text-4xl font-bold text-center mb-4">
      Morpheus Dream Composer
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

  <div className="flex justify-center mt-4">
    <Link 
      href="/journal"
      className={cn(
        "flex items-center gap-2 text-gray-300 hover:text-blue-400 transition-colors",
        "bg-transparent p-2 rounded-lg",
        "hover:bg-gray-800/80",
        "group"
      )}
    >
      <span>Dream Journal</span>
      <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
    </Link>
  </div>

        <div className="flex justify-center">
          <form className="mt-10 w-full max-w-lg">
            <fieldset>
              <div className="relative">
                <Textarea
                  ref={textareaRef}
                  rows={4}
                  spellCheck={false}
                  placeholder="Describe your dream..."
                  required
                  value={prompt}
                  onChange={handlePromptChange}
                  className="w-full resize-none border-gray-300 border-opacity-50 bg-gray-400 px-4 text-base placeholder-gray-300"
                />
                {optimizeSettings.enabled && pendingOptimizedPrompt && (
                  <div className="mt-2 text-sm text-gray-300">
                    <p>AI optimized: <TypewriterEffect text={pendingOptimizedPrompt} /></p>
                    <div className="mt-2 flex justify-end space-x-2">
                      <Button 
                        onClick={acceptOptimizedPrompt} 
                        variant="outline"
                        size="sm"
                        className="text-gray-300 hover:text-gray-100 border-gray-500/50 hover:bg-gray-700/80 transition-colors"
                      >
                        Accept
                      </Button>
                      <Button 
                        onClick={rejectOptimizedPrompt} 
                        variant="outline"
                        size="sm"
                        className="text-gray-300 hover:text-gray-100 border-gray-500/50 hover:bg-gray-700/80 transition-colors"
                      >
                        Reject
                      </Button>
                    </div>
                  </div>
                )}
                {optimizeSettings.enabled && optimizeSettings.optimizedPrompt && (
                  <div className="mt-2 text-sm text-gray-300">
                    Using AI optimized: <TypewriterEffect text={optimizeSettings.optimizedPrompt} />
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
                      setOptimizeSettings(prev => ({ ...prev, enabled: checked, optimizedPrompt: "" }));
                      if (checked) {
                        // 不立即触发优化，让 useEffect 处理
                        setShouldGenerateImage(false);
                        setShouldStartGenerating(false);
                      } else {
                        // 如果关闭 AI 模式，立即允许生成图片
                        setShouldGenerateImage(true);
                        setShouldStartGenerating(true);
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
                Dream is the bridge between consciousness and the unconscious. 
              </p>
              <p className="mt-4 text-balance text-sm text-gray-300 md:text-base lg:text-lg">
                Enter a prompt to quickly generate images that reveal your hidden dreams.
                <br/>
                Use AI mode to automatically enhance your prompts for more vivid results.
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
                
                <div className="mt-4 p-3 bg-gray-800/70 border border-gray-600 rounded-lg flex items-center justify-between">
                  <p className="text-gray-200">
                    Want to save this dream visualization to your journal?
                  </p>
                  <Link 
                    href="/journal"
                    onClick={handleSaveToJournal}
                    className={cn(
                      "flex items-center gap-2 text-gray-300 hover:text-blue-400 transition-colors",
                      "bg-transparent p-2 rounded-lg",
                      "hover:bg-gray-800/80",
                      "group"
                    )}
                  >
                    <span>Save to Journal</span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </div>
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

        <Dialog open={showTitleDialog} onOpenChange={setShowTitleDialog}>
          <DialogContent className="sm:max-w-[425px] bg-gray-800/60 backdrop-blur-md border border-gray-600/50 shadow-2xl rounded-xl p-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label htmlFor="title" className="text-sm font-medium text-gray-200">
                  Dream Title
                </label>
                <button 
                  onClick={() => setShowTitleDialog(false)}
                  className="text-gray-400 hover:text-gray-200 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              
              <Input
                id="title"
                placeholder="Enter a title for your dream..."
                value={journalTitle}
                onChange={(e) => setJournalTitle(e.target.value)}
                className="bg-gray-700/80 text-gray-100 border-gray-500/30 placeholder:text-gray-400 focus-visible:ring-blue-500/50 focus-visible:border-blue-500/50 h-11"
              />

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowTitleDialog(false)}
                  className="text-gray-300 hover:text-gray-100 border-gray-500/50 hover:bg-gray-700/80 transition-colors px-5"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirmSave}
                  variant="outline"
                  disabled={isSaving}
                  className={cn(
                    "text-gray-300 hover:text-gray-100 border-gray-500/50 hover:bg-gray-700/80 transition-colors px-5",
                    "relative", // 添加相对定位
                    isSaving && "cursor-not-allowed opacity-70" // 保存时降低透明度
                  )}
                >
                  {isSaving ? (
                    <>
                      <Spinner className="size-4 absolute left-3" />
                      <span className="ml-6">Saving...</span>
                    </>
                  ) : (
                    "Save to Journal"
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    )}
  </>
);
}