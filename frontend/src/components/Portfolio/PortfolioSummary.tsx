import React from 'react';
import { PortfolioResponse } from '@/services/portfolioService';
import { formatCurrency } from '@/utils/formatting';

interface Props {
  data: PortfolioResponse | null;
  isLoading: boolean;
}

const StatCard: React.FC<{ title: string; value: string | React.ReactNode; isLoading: boolean; valueClassName?: string }> =
 ({ title, value, isLoading, valueClassName = 'text-gray-900' }) => (
  <div className="bg-white overflow-hidden shadow rounded-lg border border-gray-200">
    <div className="px-4 py-5 sm:p-6">
       <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
       {isLoading ? (
         <dd className="mt-1 h-8 bg-gray-200 rounded animate-pulse"></dd>
       ) : (
         <dd className={`mt-1 text-3xl font-semibold tracking-tight ${valueClassName}`}>{value}</dd>
       )}
    </div>
  </div>
);


const PortfolioSummary: React.FC<Props> = ({ data, isLoading }) => {
  const pnlValue = data?.total_unrealized_pnl;
  // Define PNL color based on value, handle null/undefined/zero
  const pnlColor = pnlValue == null || pnlValue === 0 ? 'text-gray-900' : pnlValue > 0 ? 'text-green-600' : 'text-red-600';

  return (
    <div>
       <h2 className="text-xl font-semibold text-gray-800 mb-4">Summary</h2>
       <dl className="grid grid-cols-1 gap-5 sm:grid-cols-2"> {/* Adjusted grid cols */}
            <StatCard title="Cash Balance" value={formatCurrency(data?.cash_balance)} isLoading={isLoading} />
            <StatCard title="Total Holdings Value" value={formatCurrency(data?.total_holdings_value)} isLoading={isLoading} />
            <StatCard title="Total Portfolio Value" value={formatCurrency(data?.total_portfolio_value)} isLoading={isLoading} />
            <StatCard title="Total Unrealized P/L" isLoading={isLoading} value={formatCurrency(pnlValue)} valueClassName={pnlColor} />
       </dl>
    </div>
  );
};

export default PortfolioSummary;