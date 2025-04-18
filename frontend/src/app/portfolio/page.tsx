"use client";

import React, { useState, useEffect, useCallback } from 'react';
import ProtectedRoute from '@/components/Auth/ProtectedRoute';
import PortfolioSummary from '@/components/Portfolio/PortfolioSummary';
import HoldingsTable from '@/components/Portfolio/HoldingsTable';
import RiskInfo from '@/components/Portfolio/RiskInfo';
import OrderForm from '@/components/Trading/OrderForm';
import PendingOrdersTable from '@/components/Trading/PendingOrdersTable'; // <<< Import PendingOrdersTable
import { fetchPortfolio, fetchVaR, PortfolioResponse, VaRResponse } from '@/services/portfolioService';
import { fetchPendingOrders, cancelPendingOrder, PendingOrderResponse } from '@/services/tradingService'; // <<< Import trading service functions/types
import { useAuth } from '@/context/AuthContext';
import { CheckCircle } from 'lucide-react'; // For success toast

export default function PortfolioPage() {
  const [portfolioData, setPortfolioData] = useState<PortfolioResponse | null>(null);
  const [varData, setVarData] = useState<VaRResponse | null>(null);
  const [pendingOrders, setPendingOrders] = useState<PendingOrderResponse[]>([]); // <<< State for pending orders
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null); // For brief success messages
  const { user } = useAuth();

  const showToast = (message: string) => {
    setSuccessToast(message);
    setTimeout(() => setSuccessToast(null), 3000); // Hide after 3 seconds
  }

  // Combined loading function
  const loadData = useCallback(async (showSuccess: boolean = false) => {
    setIsLoading(true);
    setError(null); // Clear previous errors on reload
    if (showSuccess) showToast("Data refreshed successfully!"); // Show refresh toast

    try {
      const results = await Promise.allSettled([
        fetchPortfolio(),
        fetchVaR(),
        fetchPendingOrders() // <<< Fetch pending orders too
      ]);

      let portfolioError: string | null = null;
      let varError: string | null = null;
      let pendingOrdersError: string | null = null;

      if (results[0].status === 'fulfilled') { setPortfolioData(results[0].value); }
      else { console.error("Portfolio fetch failed:", results[0].reason); portfolioError = results[0].reason?.message || "Failed portfolio."; }

      if (results[1].status === 'fulfilled') { setVarData(results[1].value); }
      else { console.error("VaR fetch failed:", results[1].reason); varError = results[1].reason?.message || "Failed VaR."; }

      if (results[2].status === 'fulfilled') { setPendingOrders(results[2].value); } // <<< Set pending orders state
      else { console.error("Pending Orders fetch failed:", results[2].reason); pendingOrdersError = results[2].reason?.message || "Failed pending orders."; }

      const combinedError = [portfolioError, varError, pendingOrdersError].filter(Boolean).join('; ');
      if (combinedError) { setError(combinedError); }

    } catch (err) {
      console.error("Error loading portfolio page data:", err);
      setError('An unexpected error occurred loading page data.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // --- Handler for cancelling an order ---
  const handleCancelOrder = useCallback(async (orderId: number) => {
      setError(null); // Clear previous errors
      try {
          await cancelPendingOrder(orderId);
          showToast(`Order ${orderId} cancelled successfully.`);
          await loadData();
      } catch (err: unknown) {
         let errorMessage = "Failed to cancel order.";
         if (err instanceof Error) { errorMessage = err.message; }
         setError(errorMessage);
      }
  }, [loadData]); // Depend on loadData if using it for refresh

  return (
    <ProtectedRoute>
      <div>
         {successToast && (
             <div className="fixed top-20 right-5 z-50 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded shadow-lg flex items-center" role="alert">
               <CheckCircle className="h-5 w-5 mr-2"/>
               <span className="block sm:inline">{successToast}</span>
             </div>
         )}

        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">
          {user ? `${user.username}'s Portfolio Dashboard` : 'Portfolio Dashboard'}
        </h1>

        {error && !isLoading && ( <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert"><p className="font-bold">Error</p><p>{error}</p></div> )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
           <div className="md:col-span-2 space-y-6">
               <PortfolioSummary data={portfolioData} isLoading={isLoading} />
               {/* Pass loadData with boolean flag to show success toast on refresh */}
               <OrderForm onOrderSuccess={() => loadData(true)} />
           </div>
           <div className="space-y-6">
              <RiskInfo data={varData} isLoading={isLoading} />
           </div>
        </div>

         {/* Pending Orders Section */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Pending Orders</h2>
          <PendingOrdersTable
            pendingOrders={pendingOrders}
            isLoading={isLoading}
            onCancelOrder={handleCancelOrder}
          />
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