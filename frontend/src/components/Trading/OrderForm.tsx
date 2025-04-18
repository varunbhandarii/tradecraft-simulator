"use client";

import React, { useState, FormEvent } from 'react';
import { placeOrder, OrderRequest, OrderType, TradeType } from '@/services/tradingService';
import { formatCurrency } from '@/utils/formatting';
import { AlertCircle, CheckCircle } from 'lucide-react';

interface OrderFormProps {
  onOrderSuccess?: () => void; // Callback to refresh parent data
}

const OrderForm: React.FC<OrderFormProps> = ({ onOrderSuccess }) => {
  const [symbol, setSymbol] = useState('');
  const [quantity, setQuantity] = useState('');
  const [limitPrice, setLimitPrice] = useState('');
  const [orderTypeSelection, setOrderTypeSelection] = useState<'MARKET' | 'LIMIT'>('MARKET');
  const [actionType, setActionType] = useState<TradeType>('BUY');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const clearMessages = () => {
    setError(null);
    setSuccessMessage(null);
  };

  const resetForm = () => {
    setSymbol('');
    setQuantity('');
    setLimitPrice('');
    setOrderTypeSelection('MARKET');
    setActionType('BUY');
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    clearMessages();
    setIsLoading(true);

    const upperSymbol = symbol.trim().toUpperCase();
    const numQuantity = parseInt(quantity, 10);
    let numLimitPrice: number | null = null;

    // --- Client-side Validation ---
    if (!upperSymbol) { setError("Symbol is required."); setIsLoading(false); return; }
    if (isNaN(numQuantity) || numQuantity <= 0) { setError("Quantity must be a positive whole number."); setIsLoading(false); return; }

    if (orderTypeSelection === 'LIMIT') {
      numLimitPrice = parseFloat(limitPrice);
      if (isNaN(numLimitPrice) || numLimitPrice <= 0) {
        setError("Limit Price must be a positive number for Limit orders.");
        setIsLoading(false);
        return;
      }
    }
    // --- End Validation ---

    // Determine the final OrderType based on selections
    const finalOrderType = `${orderTypeSelection}_${actionType}` as OrderType;
    
    const orderData: OrderRequest = {
      symbol: upperSymbol,
      quantity: numQuantity,
      order_type: finalOrderType,
      limit_price: numLimitPrice, // Send null for Market, number for Limit
    };

    try {
      const result = await placeOrder(orderData);

      // Check if result has 'limit_price' to know if it was pending or executed
      if ('limit_price' in result && result.status === 'PENDING') {
         setSuccessMessage(
            `Limit ${result.order_type} order for ${result.quantity} ${result.symbol} @ ${formatCurrency(result.limit_price, 'USD', 4)} placed successfully.`
         );
      } else if ('price' in result) {
         setSuccessMessage(
           `Market ${result.trade_type} order for ${result.quantity} ${result.symbol} executed @ ${formatCurrency(result.price, 'USD', 4)}.`
         );
      } else {
         // Fallback success message
         setSuccessMessage(`Order for ${orderData.symbol} processed successfully.`);
      }

      resetForm();
      if (onOrderSuccess) {
        onOrderSuccess(); // Trigger parent data refresh
      }
      setTimeout(() => setSuccessMessage(null), 7000); // Clear message after 7s

    } catch (err: unknown) {
       let errorMessage = 'Failed to place order.';
        if (err instanceof Error) {
            errorMessage = err.message;
        }
       setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white overflow-hidden shadow rounded-lg border border-gray-200">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Place New Order</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Error/Success Messages */}
          {error && ( <div className="rounded-md bg-red-50 p-3 border border-red-200"><div className="flex items-center"><AlertCircle className="h-5 w-5 text-red-400 mr-2 flex-shrink-0" /><p className="text-sm font-medium text-red-800">{error}</p></div></div> )}
          {successMessage && ( <div className="rounded-md bg-green-50 p-3 border border-green-200"><div className="flex items-center"><CheckCircle className="h-5 w-5 text-green-400 mr-2 flex-shrink-0" /><p className="text-sm font-medium text-green-800">{successMessage}</p></div></div> )}

          {/* Symbol */}
          <div>
             <label htmlFor="symbol" className="block text-sm font-medium leading-6 text-gray-900">Symbol</label>
             <div className="mt-1">
                 <input type="text" id="symbol" value={symbol} onChange={(e) => { setSymbol(e.target.value.toUpperCase()); clearMessages(); }} placeholder="e.g., AAPL" required className="block w-full uppercase rounded-md border-0 py-1.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 transition duration-150 ease-in-out" />
             </div>
          </div>

          {/* Quantity */}
           <div>
             <label htmlFor="quantity" className="block text-sm font-medium leading-6 text-gray-900">Quantity</label>
             <div className="mt-1">
                <input type="number" id="quantity" value={quantity} onChange={(e) => { setQuantity(e.target.value); clearMessages(); }} min="1" step="1" placeholder="e.g., 10" required className="block w-full rounded-md border-0 py-1.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 transition duration-150 ease-in-out" />
             </div>
           </div>

          {/* Order Type Selection (Market/Limit) */}
          <fieldset className="mt-4">
             <legend className="block text-sm font-medium leading-6 text-gray-900">Order Type</legend>
             <div className="mt-2 flex items-center space-x-4">
                {['MARKET', 'LIMIT'].map((type) => (
                   <div key={type} className="flex items-center">
                      <input id={`orderType${type}`} name="orderTypeSelection" type="radio" value={type} checked={orderTypeSelection === type} onChange={() => { setOrderTypeSelection(type as 'MARKET' | 'LIMIT'); clearMessages(); if(type === 'MARKET') setLimitPrice(''); }} className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300" />
                      <label htmlFor={`orderType${type}`} className={`ml-2 block text-sm font-medium ${orderTypeSelection === type ? 'text-indigo-700' : 'text-gray-700'}`}>{type.charAt(0) + type.slice(1).toLowerCase()}</label>
                   </div>
                ))}
             </div>
          </fieldset>

          {/* Limit Price Input (Conditional) */}
          {orderTypeSelection === 'LIMIT' && (
             <div>
               <label htmlFor="limitPrice" className="block text-sm font-medium leading-6 text-gray-900">Limit Price</label>
               <div className="mt-1">
                 <input type="number" id="limitPrice" value={limitPrice} onChange={(e) => { setLimitPrice(e.target.value); clearMessages(); }} min="0.01" step="0.01" placeholder="Price per share" required={orderTypeSelection === 'LIMIT'} className="block w-full rounded-md border-0 py-1.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 transition duration-150 ease-in-out" />
               </div>
             </div>
          )}

          {/* Action Type Selection (Buy/Sell) */}
          <fieldset className="mt-4">
            <legend className="sr-only">Action Type</legend>
            <div className="flex items-center space-x-4">
                {['BUY', 'SELL'].map((type) => (
                <div key={type} className="flex items-center">
                    <input id={type.toLowerCase()} name="actionType" type="radio" value={type} checked={actionType === type} onChange={() => { setActionType(type as TradeType); clearMessages(); }} className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300" />
                    <label htmlFor={type.toLowerCase()} className={`ml-2 block text-sm font-medium ${actionType === type ? (type === 'BUY' ? 'text-green-700' : 'text-red-700') : 'text-gray-700'}`}>{type.charAt(0) + type.slice(1).toLowerCase()}</label>
                </div>
                ))}
            </div>
          </fieldset>

          {/* Submit Button */}
          <div className="pt-2">
            <button type="submit" disabled={isLoading} className="flex w-full justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition duration-150 ease-in-out">
               {isLoading ? (<> <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Placing Order... </>) : ( 'Place Order' )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OrderForm;