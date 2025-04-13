"use client";

import React, { useState, FormEvent } from "react";
import { placeOrder, OrderRequest, TradeType } from "@/services/tradingService";
import axios from "axios";
import { AlertCircle, CheckCircle } from "lucide-react";
import { formatCurrency } from "@/utils/formatting";

interface OrderFormProps {
  onOrderSuccess?: () => void;
}

const OrderForm: React.FC<OrderFormProps> = ({ onOrderSuccess }) => {
  const [symbol, setSymbol] = useState("");
  const [quantity, setQuantity] = useState("");
  const [tradeType, setTradeType] = useState<TradeType>("BUY");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const clearMessages = () => {
    setError(null);
    setSuccessMessage(null);
  };

  const resetForm = () => {
    setSymbol("");
    setQuantity("");
    setTradeType("BUY");
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    clearMessages();
    setIsLoading(true);

    const upperSymbol = symbol.trim().toUpperCase();
    const numQuantity = parseInt(quantity, 10);

    if (!upperSymbol) {
      setError("Symbol cannot be empty.");
      setIsLoading(false);
      return;
    }
    if (isNaN(numQuantity) || numQuantity <= 0) {
      setError("Quantity must be a positive whole number.");
      setIsLoading(false);
      return;
    }

    const orderData: OrderRequest = {
      symbol: upperSymbol,
      quantity: numQuantity,
      trade_type: tradeType,
    };

    try {
      const tradeResult = await placeOrder(orderData);
      setSuccessMessage(
        `Success! ${tradeType} ${tradeResult.quantity} ${
          tradeResult.symbol
        } @ ${formatCurrency(tradeResult.price, "USD", 4)}`
      );
      resetForm();
      if (onOrderSuccess) {
        onOrderSuccess();
      }
      // Clear success message after a delay
      setTimeout(() => setSuccessMessage(null), 5000);
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

  return (
    <div className="bg-white overflow-hidden shadow rounded-lg border border-gray-200">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
          Place New Order
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Error Message */}
          {error && (
            <div className="rounded-md bg-red-50 p-3 border border-red-200">
              <div className="flex items-center">
                <AlertCircle
                  className="h-5 w-5 text-red-400 mr-2 flex-shrink-0"
                  aria-hidden="true"
                />
                <p className="text-sm font-medium text-red-800">{error}</p>
              </div>
            </div>
          )}
          {/* Success Message */}
          {successMessage && (
            <div className="rounded-md bg-green-50 p-3 border border-green-200">
              <div className="flex items-center">
                <CheckCircle
                  className="h-5 w-5 text-green-400 mr-2 flex-shrink-0"
                  aria-hidden="true"
                />
                <p className="text-sm font-medium text-green-800">
                  {successMessage}
                </p>
              </div>
            </div>
          )}

          {/* Symbol Input */}
          <div>
            <label
              htmlFor="symbol"
              className="block text-sm font-medium leading-6 text-gray-900"
            >
              Stock Symbol
            </label>
            <div className="mt-1">
              <input
                type="text"
                id="symbol"
                value={symbol}
                onChange={(e) => {
                  setSymbol(e.target.value.toUpperCase());
                  clearMessages();
                }}
                placeholder="e.g., AAPL"
                required
                className="block w-full rounded-md border-0 py-1.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 transition duration-150 ease-in-out"
              />
            </div>
          </div>

          {/* Quantity Input */}
          <div>
            <label
              htmlFor="quantity"
              className="block text-sm font-medium leading-6 text-gray-900"
            >
              Quantity
            </label>
            <div className="mt-1">
              <input
                type="number"
                id="quantity"
                value={quantity}
                onChange={(e) => {
                  setQuantity(e.target.value);
                  clearMessages();
                }}
                min="1"
                step="1"
                placeholder="e.g., 10"
                required
                className="block w-full rounded-md border-0 py-1.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 transition duration-150 ease-in-out"
              />
            </div>
          </div>

          {/* Trade Type Selection */}
          <fieldset className="mt-4">
            <legend className="sr-only">Trade Type</legend>{" "}
            <div className="flex items-center space-x-4">
              {["BUY", "SELL"].map((type) => (
                <div key={type} className="flex items-center">
                  <input
                    id={type.toLowerCase()}
                    name="tradeType"
                    type="radio"
                    value={type}
                    checked={tradeType === type}
                    onChange={() => {
                      setTradeType(type as TradeType);
                      clearMessages();
                    }}
                    className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300"
                  />
                  <label
                    htmlFor={type.toLowerCase()}
                    className={`ml-2 block text-sm font-medium ${
                      tradeType === type ? "text-indigo-700" : "text-gray-700"
                    }`}
                  >
                    {type.charAt(0) + type.slice(1).toLowerCase()}{" "}
                    {/* Capitalize */}
                  </label>
                </div>
              ))}
            </div>
          </fieldset>

          {/* Submit Button */}
          <div className="pt-2">
            {" "}
            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition duration-150 ease-in-out"
            >
              {isLoading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Placing Order...
                </>
              ) : (
                "Place Order"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OrderForm;
