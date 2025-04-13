import React from 'react';
import { HoldingResponse } from '@/services/portfolioService';
import { formatCurrency } from '@/utils/formatting';

interface Props {
  holdings: HoldingResponse[] | undefined;
  isLoading: boolean;
}

const SkeletonRow: React.FC<{ cells: number }> = ({ cells }) => (
  <tr className="animate-pulse">
    {[...Array(cells)].map((_, i) => (
      <td key={i} className="whitespace-nowrap px-3 py-4 text-sm">
        <div className="h-4 bg-gray-200 rounded"></div>
      </td>
    ))}
  </tr>
);

const HoldingsTable: React.FC<Props> = ({ holdings, isLoading }) => {

  const tableHeaders = ["Symbol", "Quantity", "Avg. Cost Basis", "Current Price", "Market Value", "Unrealized P/L"];

  return (
    <div className="flow-root">
      <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
        <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
          <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
            <table className="min-w-full divide-y divide-gray-300">
              <thead className="bg-gray-50">
                <tr>
                  {tableHeaders.map((header, index) => (
                     <th
                       key={header}
                       scope="col"
                       className={`py-3.5 text-left text-sm font-semibold text-gray-900 ${index === 0 ? 'pl-4 pr-3 sm:pl-6' : 'px-3'} ${['Quantity', 'Avg. Cost Basis', 'Current Price', 'Market Value', 'Unrealized P/L'].includes(header) ? 'text-right' : ''}`}
                     >
                       {header}
                     </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {isLoading ? (
                  // Show skeleton rows while loading
                  [...Array(3)].map((_, i) => <SkeletonRow key={i} cells={tableHeaders.length} />)
                ) : !holdings || holdings.length === 0 ? (
                   // Show message if no holdings after loading
                   <tr>
                     <td colSpan={tableHeaders.length} className="px-3 py-4 text-center text-sm text-gray-500">
                       You have no holdings yet.
                     </td>
                   </tr>
                ) : (
                  // Render actual data rows
                  holdings.map((holding) => {
                    const pnl = holding.unrealized_pnl;
                    const pnlColor = pnl == null ? 'text-gray-500' : pnl > 0 ? 'text-green-600' : pnl < 0 ? 'text-red-600' : 'text-gray-500'; // Handle zero PNL
                    return (
                      <tr key={holding.symbol} className="hover:bg-gray-50 transition-colors duration-150 ease-in-out">
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">{holding.symbol}</td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 text-right">{holding.quantity}</td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 text-right">{formatCurrency(holding.average_cost_basis)}</td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 text-right">{formatCurrency(holding.current_price)}</td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 text-right">{formatCurrency(holding.current_value)}</td>
                        <td className={`whitespace-nowrap px-3 py-4 text-sm text-right ${pnlColor}`}>{formatCurrency(pnl)}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HoldingsTable;