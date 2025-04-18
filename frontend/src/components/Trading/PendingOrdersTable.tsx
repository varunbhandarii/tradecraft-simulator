import React, { useState } from 'react';
import { PendingOrderResponse } from '@/services/tradingService';
import { formatCurrency } from '@/utils/formatting';
import { format } from 'date-fns';
import { Trash2 } from 'lucide-react';

interface Props {
  pendingOrders: PendingOrderResponse[];
  isLoading: boolean;
  onCancelOrder: (orderId: number) => Promise<void>;
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


const PendingOrdersTable: React.FC<Props> = ({ pendingOrders, isLoading, onCancelOrder }) => {
  const [cancellingId, setCancellingId] = useState<number | null>(null);

  const handleCancelClick = async (orderId: number) => {
     if (cancellingId) return;
     setCancellingId(orderId);
     try {
       await onCancelOrder(orderId);
     } catch (error) {
       console.error("Cancellation failed in component:", error);
     } finally {
       setCancellingId(null);
     }
  }

  const tableHeaders = ["Placed At", "Symbol", "Type", "Quantity", "Limit Price", "Action"];

  return (
    <div className="flow-root">
      <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
        <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
          <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
            <table className="min-w-full divide-y divide-gray-300">
              <thead className="bg-gray-50">
                <tr>
                  {tableHeaders.map((header, index) => (
                     <th key={header} scope="col" className={`py-3.5 text-left text-sm font-semibold text-gray-900 ${index === 0 ? 'pl-4 pr-3 sm:pl-6' : 'px-3'} ${['Quantity', 'Limit Price'].includes(header) ? 'text-right' : ''} ${header === 'Action' ? 'relative py-3.5 pl-3 pr-4 sm:pr-6' : ''}`}>
                        {header === 'Action' ? <span className="sr-only">Action</span> : header}
                     </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {isLoading ? (
                  [...Array(2)].map((_, i) => <SkeletonRow key={i} cells={tableHeaders.length} />)
                ) : !pendingOrders || pendingOrders.length === 0 ? (
                  <tr><td colSpan={tableHeaders.length} className="px-3 py-10 text-center text-sm text-gray-500">No pending orders.</td></tr>
                ) : (
                  pendingOrders.map((order) => {
                     const isBuy = order.order_type === 'LIMIT_BUY';
                     const typeColor = isBuy ? 'text-green-600' : 'text-red-600';
                     const isCancelling = cancellingId === order.id;

                     return (
                       <tr key={order.id} className="hover:bg-gray-50 transition-colors duration-150 ease-in-out">
                         <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm text-gray-500 sm:pl-6">
                           {format(new Date(order.created_at), 'yyyy-MM-dd HH:mm')}
                         </td>
                         <td className={`whitespace-nowrap px-3 py-4 text-sm font-semibold ${typeColor}`}>
                           {order.order_type.replace('_', ' ')} {/* Display nicely */}
                         </td>
                         <td className="whitespace-nowrap px-3 py-4 text-sm font-medium text-gray-900">{order.symbol}</td>
                         <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 text-right">{order.quantity}</td>
                         <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 text-right">{formatCurrency(order.limit_price)}</td>
                         <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                           <button
                             onClick={() => handleCancelClick(order.id)}
                             disabled={isCancelling}
                             className="text-red-600 hover:text-red-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150 ease-in-out p-1 rounded hover:bg-red-100"
                             title="Cancel Order"
                           >
                             {isCancelling ? (
                                 <svg className="animate-spin h-4 w-4 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                             ) : (
                                 <Trash2 className="h-4 w-4" /> // Cancel icon
                             )}
                             <span className="sr-only">Cancel order {order.id}</span>
                           </button>
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

export default PendingOrdersTable;