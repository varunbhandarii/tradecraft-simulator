import apiClient from './apiClient';
import axios from 'axios';

// Interface matching backend's WatchlistItemBase
export interface WatchlistItemBaseResponse {
  id: number;
  symbol: string;
  user_id: number;
  created_at: string; 
}

// Interface matching backend's WatchlistItemResponse
export interface WatchlistItemWithPriceResponse {
  id: number;
  symbol: string;
  current_price: number | null;
  created_at: string; 
}

// --- Function to fetch the user's watchlist ---
export const fetchWatchlist = async (): Promise<WatchlistItemWithPriceResponse[]> => {
  try {
    const response = await apiClient.get<WatchlistItemWithPriceResponse[]>('/watchlist');
    return response.data;
  } catch (error: unknown) {
    console.error("Error fetching watchlist:", error);
    let errorMessage = 'Failed to fetch watchlist.';
    if (axios.isAxiosError(error) && error.response?.data?.detail) {
      errorMessage = error.response.data.detail;
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }
    throw new Error(errorMessage);
  }
};

// --- Function to add a symbol to the watchlist ---
export interface AddSymbolRequest {
    symbol: string;
}

export const addSymbolToWatchlist = async (symbolData: AddSymbolRequest): Promise<WatchlistItemBaseResponse> => {
  try {
    const response = await apiClient.post<WatchlistItemBaseResponse>('/watchlist', symbolData);
    return response.data;
  } catch (error: unknown) {
    console.error("Error adding symbol to watchlist:", error);
    let errorMessage = 'Failed to add symbol to watchlist.';
    if (axios.isAxiosError(error) && error.response?.data?.detail) {
      errorMessage = error.response.data.detail;
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }
    throw new Error(errorMessage);
  }
};

// --- Function to remove a symbol from the watchlist ---
export const removeSymbolFromWatchlist = async (symbol: string): Promise<void> => {
  try {
    await apiClient.delete(`/watchlist/${symbol.toUpperCase()}`);
  } catch (error: unknown) {
    console.error(`Error removing symbol ${symbol} from watchlist:`, error);
    let errorMessage = `Failed to remove symbol ${symbol} from watchlist.`;
    if (axios.isAxiosError(error) && error.response?.data?.detail) {
      errorMessage = error.response.data.detail;
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }
    throw new Error(errorMessage);
  }
};