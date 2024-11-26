"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClientComponentClient, User } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { Button } from "./ui/button";

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const supabase = createClientComponentClient();
  const router = useRouter();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.refresh();
    router.push('/');
  };

  return (
    <nav className="fixed top-0 w-full z-50 bg-gray-900/50 backdrop-blur-sm border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link href="/" className="text-xl font-bold text-gray-200">
            Morpheus
          </Link>
          
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <span className="text-gray-300">{user.email}</span>
                <Link href="/journal">
                  <Button variant="ghost" className="text-gray-200 hover:text-white hover:bg-gray-800">
                    My Dreams
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  onClick={handleSignOut}
                  className="text-gray-200 hover:text-white hover:bg-gray-800"
                >
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" className="text-gray-200 hover:text-white hover:bg-gray-800">
                    Login
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button variant="ghost" className="text-gray-200 hover:text-white hover:bg-gray-800">
                    Sign Up
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
} 