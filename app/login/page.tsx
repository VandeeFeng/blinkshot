"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import LoginForm from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-gray-900 to-black">
      <div className="w-full max-w-md">
        <Link 
          href="/"
          className={cn(
            "mb-8 flex items-center gap-2 text-gray-300 hover:text-blue-400 transition-colors",
            "bg-transparent p-2 rounded-lg",
            "hover:bg-gray-800/80",
            "group w-fit"
          )}
        >
          <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
          <span>Back to Home</span>
        </Link>

        <div className="space-y-6 bg-gray-800/50 p-8 rounded-lg backdrop-blur-sm border border-gray-700">
          <div className="space-y-2 text-center">
            <h1 className="text-3xl font-bold tracking-tighter text-white">
              Welcome Back
            </h1>
            <p className="text-gray-300">
              Sign in to your account to continue
            </p>
          </div>

          <LoginForm />

          <div className="text-center text-sm">
            <span className="text-gray-300">Don&apos;t have an account? </span>
            <Link 
              href="/signup" 
              className="text-blue-400 hover:text-blue-300 transition-colors"
            >
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 