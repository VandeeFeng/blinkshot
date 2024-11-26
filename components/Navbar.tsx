"use client";

import { createClientComponentClient, User } from '@supabase/auth-helpers-nextjs';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "./ui/button";
import { UserCircle } from 'lucide-react';

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
            Morpheus Dream Composer
          </Link>
          
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <div className="group relative">
                  <button 
                    onClick={handleSignOut}
                    className="flex items-center gap-2 p-2 rounded-full hover:bg-gray-800/80 transition-colors"
                  >
                    <UserCircle className="h-5 w-5 text-gray-300 group-hover:text-white" />
                  </button>
                  <div className="absolute -bottom-16 right-0 mr-1 whitespace-nowrap rounded bg-gray-800/90 px-3 py-2 text-xs shadow-lg
                    opacity-0 translate-y-1 pointer-events-none
                    transition-all duration-200 ease-in-out
                    group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto
                    border border-gray-700/50 backdrop-blur-sm">
                    <div className="font-medium text-gray-200">{user.email}</div>
                    <div className="mt-1 text-gray-300 text-[11px] font-light">Click to sign out</div>
                  </div>
                </div>
                <Link href="/journal">
                  <Button variant="ghost" className="text-gray-200 hover:text-white hover:bg-gray-800">
                    My Dreams
                  </Button>
                </Link>
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