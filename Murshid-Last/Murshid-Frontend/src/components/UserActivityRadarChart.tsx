import { useMemo, useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';
import { Radar } from 'react-chartjs-2';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useI18n } from '@/contexts/I18nContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import {
  getCommunityPostsByAuthor,
  getCommunityAnswersByAuthor,
  getUserLikedPosts,
  getUserLikedAnswers,
} from '@/lib/communityApi';
import { getUserBookmarks } from '@/lib/bookmarksApi';
import { Loader2 } from 'lucide-react';

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

interface UserActivityRadarChartProps {
  userId: string;
}

export function UserActivityRadarChart({ userId }: UserActivityRadarChartProps) {
  const { t, language } = useI18n();
  const { actualTheme } = useTheme();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    posts: 0,
    answers: 0,
    likes: 0,
    bookmarks: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const [posts, answers, likedPosts, likedAnswers, bookmarks] = await Promise.all([
          getCommunityPostsByAuthor(userId),
          getCommunityAnswersByAuthor(userId),
          getUserLikedPosts(userId),
          getUserLikedAnswers(userId),
          getUserBookmarks(userId),
        ]);

        // Count non-deleted posts and answers
        const postsCount = posts.filter((p) => !p.is_deleted).length;
        const answersCount = answers.filter((a) => !a.is_deleted).length;
        const likesCount = likedPosts.length + likedAnswers.length;
        const bookmarksCount = bookmarks.length;

        setStats({
          posts: postsCount,
          answers: answersCount,
          likes: likesCount,
          bookmarks: bookmarksCount,
        });
      } catch (error) {
        console.error('Error fetching user stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [userId]);

  const chartData = useMemo(() => {
    const labels = [
      t('profile.chart.posts'),
      t('profile.chart.answers'),
      t('profile.chart.likes'),
      t('profile.chart.bookmarks'),
    ];

    const data = [stats.posts, stats.answers, stats.likes, stats.bookmarks];

    // Find max value to normalize the scale
    const maxValue = Math.max(...data, 1); // At least 1 to avoid division by zero

    // Normalize data to 0-100 scale for better visualization
    const normalizedData = data.map((value) => (value / maxValue) * 100);

    const backgroundColor = actualTheme === 'dark'
      ? 'rgba(139, 92, 246, 0.3)'
      : 'rgba(139, 92, 246, 0.15)';
    const borderColor = actualTheme === 'dark' ? '#60a5fa' : '#3b82f6';
    const pointBackgroundColor = actualTheme === 'dark' ? '#60a5fa' : '#3b82f6';
    const pointBorderColor = actualTheme === 'dark' ? '#ffffff' : '#ffffff';

    return {
      labels,
      datasets: [
        {
          label: t('profile.chart.activity'),
          data: normalizedData,
          backgroundColor,
          borderColor,
          borderWidth: 2,
          pointBackgroundColor,
          pointBorderColor,
          pointBorderWidth: 2,
          pointRadius: 5,
          pointHoverRadius: 7,
        },
      ],
    };
  }, [stats, t, actualTheme]);

  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      r: {
        beginAtZero: true,
        max: 100,
        ticks: {
          stepSize: 20,
          color: actualTheme === 'dark' ? '#9ca3af' : '#6b7280',
          font: {
            size: 11,
          },
          backdropColor: 'transparent',
        },
        grid: {
          color: actualTheme === 'dark' ? 'rgba(75, 85, 99, 0.3)' : 'rgba(229, 231, 235, 0.8)',
        },
        pointLabels: {
          color: actualTheme === 'dark' ? '#d1d5db' : '#374151',
          font: {
            size: 12,
            weight: '500' as const,
          },
        },
      },
    },
    plugins: {
      legend: {
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
        callbacks: {
          label: function(context: any) {
            const label = context.label || '';
            const index = context.dataIndex;
            const actualValues = [stats.posts, stats.answers, stats.likes, stats.bookmarks];
            return `${label}: ${actualValues[index]}`;
          },
        },
      },
    },
  }), [stats, actualTheme, t]);

  if (loading) {
    return (
      <Card className="mb-6 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-gray-900 dark:text-gray-100" dir={language}>
            {t('profile.chart.title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-6 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-gray-900 dark:text-gray-100" dir={language}>
          {t('profile.chart.title')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full" dir={language === 'ar' ? 'rtl' : 'ltr'}>
          <Radar data={chartData} options={options} />
        </div>
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.posts}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">{t('profile.chart.posts')}</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.answers}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">{t('profile.chart.answers')}</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.likes}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">{t('profile.chart.likes')}</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.bookmarks}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">{t('profile.chart.bookmarks')}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

