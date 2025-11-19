import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { ArrowLeft, GraduationCap, Clock, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { useI18n } from "@/contexts/I18nContext";
import { PageAnimation } from "@/components/animations/PageAnimation";
import { ScrollAnimation } from "@/components/animations/ScrollAnimation";

const Assessment = () => {
  const { t, language } = useI18n();
  return (
    <PageAnimation>
      <div className="min-h-screen bg-gradient-to-br from-[#e3e8ff] via-[#f5f7ff] to-[#cbd4ff] dark:from-[#0f172a] dark:via-[#1e2a4a] dark:to-[#2a3b6b]">
        <Navbar />
        
        {/* Hero Section */}
        <section className="pt-14 pb-28">
          <ScrollAnimation>
            <div className="max-w-4xl mx-auto px-4 text-center space-y-8">
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center transform hover:scale-110 transition-all duration-500 animate-pulse">
                  <GraduationCap className="w-10 h-10 text-blue-600 dark:text-blue-300" />
                </div>
              </div>
              
              <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white animate-fade-in" dir={language}>
                {t('assessment.title')}
              </h1>
              
              <p className="text-xl md:text-2xl text-gray-700 dark:text-gray-200 max-w-3xl mx-auto animate-fade-in" dir={language}>
                {t('assessment.heroDesc')}
              </p>
            </div>
          </ScrollAnimation>
        </section>

        {/* Main/Coming Soon Section */}
        <section className="pb-16">
          <ScrollAnimation delay={0.2}>
            <div className="max-w-4xl mx-auto text-center px-4 space-y-12">
              
              {/* Coming Soon Banner */}
              <div className="bg-white dark:bg-gray-900/80 rounded-2xl p-8 md:p-12 border border-blue-100 dark:border-blue-800 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-500">
                <div className="space-y-6">
                  <div className="w-16 h-16 mx-auto rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center animate-bounce">
                    <Clock className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                  </div>
                  
                  <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white" dir={language}>
                    {t('assessment.comingSoonTitle')}
                  </h2>
                  
                  <p className="text-lg text-gray-700 dark:text-gray-200 max-w-2xl mx-auto" dir={language}>
                    {t('assessment.comingSoonDesc')}
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
                    <div className="flex items-center gap-2 text-blue-600 dark:text-blue-300 transform hover:scale-110 transition-all duration-300" dir={language}>
                      <Users className="w-5 h-5" />
                      <span className="text-sm">{t('assessment.feature.personalized')}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* What to Expect */}
              <ScrollAnimation delay={0.4}>
                <div className="text-center space-y-8">
                  <h3 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white" dir={language}>
                    {t('assessment.expectTitle')}
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
                    <ScrollAnimation delay={0.1}>
                      <div className="space-y-4 transform hover:scale-105 transition-all duration-500">
                        <div className="w-12 h-12 mx-auto rounded-lg bg-gradient-to-br from-blue-400 to-blue-500 text-white flex items-center justify-center hover:rotate-12 transition-all duration-300 ">
                          <span className="font-bold text-lg">1</span>
                        </div>
                        <h4 className="text-xl font-semibold text-gray-900 dark:text-white" dir={language}>{t('assessment.step1.title')}</h4>
                        <p className="text-gray-700 dark:text-gray-300" dir={language}>
                          {t('assessment.step1.desc')}
                        </p>
                      </div>
                    </ScrollAnimation>
                    
                    <ScrollAnimation delay={0.2}>
                      <div className="space-y-4 transform hover:scale-105 transition-all duration-500">
                        <div className="w-12 h-12 mx-auto rounded-lg bg-gradient-to-br from-purple-400 to-purple-500 text-white flex items-center justify-center hover:rotate-12 transition-all duration-300 ">
                          <span className="font-bold text-lg">2</span>
                        </div>
                        <h4 className="text-xl font-semibold text-gray-900 dark:text-white" dir={language}>{t('assessment.step2.title')}</h4>
                        <p className="text-gray-700 dark:text-gray-300" dir={language}>
                          {t('assessment.step2.desc')}
                        </p>
                      </div>
                    </ScrollAnimation>
                    
                    <ScrollAnimation delay={0.3}>
                      <div className="space-y-4 transform hover:scale-105 transition-all duration-500">
                        <div className="w-12 h-12 mx-auto rounded-lg bg-gradient-to-br from-green-400 to-green-500 text-white flex items-center justify-center hover:rotate-12 transition-all duration-300 ">
                          <span className="font-bold text-lg">3</span>
                        </div>
                        <h4 className="text-xl font-semibold text-gray-900 dark:text-white" dir={language}>{t('assessment.step3.title')}</h4>
                        <p className="text-gray-700 dark:text-gray-300" dir={language}>
                          {t('assessment.step3.desc')}
                        </p>
                      </div>
                    </ScrollAnimation>
                  </div>
                </div>
              </ScrollAnimation>

              {/* Back to Home Button */}
              <ScrollAnimation delay={0.6}>
                <div className="pt-8">
                  <Link to="/" id="assessment-back-to-home-link">
                    <Button 
                      id="assessment-back-to-home-button"
                      variant="outline"
                      className="rounded-2xl px-8 py-6 border-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 transition-transform duration-300 hover:-translate-y-1 hover:shadow-xl text-lg transform hover:scale-110"
                    >
                      <ArrowLeft className="w-5 h-5 mr-2" />
                      {t('auth.actions.backToHome')}
                    </Button>
                  </Link>
                </div>
              </ScrollAnimation>
            </div>
          </ScrollAnimation>
        </section>
      </div>
    </PageAnimation>
  );
};

export default Assessment;
