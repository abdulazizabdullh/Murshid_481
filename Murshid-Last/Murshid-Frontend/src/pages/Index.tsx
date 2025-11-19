import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AnimatedHero } from "@/components/AnimatedHero";
import { PageAnimation } from "@/components/animations/PageAnimation";
import { ScrollAnimation } from "@/components/animations/ScrollAnimation";
import {
  Search,
  Target,
  CheckCircle,
  GraduationCap,
  BookOpen,
  Users,
  TrendingUp,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useI18n } from "@/contexts/I18nContext";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";
import { apiFetch } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";

const Index = () => {
  const navigate = useNavigate();
  const { t, language } = useI18n();
  const { user, loading } = useAuth();

  // Keep backend ping logic intact (used in a hidden diagnostics block below)
  const {
    data: pingResponse,
    refetch: refetchPing,
    isLoading: pingLoading,
    isError: pingError,
    error: pingErrorObj,
  } = useQuery({
    queryKey: ["ping"],
    queryFn: async () =>
      await apiFetch<{ message: string; sub: string; email: string }>("/api/ping"),
    enabled: !!user && user.id !== "guest",
  });

  // Preserve admin auto-redirect - redirect immediately, don't render
  useEffect(() => {
    if (user?.is_admin) {
      navigate("/admin", { replace: true });
    }
  }, [user, navigate]);

  // Wait for auth to load before rendering anything
  // This prevents flash of homepage while auth is loading
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#e3e8ff] via-[#f5f7ff] to-[#cbd4ff] dark:from-[#0f172a] dark:via-[#1e2a4a] dark:to-[#2a3b6b]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render homepage for admins - redirect immediately redirect to dashboard
  if(user?.is_admin){
    navigate("/admin");
  }
  if (user?.is_admin) {
    return null;
  }

  const steps = [
    {
      icon: Search,
      title: t("homepage.exploreInterests"),
      description: t("homepage.exploreInterestsDesc"),
      color: "from-blue-300 to-blue-400",
    },
    {
      icon: Target,
      title: t("homepage.getRecommendations"),
      description: t("homepage.getRecommendationsDesc"),
      color: "from-purple-300 to-purple-400",
    },
    {
      icon: CheckCircle,
      title: t("homepage.makeDecision"),
      description: t("homepage.makeDecisionDesc"),
      color: "from-green-300 to-green-400",
    },
  ];

  const features = [
    {
      icon: GraduationCap,
      title: t("homepage.diverseMajors"),
      description: t("homepage.diverseMajorsDesc"),
      color:
        "bg-blue-50 text-blue-500 dark:bg-blue-950/50 dark:text-blue-300",
    },
    {
      icon: BookOpen,
      title: t("homepage.comprehensiveInfo"),
      description: t("homepage.comprehensiveInfoDesc"),
      color:
        "bg-purple-50 text-purple-500 dark:bg-purple-950/50 dark:text-purple-300",
    },
    {
      icon: Users,
      title: t("homepage.supportiveCommunity"),
      description: t("homepage.supportiveCommunityDesc"),
      color: "bg-pink-50 text-pink-500 dark:bg-pink-950/50 dark:text-pink-300",
    },
    {
      icon: TrendingUp,
      title: t("homepage.futureVision"),
      description: t("homepage.futureVisionDesc"),
      color:
        "bg-green-50 text-green-500 dark:bg-green-950/50 dark:text-green-300",
    },
  ];

  const onNavigate = (page: string) => {
    if (page === "majors") {
      navigate("/majors");
    } else if (page === "universities") {
      navigate("/universities");
    } else if (page === "community") {
      if (user) {
        navigate("/community");
      } else {
        navigate("/login");
      }
    }
  };

  return (
    <PageAnimation>
      <div className="min-h-screen">
        <Navbar />

        {/* Hidden diagnostics to preserve backend ping behavior without UI noise */}
        {user && user.id !== "guest" && (
          <div className="hidden">
            <span>
              {pingLoading
                ? "Checking connectivity..."
                : pingResponse
                ? `Backend: ${pingResponse.message}`
                : pingError
                ? `Error: ${String((pingErrorObj as Error)?.message || "")}`
                : ""}
            </span>
            <button onClick={() => refetchPing()} aria-hidden>
              retry
            </button>
          </div>
        )}

        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-[#e3e8ff] via-[#f5f7ff] to-[#cbd4ff] dark:from-[#0f172a] dark:via-[#1e2a4a] dark:to-[#2a3b6b] pt-10 pb-32">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Text Content */}
            <div
              className={`text-center ${
                language === "ar"
                  ? "lg:text-right order-2 lg:order-1"
                  : "lg:text-left order-2 lg:order-1"
              }`}
              dir={language}
            >
              <div className="inline-block mb-6">
                <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-4 py-2 rounded-full">
                  {t("homepage.welcome")}
                </span>
              </div>
              <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-gray-100 mb-6">
                {t("homepage.title")}
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto lg:mx-0">
                {t("homepage.subtitle")}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Button
                  onClick={() => onNavigate("majors")}
                  id="home-browse-majors-button"
                  variant="outline"
                  className="rounded-2xl px-8 py-6 border-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 transition-transform duration-300 hover:-translate-y-1 hover:shadow-xl"
                >
                  {t("homepage.browseMajors")}
                </Button>
                <Button
                  onClick={() => onNavigate("universities")}
                  id="home-browse-universities-button"
                  variant="outline"
                  className="rounded-2xl px-8 py-6 border-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 transition-transform duration-300 hover:-translate-y-1 hover:shadow-xl"
                >
                  {t("homepage.browseUniversities")}
                </Button>
                <Button
                  onClick={() => onNavigate("community")}
                  id="home-browse-community-button"
                  variant="outline"
                  className="rounded-2xl px-8 py-6 border-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 transition-transform duration-300 hover:-translate-y-1 hover:shadow-xl"
                >
                  {language === 'ar' ? 'تصفح المجتمع' : 'Browse Community'}
                </Button>
              </div>
            </div>

            {/* Animated Elements */}
            <div className="order-1 lg:order-2">
              <AnimatedHero />
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <ScrollAnimation>
        <section className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-10">
          <div className="text-center mb-16">
            <h2
              className="  text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4"
              dir={language}
            >
              {t("homepage.howItWorks")}
            </h2>
            <p
              className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto "
              dir={language}
            >
              {t("homepage.threeSteps")}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <ScrollAnimation key={step.title} delay={index * 0.2}>
                <Card
                  className="relative p-8 text-center rounded-3xl shadow-lg moving-shadow border-0 bg-white dark:bg-gray-800"
                >
                <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
                  <div
                    className={`w-16 h-16 bg-gradient-to-br ${step.color} rounded-2xl flex items-center justify-center shadow-lg`}
                  >
                    <step.icon className="w-8 h-8 text-white" />
                  </div>
                </div>
                <div className="mt-12">
                  <h3
                    className="text-gray-900 dark:text-gray-100 mb-3 font-semibold"
                    dir={language}
                  >
                    {step.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300" dir={language}>
                    {step.description}
                  </p>
                </div>
                </Card>
              </ScrollAnimation>
            ))}
          </div>
        </div>
      </section>
      </ScrollAnimation>

      {/* Features Section */}
      <ScrollAnimation delay={0.2}>
        <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-800 dark:to-blue-900/20">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-10">
          <div className="text-center mb-16">
            <h2
              className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4"
              dir={language}
            >
              {t("homepage.whyChooseMurshid")}
            </h2>
            <p
              className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto"
              dir={language}
            >
              {t("homepage.whyChooseDesc")}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <ScrollAnimation key={feature.title} delay={index * 0.1}>
                <Card
                  className="p-6 rounded-3xl shadow-md moving-shadow border-0 bg-white dark:bg-gray-800"
                >
                <div
                  className={`w-14 h-14 rounded-2xl ${feature.color} flex items-center justify-center mb-4`}
                >
                  <feature.icon className="w-7 h-7" />
                </div>
                <h3
                  className="text-gray-900 dark:text-gray-100 mb-2 font-semibold"
                  dir={language}
                >
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300" dir={language}>
                  {feature.description}
                </p>
                </Card>
              </ScrollAnimation>
            ))}
          </div>
        </div>
      </section>
      </ScrollAnimation>

      {/* CTA Section */}
      <ScrollAnimation>
        <section className="py-20 bg-[#cdd6ff] dark:bg-[#2a3b6b]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-10 text-center">
          <ScrollAnimation delay={0.2}>
            <h2
              className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-6"
              dir={language}
            >
              {t("homepage.readyToDiscover")}
            </h2>
            <p className="text-gray-700 dark:text-gray-200 mb-8 max-w-2xl mx-auto" dir={language}>
              {t("homepage.readyToDiscoverDesc")}
            </p>
            <Button
              onClick={() => onNavigate("majors")}
              id="home-browse-majors-cta-button"
              className="bg-white text-blue-600 hover:bg-blue-50 hover:text-blue-700 rounded-2xl px-8 py-6 shadow-lg transition-transform duration-300 hover:-translate-y-1 hover:shadow-xl"
            >
              {t("homepage.browseMajors")}
            </Button>
          </ScrollAnimation>
        </div>
      </section>
      </ScrollAnimation>
      </div>
    </PageAnimation>
  );
};

export default Index;
