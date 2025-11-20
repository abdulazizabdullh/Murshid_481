import { PieChart, Pie, Cell } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { useI18n } from "@/contexts/I18nContext";
import { useEffect, useState } from "react";

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
  const getChartData = () => {
    if (type === "total") {
      const data = [];
      if (students > 0) {
        data.push({
          name: t("admin.dashboard.chart.students"),
          value: students,
          fill: "var(--color-students)",
        });
      }
      if (specialists > 0) {
        data.push({
          name: t("admin.dashboard.chart.specialists"),
          value: specialists,
          fill: "var(--color-specialists)",
        });
      }
      if (others > 0) {
        data.push({
          name: t("admin.dashboard.chart.admins"),
          value: others,
          fill: "var(--color-admins)",
        });
      }
      return data;
    } else if (type === "students") {
      return [
        {
          name: t("admin.dashboard.chart.students"),
          value: students,
          fill: "var(--color-students)",
        },
      ];
    } else {
      return [
        {
          name: t("admin.dashboard.chart.specialists"),
          value: specialists,
          fill: "var(--color-specialists)",
        },
      ];
    }
  };

  const chartData = getChartData();
  const chartConfig = {
    students: {
      label: t("admin.dashboard.chart.students"),
      theme: {
        light: COLORS.students.light,
        dark: COLORS.students.dark,
      },
    },
    specialists: {
      label: t("admin.dashboard.chart.specialists"),
      theme: {
        light: COLORS.specialists.light,
        dark: COLORS.specialists.dark,
      },
    },
    admins: {
      label: t("admin.dashboard.chart.admins"),
      theme: {
        light: COLORS.admins.light,
        dark: COLORS.admins.dark,
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

