import { useMemo, useEffect, useState } from "react";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Doughnut } from "react-chartjs-2";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useI18n } from "@/contexts/I18nContext";
import { useTheme } from "@/contexts/ThemeContext";

ChartJS.register(ArcElement, Tooltip, Legend);

interface CommunityStatsChartProps {
  title: string;
  posts: number;
  answers: number;
  comments: number;
  pendingReports: number;
}

// Color palette for different community stats
const STAT_COLORS = {
  posts: { light: "#3b82f6", dark: "#60a5fa" },
  answers: { light: "#10b981", dark: "#34d399" },
  comments: { light: "#f59e0b", dark: "#fbbf24" },
  pendingReports: { light: "#ef4444", dark: "#f87171" },
};

export function CommunityStatsChart({
  title,
  posts,
  answers,
  comments,
  pendingReports,
}: CommunityStatsChartProps) {
  const { t, language } = useI18n();
  const { actualTheme } = useTheme();
  const [animatedValue, setAnimatedValue] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const isRTL = language === "ar";

  const total = posts + answers + comments + pendingReports;

  // Animate the count value
  useEffect(() => {
    const duration = 1000;
    const steps = 60;
    const increment = total / steps;
    let current = 0;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      current = Math.min(increment * step, total);
      setAnimatedValue(Math.floor(current));

      if (step >= steps) {
        clearInterval(timer);
        setAnimatedValue(total);
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [total]);

  // Prepare chart data
  const chartData = useMemo(() => {
    const dataItems = [
      {
        label: t("admin.dashboard.chart.community.posts"),
        value: posts,
        color: actualTheme === "dark" ? STAT_COLORS.posts.dark : STAT_COLORS.posts.light,
      },
      {
        label: t("admin.dashboard.chart.community.answers"),
        value: answers,
        color: actualTheme === "dark" ? STAT_COLORS.answers.dark : STAT_COLORS.answers.light,
      },
      {
        label: t("admin.dashboard.chart.community.comments"),
        value: comments,
        color: actualTheme === "dark" ? STAT_COLORS.comments.dark : STAT_COLORS.comments.light,
      },
      {
        label: t("admin.dashboard.chart.community.pendingReports"),
        value: pendingReports,
        color: actualTheme === "dark" ? STAT_COLORS.pendingReports.dark : STAT_COLORS.pendingReports.light,
      },
    ].filter((item) => item.value > 0);

    const labels = dataItems.map((item) => item.label);
    const data = dataItems.map((item) => item.value);
    const backgroundColor = dataItems.map((item) => item.color);

    // Use white borders to create splitters between segments
    const whiteBorderColor = actualTheme === "dark" ? "#1f2937" : "#ffffff";
    const borderColors = Array(data.length).fill(whiteBorderColor);

    return {
      labels,
      datasets: [
        {
          data,
          backgroundColor,
          borderColor: borderColors,
          borderWidth: 4,
        },
      ],
    };
  }, [posts, answers, comments, pendingReports, t, actualTheme]);

  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    cutout: "60%",
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: actualTheme === "dark" ? "rgba(31, 41, 55, 0.95)" : "rgba(255, 255, 255, 0.95)",
        titleColor: actualTheme === "dark" ? "#f3f4f6" : "#111827",
        bodyColor: actualTheme === "dark" ? "#d1d5db" : "#374151",
        borderColor: actualTheme === "dark" ? "#4b5563" : "#e5e7eb",
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
        displayColors: true,
        rtl: isRTL,
        callbacks: {
          label: function(context: any) {
            const label = context.label || "";
            const value = context.parsed || 0;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
            return `${label}: ${value} (${percentage}%)`;
          },
        },
      },
    },
    animation: {
      animateRotate: true,
      animateScale: true,
      duration: 1000,
    },
  }), [actualTheme, isRTL]);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div 
          className="relative"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <div className="h-[200px] w-full">
            <Doughnut data={chartData} options={options} />
          </div>
          <div
            className={`absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-200 ${
              isHovered ? "opacity-30" : "opacity-100"
            }`}
            dir={isRTL ? "rtl" : "ltr"}
          >
            <div className="text-center">
              <div className="text-3xl font-bold">{animatedValue.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {t("admin.dashboard.chart.community.total")}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

