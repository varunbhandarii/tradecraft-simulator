"use client";

import React, { useState, useEffect, useCallback } from 'react';
import ProtectedRoute from '@/components/Auth/ProtectedRoute';
import PortfolioSummary from '@/components/Portfolio/PortfolioSummary';
import HoldingsTable from '@/components/Portfolio/HoldingsTable';
import RiskInfo from '@/components/Portfolio/RiskInfo';
import OrderForm from '@/components/Trading/OrderForm';
import { fetchPortfolio, fetchVaR, PortfolioResponse, VaRResponse } from '@/services/portfolioService';
import { useAuth } from '@/context/AuthContext'; // Import useAuth to access user info

export default function PortfolioPage() {
  const [portfolioData, setPortfolioData] = useState<PortfolioResponse | null>(null);
  const [varData, setVarData] = useState<VaRResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth(); // Get user info if needed for personalization

  const loadData = useCallback(async () => {
    // Only attempt loading if user is available (prevents race condition on login)
    // isLoading check within AuthContext ensures this runs after auth check
    setIsLoading(true);
    setError(null);
    try {
      const results = await Promise.allSettled([fetchPortfolio(), fetchVaR()]);
      let portfolioError: string | null = null;
      let varError: string | null = null;
      if (results[0].status === 'fulfilled') { setPortfolioData(results[0].value); }
      else { console.error("Portfolio fetch failed:", results[0].reason); portfolioError = results[0].reason?.message || "Failed portfolio."; }
      if (results[1].status === 'fulfilled') { setVarData(results[1].value); }
      else { console.error("VaR fetch failed:", results[1].reason); varError = results[1].reason?.message || "Failed VaR."; }
      if (portfolioError || varError) { setError([portfolioError, varError].filter(Boolean).join(' ')); }
    } catch (err) { console.error("Error loading portfolio page data:", err); setError('An unexpected error occurred loading page data.');
    } finally { setIsLoading(false); }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <ProtectedRoute>
      <div>
         <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">
            {user ? `${user.username}'s Portfolio Dashboard` : 'Portfolio Dashboard'}
         </h1>

        {/* Display overall error message */}
        {error && !isLoading && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert">
            <p className="font-bold">Error Loading Data</p>
            <p>{error}</p>
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
           <div className="md:col-span-2 space-y-6">
               <PortfolioSummary data={portfolioData} isLoading={isLoading} />
               <OrderForm onOrderSuccess={loadData} />
           </div>
           <div className="space-y-6">
              <RiskInfo data={varData} isLoading={isLoading} />
           </div>
        </div>

        {/* Holdings Section */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">My Holdings</h2>
          <HoldingsTable holdings={portfolioData?.holdings} isLoading={isLoading} />
        </div>

      </div>
    </ProtectedRoute>
  );
}