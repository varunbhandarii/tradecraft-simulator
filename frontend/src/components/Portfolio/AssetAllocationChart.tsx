"use client";

import React, { useEffect, useState } from 'react';
import { Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  Title,
  type ChartOptions,
  type TooltipItem
} from 'chart.js';
import { HoldingResponse } from '@/services/portfolioService';
import { formatCurrency } from '@/utils/formatting';

ChartJS.register(ArcElement, Tooltip, Legend, Title);

interface AssetAllocationChartProps {
  holdings: HoldingResponse[] | undefined;
  isLoading: boolean;
}

interface PieChartDataState {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor: string[];
    borderColor?: string[];
    borderWidth?: number;
  }[];
}

// Predefined set of colors for chart slices
const CHART_COLORS = [
  'rgba(75, 192, 192, 0.8)',  // Teal
  'rgba(255, 99, 132, 0.8)',  // Red
  'rgba(54, 162, 235, 0.8)',  // Blue
  'rgba(255, 206, 86, 0.8)',  // Yellow
  'rgba(153, 102, 255, 0.8)', // Purple
  'rgba(255, 159, 64, 0.8)',  // Orange
  'rgba(99, 255, 132, 0.8)',  // Green
  'rgba(230, 230, 250, 0.8)', // Lavender
  'rgba(255, 105, 180, 0.8)', // Hot Pink
  'rgba(64, 224, 208, 0.8)',  // Turquoise
];

const AssetAllocationChart: React.FC<AssetAllocationChartProps> = ({ holdings, isLoading }) => {
  const [chartData, setChartData] = useState<PieChartDataState | null>(null);

  useEffect(() => {
    if (holdings && holdings.length > 0) {
      // Filter out holdings with no or negligible current value
      const validHoldings = holdings.filter(h => h.current_value && h.current_value > 0.001);

      if (validHoldings.length === 0) {
        setChartData(null); // No valid holdings to chart
        return;
      }

      setChartData({
        labels: validHoldings.map(holding => holding.symbol),
        datasets: [
          {
            label: 'Asset Allocation by Value',
            data: validHoldings.map(holding => Number(holding.current_value)),
            backgroundColor: validHoldings.map((_, index) => CHART_COLORS[index % CHART_COLORS.length]),
            borderColor: validHoldings.map((_, index) => CHART_COLORS[index % CHART_COLORS.length].replace('0.8', '1')),
            borderWidth: 1,
          },
        ],
      });
    } else {
      setChartData(null);
    }
  }, [holdings]);

  const options: ChartOptions<'pie'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          color: '#4B5563',
          font: { size: 12 },
          boxWidth: 20,
          padding: 20,
        }
      },
      title: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function (context: TooltipItem<'pie'>) {
            let label = context.label || '';
            if (label) {
              label += ': ';
            }
            const value = context.raw as number;
            if (value !== null) {
              label += formatCurrency(value);
            }

            const datasetData = context.chart.data.datasets[0].data;
            // Calculate percentage
            const total = datasetData.reduce((sum: number, currentValue: any) => {
              const numValue = (typeof currentValue === 'number' && !isNaN(currentValue)) ? currentValue : 0;
              return sum + numValue;
            }, 0);
            const percentage = total > 0 ? ((value / total) * 100).toFixed(2) : 0;
            label += ` (${percentage}%)`;
            return label;
          },
        },
      },
    },
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="animate-pulse flex justify-center items-center h-64 md:h-80">
          <div className="h-48 w-48 md:h-64 md:w-64 bg-gray-200 rounded-full"></div>
        </div>
      );
    }

    if (!chartData || chartData.datasets[0].data.length === 0) {
      return <p className="text-gray-500 text-center py-10">No holdings with value to display allocation.</p>;
    }

    return (
      <div className="h-64 md:h-80 relative">
        <Pie data={chartData} options={options} />
      </div>
    );
  };


  return (
    <div className="bg-white shadow rounded-lg p-4 sm:p-6 border border-gray-200">
      <h3 className="text-lg font-medium leading-6 text-gray-900 mb-3">
        Asset Allocation
      </h3>
      {renderContent()}
    </div>
  );
};

export default AssetAllocationChart;