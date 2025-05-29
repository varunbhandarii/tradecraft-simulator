"use client";

import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,   // For y-axis
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,     // For time-based x-axis
  Filler,        // For area fill under line
  type ChartOptions,
  type TooltipItem
} from 'chart.js';
import 'chartjs-adapter-date-fns';
import { format } from 'date-fns'; // For formatting dates in tooltips/axes
import { fetchPortfolioValueHistory, PortfolioSnapshotResponse } from '@/services/portfolioService';
import { formatCurrency } from '@/utils/formatting';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
  Filler
);

// Define the structure for Chart.js data prop
interface ChartDataState {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    borderColor: string;
    backgroundColor: string;
    tension?: number;
    fill?: boolean;
    pointRadius?: number;
    pointHoverRadius?: number;
  }[];
}

const PortfolioValueChart: React.FC = () => {
  const [historyData, setHistoryData] = useState<PortfolioSnapshotResponse[]>([]);
  const [chartData, setChartData] = useState<ChartDataState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadChartData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Type the fetched data
        const fetchedHistory: PortfolioSnapshotResponse[] = await fetchPortfolioValueHistory(365);

        if (!fetchedHistory || fetchedHistory.length === 0) {
          setError("No portfolio history data available to display.");
          setChartData(null);
          setHistoryData([]);
          return;
        }
        
        setHistoryData(fetchedHistory);

        fetchedHistory.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

        setChartData({
          labels: fetchedHistory.map(item => format(new Date(item.timestamp), 'MMM dd, yyyy')),
          datasets: [
            {
              label: 'Portfolio Value',
              data: fetchedHistory.map(item => item.total_value),
              borderColor: 'rgb(79, 70, 229)',
              backgroundColor: 'rgba(79, 70, 229, 0.1)',
              tension: 0.1,
              fill: true,
              pointRadius: 2,
              pointHoverRadius: 5,
            },
          ],
        });
      } catch (err: unknown) {
        let errorMessage = "Failed to load chart data.";
        if (err instanceof Error) { errorMessage = err.message; }
        setError(errorMessage);
        console.error("Error in loadChartData:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadChartData();
  }, []);

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
            color: '#4B5563',
            font: {
                size: 12,
            }
        }
      },
      title: {
        display: false,
        text: 'Portfolio Value Over Time',
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        callbacks: {
          label: function (context: TooltipItem<'line'>) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += formatCurrency(context.parsed.y);
            }
            return label;
          },
          title: function(tooltipItems: TooltipItem<'line'>[]) {
            // tooltipItems is an array, use the first item for the date
            if (tooltipItems.length > 0) {
                const item = tooltipItems[0];
                const date = item.label;
                return date;
            }
            return '';
          }
        },
      },
    },
    scales: {
      x: {
        type: 'category' as const,
        title: {
          display: true,
          text: 'Date',
          color: '#4B5563',
        },
        ticks: {
            color: '#6B7280',
            maxRotation: 45,
            minRotation: 0,
            autoSkip: true,
            maxTicksLimit: 10,
        }
      },
      y: {
        beginAtZero: false,
        title: {
          display: true,
          text: 'Portfolio Value',
          color: '#4B5563',
        },
        ticks: {
          color: '#6B7280',
          callback: function (value: string | number) {
            if (typeof value === 'number') {
                return formatCurrency(value, 'USD', 0);
            }
            return value;
          },
        },
      },
    },
    interaction: {
        mode: 'nearest' as const,
        axis: 'x' as const,
        intersect: false
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white shadow rounded-lg p-4 sm:p-6 border border-gray-200">
        <h3 className="text-lg font-medium leading-6 text-gray-900 mb-3">Portfolio Performance</h3>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div> {/* Title placeholder */}
          <div className="h-72 bg-gray-200 rounded"></div> {/* Chart area placeholder */}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white shadow rounded-lg p-4 sm:p-6 border border-gray-200">
        <h3 className="text-lg font-medium leading-6 text-gray-900 mb-3">Portfolio Performance</h3>
        <div className="text-red-600">Error loading chart: {error}</div>
      </div>
    );
  }

  if (!chartData || chartData.datasets[0].data.length < 2) {
    return (
      <div className="bg-white shadow rounded-lg p-4 sm:p-6 border border-gray-200">
        <h3 className="text-lg font-medium leading-6 text-gray-900 mb-3">Portfolio Performance</h3>
        <p className="text-gray-500">Not enough data to display performance chart. Make some trades to see history.</p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg p-4 sm:p-6 border border-gray-200">
      <h3 className="text-lg font-medium leading-6 text-gray-900 mb-3">
        Portfolio Performance Over Time
      </h3>
      <div className="h-72 md:h-96">
        <Line options={options} data={chartData} />
      </div>
    </div>
  );
};

export default PortfolioValueChart;