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

interface UserStatsChartProps {
  title: string;
  total: number;
  students: number;
  specialists: number;
  others: number;
  type: "total" | "students" | "specialists";
}

const COLORS = {
  students: { light: "#3b82f6", dark: "#60a5fa" },
  specialists: { light: "#10b981", dark: "#34d399" },
  admins: { light: "#eab308", dark: "#fbbf24" },
};

export function UserStatsChart({
  title,
  total,
  students,
  specialists,
  others,
  type,
}: UserStatsChartProps) {
  const { t, language } = useI18n();
  const { actualTheme } = useTheme();
  const [animatedValue, setAnimatedValue] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const isRTL = language === "ar";

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

  // Prepare chart data based on type
  const chartData = useMemo(() => {
    let labels: string[] = [];
    let data: number[] = [];
    let backgroundColor: string[] = [];

    if (type === "total") {
      if (students > 0) {
        labels.push(t("admin.dashboard.chart.students"));
        data.push(students);
        const color = actualTheme === "dark" ? COLORS.students.dark : COLORS.students.light;
        backgroundColor.push(color);
      }
      if (specialists > 0) {
        labels.push(t("admin.dashboard.chart.specialists"));
        data.push(specialists);
        const color = actualTheme === "dark" ? COLORS.specialists.dark : COLORS.specialists.light;
        backgroundColor.push(color);
      }
      if (others > 0) {
        labels.push(t("admin.dashboard.chart.admins"));
        data.push(others);
        const color = actualTheme === "dark" ? COLORS.admins.dark : COLORS.admins.light;
        backgroundColor.push(color);
      }
    } else if (type === "students") {
      labels = [t("admin.dashboard.chart.students")];
      data = [students];
      const color = actualTheme === "dark" ? COLORS.students.dark : COLORS.students.light;
      backgroundColor = [color];
    } else {
      labels = [t("admin.dashboard.chart.specialists")];
      data = [specialists];
      const color = actualTheme === "dark" ? COLORS.specialists.dark : COLORS.specialists.light;
      backgroundColor = [color];
    }

    // Use white borders to create splitters between segments
    // In dark mode, use a dark gray that matches the background
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
  }, [type, students, specialists, others, t, actualTheme]);

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
                {type === "total"
                  ? t("admin.dashboard.chart.total")
                  : type === "students"
                  ? t("admin.dashboard.chart.students")
                  : t("admin.dashboard.chart.specialists")}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

