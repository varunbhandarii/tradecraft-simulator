"use client";

import React, { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const Spinner: React.FC = () => (
  <div className="flex justify-center items-center h-32">
    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-500"></div>
  </div>
);


const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { token, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !token) {
      console.log("ProtectedRoute: No token found, redirecting to login.");
      router.replace('/login');
    }
  }, [token, isLoading, router]);

  if (isLoading) {
    return (
       <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
         <Spinner />
       </div>
    );
  }

  // Render children only if token exists and loading is finished
  if (token) {
    return <>{children}</>;
  }

  return null;
};

export default ProtectedRoute;