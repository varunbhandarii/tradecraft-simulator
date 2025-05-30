"use client";

import React, { useState, useEffect, FormEvent, useCallback } from 'react';
import {
  fetchWatchlist,
  addSymbolToWatchlist,
  removeSymbolFromWatchlist,
  WatchlistItemWithPriceResponse,
  AddSymbolRequest,
} from '@/services/watchlistService';
import { formatCurrency } from '@/utils/formatting';
import { PlusCircle, Trash2, RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';

const WatchlistDisplay: React.FC = () => {
  const [watchlistItems, setWatchlistItems] = useState<WatchlistItemWithPriceResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [newSymbol, setNewSymbol] = useState('');
  const [isAddingSymbol, setIsAddingSymbol] = useState(false);
  const [removingSymbolId, setRemovingSymbolId] = useState<number | null>(null);

  const clearMessages = (clearAll: boolean = false) => {
    setError(null);
    if (clearAll) setSuccessMessage(null);
  };

  const showTemporarySuccess = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 3000);
  }

  const loadWatchlist = useCallback(async (showLoadingIndicator = true) => {
    if (showLoadingIndicator) setIsLoading(true);
    clearMessages();
    try {
      const items = await fetchWatchlist();
      setWatchlistItems(items);
    } catch (err: unknown) {
      let errorMessage = "Could not load watchlist.";
      if (err instanceof Error) errorMessage = err.message;
      setError(errorMessage);
      setWatchlistItems([]);
    } finally {
      if (showLoadingIndicator) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWatchlist();
  }, [loadWatchlist]);

  const handleAddSymbol = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    clearMessages(true);
    if (!newSymbol.trim()) {
      setError("Symbol cannot be empty.");
      return;
    }
    setIsAddingSymbol(true);
    try {
      const symbolToAdd: AddSymbolRequest = { symbol: newSymbol.trim().toUpperCase() };
      await addSymbolToWatchlist(symbolToAdd);
      setNewSymbol(''); // Clear input
      showTemporarySuccess(`Symbol ${symbolToAdd.symbol} added successfully!`);
      await loadWatchlist(false); // Refresh list without main loading indicator
    } catch (err: unknown) {
      let errorMessage = "Failed to add symbol.";
      if (err instanceof Error) errorMessage = err.message;
      setError(errorMessage);
    } finally {
      setIsAddingSymbol(false);
    }
  };

  const handleRemoveSymbol = async (item: WatchlistItemWithPriceResponse) => {
    clearMessages(true);
    setRemovingSymbolId(item.id);
    try {
      await removeSymbolFromWatchlist(item.symbol);
      showTemporarySuccess(`Symbol ${item.symbol} removed successfully.`);
      setWatchlistItems(prevItems => prevItems.filter(i => i.id !== item.id));
    } catch (err: unknown) {
      let errorMessage = "Failed to remove symbol.";
      if (err instanceof Error) errorMessage = err.message;
      setError(errorMessage);
    } finally {
      setRemovingSymbolId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Add Symbol Form */}
      <div className="bg-white shadow sm:rounded-lg border border-gray-200">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-base font-semibold leading-6 text-gray-900">Add Stock to Watchlist</h3>
          <form onSubmit={handleAddSymbol} className="mt-2 sm:flex sm:items-end space-y-3 sm:space-y-0 sm:space-x-3">
            <div className="flex-grow">
              <label htmlFor="new-symbol" className="sr-only">Add new symbol</label>
              <input
                type="text"
                id="new-symbol"
                value={newSymbol}
                onChange={(e) => setNewSymbol(e.target.value.toUpperCase())}
                placeholder="Enter stock symbol (e.g., AAPL)"
                className="block w-full rounded-md border-0 px-2 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                disabled={isAddingSymbol}
              />
            </div>
            <button
              type="submit"
              disabled={isAddingSymbol || !newSymbol.trim()}
              className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
            >
              {isAddingSymbol ? (
                <>
                  <RefreshCw className="animate-spin -ml-1 mr-2 h-4 w-4" /> Adding...
                </>
              ) : (
                <>
                  <PlusCircle className="-ml-0.5 mr-2 h-5 w-5" /> Add Symbol
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Success/Error Messages for Add/Remove */}
      {successMessage && (
        <div className="rounded-md bg-green-50 p-4 border border-green-200">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 text-green-400 mr-3 flex-shrink-0" aria-hidden="true" />
            <p className="text-sm font-medium text-green-800">{successMessage}</p>
          </div>
        </div>
      )}
      {error && (
        <div className="rounded-md bg-red-50 p-4 border border-red-200">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-400 mr-3 flex-shrink-0" aria-hidden="true" />
            <p className="text-sm font-medium text-red-800">{error}</p>
          </div>
        </div>
      )}

      {/* Watchlist Table/List */}
      <div className="flow-root">
        <div className="flex justify-between items-center mb-3">
             <h3 className="text-lg font-medium leading-6 text-gray-900">My Watchlist</h3>
             <button
                onClick={() => loadWatchlist(true)}
                disabled={isLoading}
                className="inline-flex items-center rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} /> Refresh Prices
             </button>
        </div>
        {isLoading && watchlistItems.length === 0 ? ( // Initial loading state
          <div className="text-center py-10 text-gray-500">
             <RefreshCw className="animate-spin h-8 w-8 mx-auto text-indigo-600 mb-2" />
             Loading watchlist...
          </div>
        ) : !isLoading && watchlistItems.length === 0 ? (
          <div className="text-center py-10 px-4 border-2 border-dashed border-gray-300 rounded-lg">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">Watchlist Empty</h3>
            <p className="mt-1 text-sm text-gray-500">Add stock symbols above to start tracking.</p>
          </div>
        ) : (
          <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Symbol</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Current Price</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 hidden sm:table-cell">Added On</th>
                  <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6"><span className="sr-only">Remove</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {watchlistItems.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-semibold text-indigo-600 sm:pl-6">
                      {item.symbol}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-700">
                      {item.current_price !== null ? formatCurrency(item.current_price) : <span className="text-gray-400 italic">N/A</span>}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 hidden sm:table-cell">
                      {format(new Date(item.created_at), 'MMM dd, yyyy')}
                    </td>
                    <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                      <button
                        onClick={() => handleRemoveSymbol(item)}
                        disabled={removingSymbolId === item.id}
                        className="p-1 text-red-600 hover:text-red-800 disabled:opacity-50 rounded-md hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
                        title={`Remove ${item.symbol}`}
                      >
                        {removingSymbolId === item.id ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                            <Trash2 className="h-4 w-4" />
                        )}
                        <span className="sr-only">Remove {item.symbol}</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default WatchlistDisplay;