export function formatCurrency(
    amount: number | null | undefined,
    currency = 'USD',
    maximumFractionDigits = 2
  ): string {
    if (amount === null || amount === undefined || isNaN(amount)) {
      return 'N/A';
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      maximumFractionDigits: maximumFractionDigits,
    }).format(amount);
  }
  
  export function formatPercentage(
      value: number | null | undefined
  ): string {
      if (value === null || value === undefined || isNaN(value)) {
          return 'N/A';
      }
       return `${(value * 100).toFixed(2)}%`; // Example: 0.1 -> 10.00%
  }