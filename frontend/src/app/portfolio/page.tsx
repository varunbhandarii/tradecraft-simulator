"use client";

import React, { useState, useEffect, useCallback } from 'react';
import ProtectedRoute from '@/components/Auth/ProtectedRoute';
import PortfolioSummary from '@/components/Portfolio/PortfolioSummary';
import HoldingsTable from '@/components/Portfolio/HoldingsTable';
import RiskInfo from '@/components/Portfolio/RiskInfo';
import OrderForm from '@/components/Trading/OrderForm';
import PendingOrdersTable from '@/components/Trading/PendingOrdersTable';
import PortfolioValueChart from '@/components/Portfolio/PortfolioValueChart';
import AssetAllocationChart from '@/components/Portfolio/AssetAllocationChart';
import { fetchPortfolio, fetchVaR, PortfolioResponse, VaRResponse } from '@/services/portfolioService';
import { fetchPendingOrders, cancelPendingOrder, PendingOrderResponse } from '@/services/tradingService';
import { useAuth } from '@/context/AuthContext';
import { CheckCircle, AlertTriangle } from 'lucide-react';

export default function PortfolioPage() {
  const [portfolioData, setPortfolioData] = useState<PortfolioResponse | null>(null);
  const [varData, setVarData] = useState<VaRResponse | null>(null);
  const [pendingOrders, setPendingOrders] = useState<PendingOrderResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const { user } = useAuth();

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    if (type === 'success') {
      setSuccessToast(message);
      setError(null); // Clear any previous errors
      setTimeout(() => setSuccessToast(null), 4000); // Hide after 4 seconds
    } else {
      setError(message);
      setSuccessToast(null); // Clear any previous success
    }
  };

  const loadData = useCallback(async (showSuccessMessage: boolean = false) => {
    setIsLoading(true);
    if (showSuccessMessage) showToast("Data refreshed successfully!");

    try {
      const results = await Promise.allSettled([
        fetchPortfolio(),
        fetchVaR(),
        fetchPendingOrders()
      ]);

      let portfolioErrorMsg: string | null = null;
      let varErrorMsg: string | null = null;
      let pendingOrdersErrorMsg: string | null = null;

      if (results[0].status === 'fulfilled') { setPortfolioData(results[0].value); }
      else { console.error("Portfolio fetch failed:", results[0].reason); portfolioErrorMsg = (results[0].reason as Error)?.message || "Failed to load portfolio data."; }

      if (results[1].status === 'fulfilled') { setVarData(results[1].value); }
      else { console.error("VaR fetch failed:", results[1].reason); varErrorMsg = (results[1].reason as Error)?.message || "Failed to load VaR data."; }

      if (results[2].status === 'fulfilled') { setPendingOrders(results[2].value); }
      else { console.error("Pending Orders fetch failed:", results[2].reason); pendingOrdersErrorMsg = (results[2].reason as Error)?.message || "Failed to load pending orders."; }

      const combinedError = [portfolioErrorMsg, varErrorMsg, pendingOrdersErrorMsg].filter(Boolean).join('; ');
      if (combinedError) { setError(combinedError); } // Set main error if any part failed

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

  const handleCancelOrder = useCallback(async (orderId: number) => {
    setError(null); // Clear previous errors
    try {
      await cancelPendingOrder(orderId);
      showToast(`Order ${orderId} cancelled successfully.`, 'success');
      await loadData(); // Refresh all data
    } catch (err: unknown) {
      let errorMessage = "Failed to cancel order.";
      if (err instanceof Error) { errorMessage = err.message; }
      showToast(errorMessage, 'error'); // Show error via toast
    }
  }, [loadData]);

  return (
    <ProtectedRoute>
      <div className="px-2 sm:px-0"> {/* Add slight horizontal padding for very small screens */}
        {/* Success Toast Notification */}
        {successToast && (
          <div className="fixed top-24 right-5 z-[100] bg-green-50 border-l-4 border-green-400 text-green-700 p-4 rounded-md shadow-lg flex items-center" role="alert">
            <CheckCircle className="h-6 w-6 mr-3 text-green-500" />
            <span className="block sm:inline">{successToast}</span>
          </div>
        )}

        {/* Page Title */}
        <div className="mb-6 md:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
            {user ? `${user.username}'s Portfolio Dashboard` : 'Portfolio Dashboard'}
            </h1>
        </div>


        {/* Overall Error Display */}
        {error && !isLoading && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-md shadow" role="alert">
            <div className="flex">
              <div className="py-1">
                <AlertTriangle className="h-6 w-6 text-red-400 mr-3" />
              </div>
              <div>
                <p className="font-bold">An error occurred</p>
                <p className="text-sm">{error}</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Main column for Summary and Order Form */}
          <div className="lg:col-span-2 space-y-6">
            <PortfolioSummary data={portfolioData} isLoading={isLoading} />
            <OrderForm onOrderSuccess={() => loadData(true)} /> {/* Pass callback to refresh data */}
          </div>

          {/* Sidebar column for Risk Info */}
          <div className="space-y-6">
            <RiskInfo data={varData} isLoading={isLoading} />
          </div>
        </div>

        {/* Analytics Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 mt-8">
          <div>
            <PortfolioValueChart />
          </div>
          <div>
            <AssetAllocationChart holdings={portfolioData?.holdings} isLoading={isLoading} />
          </div>
        </div>

        {/* Sections below the main grid */}
        <div className="space-y-8"> 
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Pending Orders</h2>
            <PendingOrdersTable
              pendingOrders={pendingOrders}
              isLoading={isLoading}
              onCancelOrder={handleCancelOrder}
            />
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">My Holdings</h2>
            <HoldingsTable holdings={portfolioData?.holdings} isLoading={isLoading} />
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}