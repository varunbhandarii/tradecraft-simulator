import apiClient from './apiClient';
import axios from 'axios';
import { TradeResponse } from './portfolioService';

export type OrderType = 'MARKET_BUY' | 'MARKET_SELL' | 'LIMIT_BUY' | 'LIMIT_SELL';

export type TradeType = 'BUY' | 'SELL';

export interface OrderRequest {
  symbol: string;
  quantity: number;
  order_type: OrderType;
  limit_price?: number | null;
}

export interface PendingOrderResponse {
    id: number;
    symbol: string;
    order_type: OrderType;
    quantity: number;
    limit_price: number;
    status: string;
    created_at: string;
    updated_at: string;
    user_id: number;
}

export const placeOrder = async (orderData: OrderRequest): Promise<TradeResponse | PendingOrderResponse> => {
  try {
    if (!orderData.limit_price && (orderData.order_type === 'LIMIT_BUY' || orderData.order_type === 'LIMIT_SELL')) {
        throw new Error("Limit price is required for Limit orders.");
    }
    if (orderData.limit_price && (orderData.order_type === 'MARKET_BUY' || orderData.order_type === 'MARKET_SELL')) {
        orderData.limit_price = null;
    }

    const response = await apiClient.post<TradeResponse | PendingOrderResponse>('/trading/orders', orderData);
    return response.data;
  } catch (error: unknown) {
    console.error("Failed to place order:", error);
    let errorMessage = 'Failed to place order.';
    if (axios.isAxiosError(error) && error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
    } else if (error instanceof Error) {
        errorMessage = error.message;
    }
    throw new Error(errorMessage);
  }
};

export const fetchPendingOrders = async (): Promise<PendingOrderResponse[]> => {
    try {
        const response = await apiClient.get<PendingOrderResponse[]>('/trading/orders/pending');
        return response.data;
    } catch (error: unknown) {
        console.error("Failed to fetch pending orders:", error);
        let errorMessage = 'Failed to fetch pending orders.';
        if (axios.isAxiosError(error) && error.response?.data?.detail) {
            errorMessage = error.response.data.detail;
        } else if (error instanceof Error) {
            errorMessage = error.message;
        }
        throw new Error(errorMessage);
    }
};

export const cancelPendingOrder = async (orderId: number): Promise<PendingOrderResponse> => {
    try {
        const response = await apiClient.delete<PendingOrderResponse>(`/trading/orders/pending/${orderId}`);
        return response.data;
    } catch (error: unknown) {
        console.error(`Failed to cancel order ${orderId}:`, error);
        let errorMessage = 'Failed to cancel order.';
         if (axios.isAxiosError(error) && error.response?.data?.detail) {
            errorMessage = error.response.data.detail;
        } else if (error instanceof Error) {
            errorMessage = error.message;
        }
        throw new Error(errorMessage);
    }
};