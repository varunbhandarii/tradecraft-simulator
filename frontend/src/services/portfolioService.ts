import apiClient from './apiClient';
import axios from 'axios';

export interface HoldingResponse {
  symbol: string;
  quantity: number;
  average_cost_basis: number;
  current_price: number | null;
  current_value: number | null;
  unrealized_pnl: number | null;
}

export interface PortfolioResponse {
  cash_balance: number;
  total_portfolio_value: number;
  total_holdings_value: number;
  total_unrealized_pnl: number;
  holdings: HoldingResponse[];
}

export interface VaRResponse {
  var_amount: number;
  confidence_level: number;
  lookback_days: number;
  portfolio_value: number;
  message: string;
}

export interface TradeResponse {
  id: number;
  symbol: string;
  quantity: number;
  price: number;
  trade_type: 'BUY' | 'SELL';
  timestamp: string;
  user_id: number;
}

export interface PortfolioSnapshotResponse {
  timestamp: string;
  total_value: number;
}

export const fetchPortfolio = async (): Promise<PortfolioResponse> => {
  try {
    const response = await apiClient.get<PortfolioResponse>('/portfolio');
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

export const fetchVaR = async (
  confidenceLevel: number = 0.95,
  lookbackDays: number = 126
): Promise<VaRResponse> => {
  try {
    const response = await apiClient.get<VaRResponse>('/portfolio/risk/var', {
      params: {
        confidence_level: confidenceLevel,
        lookback_days: lookbackDays,
      },
    });
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

export const fetchTradeHistory = async (
  skip: number = 0,
  limit: number = 100 // Default pagination values
): Promise<TradeResponse[]> => {
  try {
    const response = await apiClient.get<TradeResponse[]>('/portfolio/trades', {
      params: {
        skip: skip,
        limit: limit,
      },
    });
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

export const fetchPortfolioValueHistory = async (
  limit: number = 365 // Default to fetching up to a year of daily snapshots
): Promise<PortfolioSnapshotResponse[]> => {
  try {
    const response = await apiClient.get<PortfolioSnapshotResponse[]>('/portfolio/value-history', {
      params: {
        limit: limit,
      },
    });
    return response.data;
  } catch (error: unknown) {
    console.error("Failed to fetch portfolio value history:", error);
    let errorMessage = 'Failed to load portfolio value history.';
    if (axios.isAxiosError(error) && error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
    } else if (error instanceof Error) {
        errorMessage = error.message;
    }
    throw new Error(errorMessage);
  }
};