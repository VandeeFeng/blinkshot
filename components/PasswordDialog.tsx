"use client";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";

interface PasswordDialogProps {
  onCorrectPassword: () => void;
}

export default function PasswordDialog({ onCorrectPassword }: PasswordDialogProps) {
  const [password, setPassword] = useState("");
  const correctPassword = process.env.NEXT_PUBLIC_ACCESS_PASSWORD;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!correctPassword) {
      console.error("Access password not set in environment variables");
      toast.error("System configuration error");
      return;
    }

    if (password === correctPassword) {
      localStorage.setItem("isAuthenticated", "true");
      window.dispatchEvent(new Event('storage'));
      onCorrectPassword();
      toast.success("Welcome to Morpheus Dream Composer");
    } else {
      toast.error("Incorrect password");
    }
  };

  return (
    <Dialog open={true}>
      <DialogContent className="sm:max-w-[425px] bg-gray-800/40 backdrop-blur-sm border border-gray-600/30 shadow-2xl rounded-xl p-6 z-50">
        <div className="space-y-4">
          <div className="text-center space-y-2">
            <h2 className="text-xl font-semibold text-gray-100">Enter Password</h2>
            <p className="text-sm text-gray-200/90">
              Please enter the password to access Morpheus Dream Composer
            </p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="password"
              placeholder="Enter password..."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-gray-700/60 text-gray-100 border-gray-500/30 
                placeholder:text-gray-400 focus-visible:ring-blue-500/50 
                focus-visible:border-blue-500/50"
            />

            <Button
              type="submit"
              className="w-full bg-blue-500/80 hover:bg-blue-600/80 text-white"
            >
              Enter
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
} 