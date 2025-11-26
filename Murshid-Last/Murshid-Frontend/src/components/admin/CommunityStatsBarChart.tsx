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

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface CommunityStatsBarChartProps {
  posts: number;
  answers: number;
  comments: number;
  pendingReports: number;
}

// Color palette for different community stats
const STAT_COLORS = {
  posts: { light: '#3b82f6', dark: '#60a5fa' },
  answers: { light: '#10b981', dark: '#34d399' },
  comments: { light: '#f59e0b', dark: '#fbbf24' },
  pendingReports: { light: '#ef4444', dark: '#f87171' },
};

export function CommunityStatsBarChart({
  posts,
  answers,
  comments,
  pendingReports,
}: CommunityStatsBarChartProps) {
  const { t, language } = useI18n();
  const { actualTheme } = useTheme();
  const isRTL = language === 'ar';

  // Prepare chart data
  const chartData = useMemo(() => {
    const labels = [
      t('admin.dashboard.chart.community.posts'),
      t('admin.dashboard.chart.community.answers'),
      t('admin.dashboard.chart.community.comments'),
      t('admin.dashboard.chart.community.pendingReports'),
    ];
    
    const data = [posts, answers, comments, pendingReports];
    
    const colors = [
      actualTheme === 'dark' ? STAT_COLORS.posts.dark : STAT_COLORS.posts.light,
      actualTheme === 'dark' ? STAT_COLORS.answers.dark : STAT_COLORS.answers.light,
      actualTheme === 'dark' ? STAT_COLORS.comments.dark : STAT_COLORS.comments.light,
      actualTheme === 'dark' ? STAT_COLORS.pendingReports.dark : STAT_COLORS.pendingReports.light,
    ];

    return {
      labels,
      datasets: [
        {
          label: t('admin.community.chart.numberOfItems'),
          data,
          backgroundColor: colors,
          borderColor: colors,
          borderWidth: 2,
          borderRadius: 8,
          borderSkipped: false,
        },
      ],
    };
  }, [posts, answers, comments, pendingReports, t, actualTheme]);

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
            return `${context.parsed.y} ${t('admin.community.chart.items')}`;
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

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-gray-900 dark:text-gray-100" dir={language}>
          {t('admin.community.chart.title')}
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

