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
import type { MajorCategory } from "@/types/database";

ChartJS.register(ArcElement, Tooltip, Legend);

interface CategoryCount {
  category: MajorCategory;
  count: number;
}

interface MajorsCategoryChartProps {
  title: string;
  categoryCounts: CategoryCount[];
}

// Color palette for different categories
const CATEGORY_COLORS: Record<MajorCategory, { light: string; dark: string }> = {
  Engineering: { light: "#3b82f6", dark: "#60a5fa" },
  Medicine: { light: "#ef4444", dark: "#f87171" },
  Business: { light: "#10b981", dark: "#34d399" },
  Arts: { light: "#f59e0b", dark: "#fbbf24" },
  Science: { light: "#8b5cf6", dark: "#a78bfa" },
  IT: { light: "#06b6d4", dark: "#22d3ee" },
  Law: { light: "#ec4899", dark: "#f472b6" },
  Education: { light: "#14b8a6", dark: "#2dd4bf" },
  Other: { light: "#6b7280", dark: "#9ca3af" },
};

// Category translation keys
const CATEGORY_KEYS: Record<MajorCategory, string> = {
  Engineering: "admin.dashboard.chart.category.engineering",
  Medicine: "admin.dashboard.chart.category.medicine",
  Business: "admin.dashboard.chart.category.business",
  Arts: "admin.dashboard.chart.category.arts",
  Science: "admin.dashboard.chart.category.science",
  IT: "admin.dashboard.chart.category.it",
  Law: "admin.dashboard.chart.category.law",
  Education: "admin.dashboard.chart.category.education",
  Other: "admin.dashboard.chart.category.other",
};

export function MajorsCategoryChart({ title, categoryCounts }: MajorsCategoryChartProps) {
  const { t, language } = useI18n();
  const { actualTheme } = useTheme();
  const [animatedValue, setAnimatedValue] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const isRTL = language === "ar";

  const totalMajors = categoryCounts.reduce((sum, item) => sum + item.count, 0);

  // Animate the count value
  useEffect(() => {
    const duration = 1000;
    const steps = 60;
    const increment = totalMajors / steps;
    let current = 0;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      current = Math.min(increment * step, totalMajors);
      setAnimatedValue(Math.floor(current));

      if (step >= steps) {
        clearInterval(timer);
        setAnimatedValue(totalMajors);
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [totalMajors]);

  // Prepare chart data
  const chartData = useMemo(() => {
    const filteredCounts = categoryCounts.filter((item) => item.count > 0);
    
    const labels = filteredCounts.map((item) => t(CATEGORY_KEYS[item.category]));
    const data = filteredCounts.map((item) => item.count);
    const backgroundColor = filteredCounts.map((item) => {
      const colors = CATEGORY_COLORS[item.category];
      return actualTheme === "dark" ? colors.dark : colors.light;
    });

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
  }, [categoryCounts, t, actualTheme]);

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
                {t("admin.dashboard.chart.majors")}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

