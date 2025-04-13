import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from '@/context/AuthContext';
import Navbar from "@/components/Layout/Navbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Simulated Trading Platform",
  description: "A project for trading simulation",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full bg-gray-50">
      <body className={`${inter.className} h-full flex flex-col`}>
        <AuthProvider>
          <Navbar />
          <main className="flex-grow max-w-7xl w-full mx-auto py-6 sm:px-6 lg:px-8">
            {children}
          </main>
          <footer className="w-full mt-auto bg-gray-100 border-t border-gray-200 py-4 text-center text-sm text-gray-500">
             © {new Date().getFullYear()} Simulated Trading Platform. For educational purposes only.
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}