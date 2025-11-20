import { PieChart, Pie, Cell } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { useI18n } from "@/contexts/I18nContext";
import { useEffect, useState } from "react";
import type { MajorCategory } from "@/types/database";

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
  const chartData = categoryCounts
    .filter((item) => item.count > 0)
    .map((item) => ({
      name: t(CATEGORY_KEYS[item.category]),
      value: item.count,
      fill: `var(--color-${item.category.toLowerCase()})`,
      category: item.category,
    }));

  // Build chart config with colors
  const chartConfig = categoryCounts.reduce((config, item) => {
    const colors = CATEGORY_COLORS[item.category];
    config[item.category.toLowerCase()] = {
      label: t(CATEGORY_KEYS[item.category]),
      theme: {
        light: colors.light,
        dark: colors.dark,
      },
    };
    return config;
  }, {} as Record<string, { label: string; theme: { light: string; dark: string } }>);

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
          <ChartContainer
            config={chartConfig}
            className="h-[200px] w-full"
          >
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={70}
                innerRadius={45}
                fill="#8884d8"
                dataKey="value"
                animationBegin={0}
                animationDuration={1000}
                isAnimationActive={true}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <ChartTooltip
                content={<ChartTooltipContent />}
                cursor={{ fill: "transparent" }}
              />
            </PieChart>
          </ChartContainer>
          <div
            className={`absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-200 ${
              isHovered ? "opacity-30" : "opacity-100"
            }`}
            dir={isRTL ? "rtl" : "ltr"}
          >
            <div className="text-center">
              <div className="text-3xl font-bold">{animatedValue.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {t("admin.dashboard.chart.totalMajors")}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

