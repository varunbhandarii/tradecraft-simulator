"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react'; // Import icons

const Navbar: React.FC = () => {
  const { token, user, logout } = useAuth();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isActive = (href: string) => pathname === href;

  const baseLinkClasses = "px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150 ease-in-out";
  const activeLinkClasses = "bg-gray-900 text-white";
  const inactiveLinkClasses = "text-gray-300 hover:bg-gray-700 hover:text-white";

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const commonLinks = (isMobile: boolean = false) => (
    <>
      {token ? (
        <>
          <Link
            href="/portfolio"
            className={`${baseLinkClasses} ${isActive('/portfolio') ? activeLinkClasses : inactiveLinkClasses} ${isMobile ? 'block' : ''}`}
            onClick={() => isMobile && setIsMobileMenuOpen(false)}
          >
            Portfolio
          </Link>
          <Link
            href="/trades"
            className={`${baseLinkClasses} ${isActive('/trades') ? activeLinkClasses : inactiveLinkClasses} ${isMobile ? 'block' : ''}`}
            onClick={() => isMobile && setIsMobileMenuOpen(false)}
          >
            Trade History
          </Link>
          {user && isMobile && ( // Show username in mobile menu if logged in
            <span className="block px-3 py-2 text-gray-300 text-sm">
                Welcome, {user.username}!
            </span>
          )}
          <button
            onClick={() => {
              logout();
              if (isMobile) setIsMobileMenuOpen(false);
            }}
            className={`${isMobile ? 'block w-full text-left bg-red-500 hover:bg-red-600' : 'bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white'} ${baseLinkClasses}`}
          >
            Logout
          </button>
        </>
      ) : (
        <>
          <Link
            href="/login"
            className={`${baseLinkClasses} ${isActive('/login') ? activeLinkClasses : inactiveLinkClasses} ${isMobile ? 'block' : ''}`}
            onClick={() => isMobile && setIsMobileMenuOpen(false)}
          >
            Login
          </Link>
          <Link
            href="/register"
            className={`${baseLinkClasses} ${isActive('/register') ? activeLinkClasses : inactiveLinkClasses} ${isMobile ? 'block' : ''}`}
            onClick={() => isMobile && setIsMobileMenuOpen(false)}
          >
            Register
          </Link>
        </>
      )}
    </>
  );

  return (
    <nav className="bg-gray-800 text-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left Side: Logo/Title */}
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Link href="/" className="font-bold text-xl hover:text-gray-300">
                TradeCraft Sim
              </Link>
            </div>
            {/* Desktop Main Nav Links (Logged In) - these specific links only shown when logged in */}
            {token && (
              <div className="hidden md:block">
                <div className="ml-10 flex items-baseline space-x-4">
                  <Link
                    href="/portfolio"
                    className={`${baseLinkClasses} ${isActive('/portfolio') ? activeLinkClasses : inactiveLinkClasses}`}
                  >
                    Portfolio
                  </Link>
                  <Link
                    href="/trades"
                    className={`${baseLinkClasses} ${isActive('/trades') ? activeLinkClasses : inactiveLinkClasses}`}
                  >
                    Trade History
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Desktop Right Side: Auth Links / User Info */}
          <div className="hidden md:flex md:items-center md:ml-6"> {/* Always flex for desktop right side */}
            <div className="ml-4 flex items-center space-x-4">
              {token && user && (
                <span className="text-gray-300 text-sm hidden lg:block"> {/* Hide username on medium screens, show on large */}
                  Welcome, {user.username}!
                </span>
              )}
              {/* Conditional Auth Links for Desktop */}
              {token ? (
                <button
                  onClick={logout}
                  className={`bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white ${baseLinkClasses}`}
                >
                  Logout
                </button>
              ) : (
                <>
                  <Link
                    href="/login"
                    className={`${baseLinkClasses} ${isActive('/login') ? activeLinkClasses : inactiveLinkClasses}`}
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    className={`${baseLinkClasses} ${isActive('/register') ? activeLinkClasses : inactiveLinkClasses}`}
                  >
                    Register
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              aria-controls="mobile-menu"
              aria-expanded={isMobileMenuOpen}
            >
              <span className="sr-only">Open main menu</span>
              {isMobileMenuOpen ? (
                <X className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu, show/hide based on menu state */}
      {isMobileMenuOpen && (
        <div className="md:hidden" id="mobile-menu">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {/* Render common links for mobile, which includes portfolio/trades if logged in */}
            {commonLinks(true)}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;