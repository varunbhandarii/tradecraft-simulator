import apiClient from './apiClient';
import { TradeResponse } from './portfolioService';
import axios from 'axios';

export type TradeType = 'BUY' | 'SELL';

export interface OrderRequest {
  symbol: string;
  quantity: number;
  trade_type: TradeType;
}

export const placeOrder = async (orderData: OrderRequest): Promise<TradeResponse> => {
  try {
    const response = await apiClient.post<TradeResponse>('/trading/orders', orderData);
    return response.data;
  } catch (error: unknown) {
    console.error("Failed to fetch", error);
    let errorMessage = 'Failed to load portfolio data.';
     if (axios.isAxiosError(error) && error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
    } else if (error instanceof Error) {
        errorMessage = error.message;
    }
    throw new Error(errorMessage);
  }
};