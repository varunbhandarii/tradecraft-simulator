"use client";

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { usePathname } from 'next/navigation';

const Navbar: React.FC = () => {
  const { token, user, logout } = useAuth();
  const pathname = usePathname(); // Get the current route

  // Helper function to determine if a link is active
  const isActive = (href: string) => pathname === href;

  const linkClasses = "px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150 ease-in-out";
  const activeLinkClasses = "bg-gray-900 text-white";
  const inactiveLinkClasses = "text-gray-300 hover:bg-gray-700 hover:text-white";

  return (
    <nav className="bg-gray-800 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left Side: Logo/Title */}
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Link href="/" className="font-bold text-xl hover:text-gray-300">
                Trading Sim
              </Link>
            </div>
             {/* Main Nav Links (Logged In) */}
             {token && (
                 <div className="hidden md:block">
                    <div className="ml-10 flex items-baseline space-x-4">
                         <Link
                            href="/portfolio"
                            className={`${linkClasses} ${isActive('/portfolio') ? activeLinkClasses : inactiveLinkClasses}`}
                         >
                            Portfolio
                         </Link>
                         <Link
                            href="/trades"
                            className={`${linkClasses} ${isActive('/trades') ? activeLinkClasses : inactiveLinkClasses}`}
                         >
                            Trade History
                         </Link>
                    </div>
                </div>
             )}
          </div>


          {/* Right Side: Auth Links / User Info */}
          <div className="hidden md:block">
            <div className="ml-4 flex items-center md:ml-6">
              {token ? (
                <>
                  {user && (
                    <span className="text-gray-300 text-sm mr-4">
                       Welcome, {user.username}!
                    </span>
                  )}
                  <button
                    onClick={logout}
                    className="bg-red-600 hover:bg-red-700 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white"
                  >
                    Logout
                  </button>
                </>
              ) : (
                 <div className="flex items-baseline space-x-4">
                     <Link
                        href="/login"
                         className={`${linkClasses} ${isActive('/login') ? activeLinkClasses : inactiveLinkClasses}`}
                     >
                        Login
                     </Link>
                     <Link
                        href="/register"
                         className={`${linkClasses} ${isActive('/register') ? activeLinkClasses : inactiveLinkClasses}`}
                     >
                        Register
                     </Link>
                 </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;