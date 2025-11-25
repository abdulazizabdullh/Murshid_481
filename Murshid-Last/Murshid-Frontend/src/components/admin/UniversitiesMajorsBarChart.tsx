import { useMemo, useEffect, useState } from 'react';
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
import { supabase } from '@/lib/supabase';
import type { University } from '@/types/database';
import { Loader2 } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface UniversitiesMajorsBarChartProps {
  universities: University[];
}

export function UniversitiesMajorsBarChart({ universities }: UniversitiesMajorsBarChartProps) {
  const { t, language } = useI18n();
  const { actualTheme } = useTheme();
  const isRTL = language === 'ar';
  const [loading, setLoading] = useState(true);
  const [universityMajorsCount, setUniversityMajorsCount] = useState<Array<{ name: string; count: number }>>([]);

  useEffect(() => {
    const fetchMajorsCount = async () => {
      if (universities.length === 0) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        // Get counts for all universities at once
        const { data, error } = await supabase
          .from('university_majors')
          .select('university_id')
          .in('university_id', universities.map(u => u.id));

        if (error) throw error;

        // Count majors per university
        const counts: Record<string, number> = {};
        universities.forEach(uni => {
          counts[uni.id] = 0;
        });

        if (data) {
          data.forEach(item => {
            if (counts[item.university_id] !== undefined) {
              counts[item.university_id]++;
            }
          });
        }

        // Map to university names with counts, sorted by count descending
        const universityData = universities
          .map(uni => ({
            name: language === 'ar' && uni.name_ar ? uni.name_ar : uni.name,
            count: counts[uni.id] || 0,
          }))
          .filter(item => item.count > 0) // Only show universities with majors
          .sort((a, b) => b.count - a.count); // Sort by count descending

        setUniversityMajorsCount(universityData);
      } catch (error) {
        console.error('Error fetching university majors count:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMajorsCount();
  }, [universities, language]);

  // Prepare chart data
  const chartData = useMemo(() => {
    if (universityMajorsCount.length === 0) {
      return {
        labels: [],
        datasets: [{
          label: '',
          data: [],
          backgroundColor: [],
          borderColor: [],
          borderWidth: 2,
          borderRadius: 8,
          borderSkipped: false,
        }],
      };
    }

    const labels = universityMajorsCount.map(item => item.name);
    const data = universityMajorsCount.map(item => item.count);
    
    // Generate colors for each bar
    const colors = data.map((_, index) => {
      const hue = (index * 137.508) % 360; // Golden angle for color distribution
      const saturation = actualTheme === 'dark' ? '70%' : '60%';
      const lightness = actualTheme === 'dark' ? '60%' : '50%';
      return `hsl(${hue}, ${saturation}, ${lightness})`;
    });

    return {
      labels,
      datasets: [
        {
          label: t('admin.universities.chart.numberOfMajors'),
          data,
          backgroundColor: colors,
          borderColor: colors,
          borderWidth: 2,
          borderRadius: 8,
          borderSkipped: false,
        },
      ],
    };
  }, [universityMajorsCount, t, actualTheme]);

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
          title: function(context: any) {
            // Show full university name in tooltip title
            const index = context[0].dataIndex;
            return universityMajorsCount[index]?.name || '';
          },
          label: function(context: any) {
            return `${context.parsed.y} ${t('admin.universities.chart.majors')}`;
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
          maxRotation: 0,
          minRotation: 0,
          callback: function(value: any, index: number) {
            const label = this.getLabelForValue(value);
            const maxLength = 25;
            if (label && label.length > maxLength) {
              return label.substring(0, maxLength) + '...';
            }
            return label;
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
  }), [actualTheme, isRTL, t, universityMajorsCount]);

  if (loading) {
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-gray-900 dark:text-gray-100" dir={language}>
            {t('admin.universities.chart.title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] w-full flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (universityMajorsCount.length === 0) {
    return null;
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-gray-900 dark:text-gray-100" dir={language}>
          {t('admin.universities.chart.title')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[400px] w-full" dir={isRTL ? 'rtl' : 'ltr'}>
          <Bar data={chartData} options={options} />
        </div>
      </CardContent>
    </Card>
  );
}

