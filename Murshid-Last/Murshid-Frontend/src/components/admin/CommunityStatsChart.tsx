import { PieChart, Pie, Cell } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { useI18n } from "@/contexts/I18nContext";
import { useEffect, useState } from "react";

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
  const chartData = [
    {
      name: t("admin.dashboard.chart.community.posts"),
      value: posts,
      fill: "var(--color-posts)",
    },
    {
      name: t("admin.dashboard.chart.community.answers"),
      value: answers,
      fill: "var(--color-answers)",
    },
    {
      name: t("admin.dashboard.chart.community.comments"),
      value: comments,
      fill: "var(--color-comments)",
    },
    {
      name: t("admin.dashboard.chart.community.pendingReports"),
      value: pendingReports,
      fill: "var(--color-pendingReports)",
    },
  ].filter((item) => item.value > 0);

  const chartConfig = {
    posts: {
      label: t("admin.dashboard.chart.community.posts"),
      theme: {
        light: STAT_COLORS.posts.light,
        dark: STAT_COLORS.posts.dark,
      },
    },
    answers: {
      label: t("admin.dashboard.chart.community.answers"),
      theme: {
        light: STAT_COLORS.answers.light,
        dark: STAT_COLORS.answers.dark,
      },
    },
    comments: {
      label: t("admin.dashboard.chart.community.comments"),
      theme: {
        light: STAT_COLORS.comments.light,
        dark: STAT_COLORS.comments.dark,
      },
    },
    pendingReports: {
      label: t("admin.dashboard.chart.community.pendingReports"),
      theme: {
        light: STAT_COLORS.pendingReports.light,
        dark: STAT_COLORS.pendingReports.dark,
      },
    },
  };

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
                {t("admin.dashboard.chart.community.total")}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

