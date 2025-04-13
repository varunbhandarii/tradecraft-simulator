"use client";

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function Home() {
  const { token, isLoading } = useAuth();
  const router = useRouter();

  // Redirect logged-in users to their portfolio
  useEffect(() => {
    if (!isLoading && token) {
      router.replace('/portfolio'); // Use replace to avoid adding homepage to history
    }
  }, [isLoading, token, router]);

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-150px)]"> 
        <p>Loading...</p> 
      </div>
    );
  }

  // Don't render homepage content if logged in (will redirect)
  if (token) {
    return null; // Or return loading state again briefly
  }

  // Content for logged-out users
  return (
    <div className="flex flex-col items-center justify-center text-center min-h-[calc(100vh-150px)] px-4"> {/* Adjust min-h */}
      <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl md:text-6xl mb-6">
        Welcome to the <span className="text-indigo-600">Trading Simulator</span>
      </h1>
      <p className="max-w-2xl text-lg text-gray-600 mb-8">
        Practice your trading strategies, manage a virtual portfolio, and analyze risk without using real money. Get started by creating an account or logging in.
      </p>
      <div className="flex gap-4 items-center flex-col sm:flex-row">
        <Link
          href="/login"
          className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Login
        </Link>
        <Link
          href="/register"
           className="inline-flex items-center justify-center px-6 py-3 border border-indigo-600 text-base font-medium rounded-md text-indigo-700 bg-white hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Register
        </Link>
      </div>
    </div>
  );
}