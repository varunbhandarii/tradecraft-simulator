import React from 'react';
import { VaRResponse } from '@/services/portfolioService';
import { formatCurrency } from '@/utils/formatting';
import { AlertTriangle } from 'lucide-react';

interface Props {
  data: VaRResponse | null;
  isLoading: boolean;
}

// Skeleton Loader for this card's content
const RiskInfoSkeleton: React.FC = () => (
   <div className="animate-pulse space-y-2">
       <div className="h-4 bg-gray-200 rounded w-3/4"></div>
       <div className="h-8 bg-gray-300 rounded w-1/2"></div>
       <div className="h-3 bg-gray-200 rounded w-full"></div>
       <div className="h-3 bg-gray-200 rounded w-5/6"></div>
   </div>
);


const RiskInfo: React.FC<Props> = ({ data, isLoading }) => {
  const renderContent = () => {
    if (isLoading) {
      return <RiskInfoSkeleton />;
    }
    // Handle specific case where calculation was attempted but failed (e.g., no holdings)
    if (!data || data.var_amount === undefined || data.var_amount === null) {
         return <p className="text-sm text-gray-500">{data?.message || 'VaR data not available.'}</p>;
    }
    return (
      <div>
        <p className="text-sm font-medium text-gray-500">
          Est. Max Loss (1 Day, {(data.confidence_level * 100).toFixed(0)}% Confidence)
        </p>
        <p className="mt-1 text-3xl font-semibold tracking-tight text-red-600">
          {formatCurrency(data.var_amount)}
        </p>
        <p className="text-xs text-gray-500 mt-2">
          Based on {data.lookback_days} days history.
          (Holdings value considered: {formatCurrency(data.portfolio_value)})
        </p>
         {data.message && !data.message.toLowerCase().includes("calculated based on") && ( // Show non-standard messages potentially indicating issues
             <p className="mt-2 text-xs text-orange-600 flex items-center">
                 <AlertTriangle className="h-3 w-3 mr-1 inline-block" />
                 {data.message}
             </p>
         )}
      </div>
    );
  };

  return (
    <div className="bg-white overflow-hidden shadow rounded-lg border border-gray-200">
       <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900 mb-3">
             Value at Risk (VaR)
          </h3>
          {renderContent()}
       </div>
    </div>
  );
};

export default RiskInfo;