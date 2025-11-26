import { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useI18n } from '@/contexts/I18nContext';
import { useTheme } from '@/contexts/ThemeContext';
import type { Major, MajorCategory } from '@/types/database';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface MajorsCategoryBarChartProps {
  majors: Major[];
}

// Color palette for different categories
const CATEGORY_COLORS: Record<MajorCategory, { light: string; dark: string }> = {
  Engineering: { light: '#3b82f6', dark: '#60a5fa' },
  Medicine: { light: '#ef4444', dark: '#f87171' },
  Business: { light: '#10b981', dark: '#34d399' },
  Arts: { light: '#f59e0b', dark: '#fbbf24' },
  Science: { light: '#8b5cf6', dark: '#a78bfa' },
  IT: { light: '#06b6d4', dark: '#22d3ee' },
  Law: { light: '#ec4899', dark: '#f472b6' },
  Education: { light: '#14b8a6', dark: '#2dd4bf' },
  Other: { light: '#6b7280', dark: '#9ca3af' },
};

// Category translation keys
const CATEGORY_KEYS: Record<MajorCategory, string> = {
  Engineering: 'admin.dashboard.chart.category.engineering',
  Medicine: 'admin.dashboard.chart.category.medicine',
  Business: 'admin.dashboard.chart.category.business',
  Arts: 'admin.dashboard.chart.category.arts',
  Science: 'admin.dashboard.chart.category.science',
  IT: 'admin.dashboard.chart.category.it',
  Law: 'admin.dashboard.chart.category.law',
  Education: 'admin.dashboard.chart.category.education',
  Other: 'admin.dashboard.chart.category.other',
};

export function MajorsCategoryBarChart({ majors }: MajorsCategoryBarChartProps) {
  const { t, language } = useI18n();
  const { actualTheme } = useTheme();
  const isRTL = language === 'ar';

  // Calculate category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<MajorCategory, number> = {
      Engineering: 0,
      Medicine: 0,
      Business: 0,
      Arts: 0,
      Science: 0,
      IT: 0,
      Law: 0,
      Education: 0,
      Other: 0,
    };

    majors.forEach((major) => {
      if (major.category && counts.hasOwnProperty(major.category)) {
        counts[major.category]++;
      }
    });

    return Object.entries(counts)
      .filter(([_, count]) => count > 0)
      .map(([category, count]) => ({
        category: category as MajorCategory,
        count,
      }))
      .sort((a, b) => {
        // Ensure Business always comes before Medicine
        if (a.category === 'Business' && b.category === 'Medicine') {
          return -1;
        }
        if (a.category === 'Medicine' && b.category === 'Business') {
          return 1;
        }
        // Otherwise sort by count descending
        return b.count - a.count;
      });
  }, [majors]);

  // Prepare chart data
  const chartData = useMemo(() => {
    const labels = categoryCounts.map((item) => t(CATEGORY_KEYS[item.category]));
    const data = categoryCounts.map((item) => item.count);
    const colors = categoryCounts.map((item) => {
      const colorSet = CATEGORY_COLORS[item.category];
      return actualTheme === 'dark' ? colorSet.dark : colorSet.light;
    });

    return {
      labels,
      datasets: [
        {
          label: t('admin.majors.chart.numberOfMajors'),
          data,
          backgroundColor: colors,
          borderColor: colors,
          borderWidth: 2,
          borderRadius: 8,
          borderSkipped: false,
        },
      ],
    };
  }, [categoryCounts, t, actualTheme]);

  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: false,
      },
      tooltip: {
        backgroundColor: actualTheme === 'dark' ? 'rgba(31, 41, 55, 0.95)' : 'rgba(255, 255, 255, 0.95)',
        titleColor: actualTheme === 'dark' ? '#f3f4f6' : '#111827',
        bodyColor: actualTheme === 'dark' ? '#d1d5db' : '#374151',
        borderColor: actualTheme === 'dark' ? '#4b5563' : '#e5e7eb',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
        displayColors: true,
        rtl: isRTL,
        callbacks: {
          label: function(context: any) {
            return `${context.parsed.y} ${t('admin.majors.chart.majors')}`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
          color: actualTheme === 'dark' ? '#9ca3af' : '#6b7280',
          font: {
            size: 12,
          },
        },
        grid: {
          color: actualTheme === 'dark' ? 'rgba(75, 85, 99, 0.3)' : 'rgba(229, 231, 235, 0.8)',
        },
      },
      x: {
        ticks: {
          color: actualTheme === 'dark' ? '#9ca3af' : '#6b7280',
          font: {
            size: 12,
          },
        },
        grid: {
          display: false,
        },
      },
    },
    animation: {
      duration: 1000,
      easing: 'easeOutQuad' as const,
    },
  }), [actualTheme, isRTL, t]);

  if (categoryCounts.length === 0) {
    return null;
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-gray-900 dark:text-gray-100" dir={language}>
          {t('admin.majors.chart.title')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full" dir={isRTL ? 'rtl' : 'ltr'}>
          <Bar data={chartData} options={options} />
        </div>
      </CardContent>
    </Card>
  );
}

