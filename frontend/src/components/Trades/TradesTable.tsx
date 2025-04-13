import React from 'react';
import { TradeResponse } from '@/services/portfolioService';
import { formatCurrency } from '@/utils/formatting';
import { format } from 'date-fns';

interface Props {
  trades: TradeResponse[];
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

const TradesTable: React.FC<Props> = ({ trades, isLoading }) => {

   const tableHeaders = ["Timestamp", "Type", "Symbol", "Quantity", "Price (@)", "Total Value"];

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
                                className={`py-3.5 text-left text-sm font-semibold text-gray-900 ${index === 0 ? 'pl-4 pr-3 sm:pl-6' : 'px-3'} ${['Quantity', 'Price (@)', 'Total Value'].includes(header) ? 'text-right' : ''}`}
                            >
                                {header}
                            </th>
                         ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                        {isLoading ? (
                         // Show skeleton rows while loading
                         [...Array(5)].map((_, i) => <SkeletonRow key={i} cells={tableHeaders.length} />)
                        ) : !trades || trades.length === 0 ? (
                         // Show message if no trades after loading
                         <tr>
                            <td colSpan={tableHeaders.length} className="px-3 py-10 text-center text-sm text-gray-500">
                                No trades found in your history.
                            </td>
                         </tr>
                        ) : (
                         // Render actual data rows
                         trades.map((trade) => {
                            const isBuy = trade.trade_type === 'BUY';
                            const totalValue = trade.price * trade.quantity;
                            const typeColor = isBuy ? 'text-green-600' : 'text-red-600';

                            return (
                                <tr key={trade.id} className="hover:bg-gray-50 transition-colors duration-150 ease-in-out">
                                <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm text-gray-500 sm:pl-6">
                                    {format(new Date(trade.timestamp), 'yyyy-MM-dd HH:mm:ss')}
                                </td>
                                <td className={`whitespace-nowrap px-3 py-4 text-sm font-semibold ${typeColor}`}>
                                    {trade.trade_type}
                                </td>
                                <td className="whitespace-nowrap px-3 py-4 text-sm font-medium text-gray-900">{trade.symbol}</td>
                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 text-right">
                                    {trade.quantity}
                                </td>
                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 text-right">
                                    {formatCurrency(trade.price)}
                                </td>
                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 text-right">
                                    {formatCurrency(totalValue)}
                                </td>
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

export default TradesTable;