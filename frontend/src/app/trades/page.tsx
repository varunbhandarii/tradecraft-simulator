"use client";

import React, { useState, useEffect } from "react";
import ProtectedRoute from "@/components/Auth/ProtectedRoute";
import TradesTable from "@/components/Trades/TradesTable";
import { fetchTradeHistory, TradeResponse } from "@/services/portfolioService";
import axios from "axios";

export default function TradeHistoryPage() {
  const [trades, setTrades] = useState<TradeResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadTrades = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const fetchedTrades = await fetchTradeHistory(0, 100); // Load initial batch
        setTrades(fetchedTrades);
      } catch (err: unknown) {
        let errorMessage = "An unexpected error occurred.";
        if (axios.isAxiosError(err) && err.response) {
          // Check specific Axios error first if applicable
          errorMessage = err.response.data.detail || "Request failed.";
        } else if (err instanceof Error) {
          // Check if it's a standard Error object
          errorMessage = err.message;
        }
        // Now use the determined errorMessage
        setError(errorMessage);
        // or throw new Error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };
    loadTrades();
  }, []);

  return (
    <ProtectedRoute>
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Trade History</h1>

        {error && !isLoading && (
          <div
            className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6"
            role="alert"
          >
            <p className="font-bold">Error Loading Trades</p>
            <p>{error}</p>
          </div>
        )}

        {/* Render Table */}
        <TradesTable trades={trades} isLoading={isLoading} />

      </div>
    </ProtectedRoute>
  );
}
