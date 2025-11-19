import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { PageAnimation } from "@/components/animations/PageAnimation";
import { ScrollAnimation } from "@/components/animations/ScrollAnimation";
import { 
  ArrowLeft, 
  Clock, 
  Briefcase, 
  DollarSign, 
  BookOpen, 
  Bookmark, 
  BookmarkCheck,
  Building2,
  GraduationCap
} from 'lucide-react';
import { getMajorById } from '@/lib/majorsApi';
import { getUniversitiesByMajor } from '@/lib/majorsApi';
import { useBookmarks } from '@/hooks/useBookmarks';
import { useI18n } from '@/contexts/I18nContext';
import type { Major, University } from '@/types/database';
import { toast } from 'sonner';

export default function MajorDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { language } = useI18n();
  const { toggleBookmark, isBookmarked } = useBookmarks();
  
  const [major, setMajor] = useState<Major | null>(null);
  const [universities, setUniversities] = useState<University[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchMajorDetails();
    }
  }, [id]);

  const fetchMajorDetails = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const [majorData, universitiesData] = await Promise.all([
        getMajorById(id),
        getUniversitiesByMajor(id)
      ]);
      
      setMajor(majorData);
      setUniversities(universitiesData);
    } catch (error) {
      console.error('Error fetching major details:', error);
      toast.error('Failed to load major details');
    } finally {
      setLoading(false);
    }
  };

  const handleBookmark = async () => {
    if (id) {
      await toggleBookmark('major', id);
    }
  };

  const bookmarked = id ? isBookmarked('major', id) : false;
  const majorName = language === 'ar' && major?.name_ar ? major.name_ar : major?.name;
  const majorDescription = language === 'ar' && major?.description_ar ? major.description_ar : major?.description;
  const careerProspects = language === 'ar' && major?.career_prospects_ar ? major.career_prospects_ar : major?.career_prospects;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#e3e8ff] via-[#f5f7ff] to-[#cbd4ff] dark:from-[#0f172a] dark:via-[#1e2a4a] dark:to-[#2a3b6b]">
        <Navbar />
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-10 py-20">
          <Skeleton className="h-12 w-64 mb-8" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Skeleton className="h-96 w-full" />
            </div>
            <div>
              <Skeleton className="h-64 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!major) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#e3e8ff] via-[#f5f7ff] to-[#cbd4ff] dark:from-[#0f172a] dark:via-[#1e2a4a] dark:to-[#2a3b6b]">
        <Navbar />
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-10 py-20">
          <div className="text-center">
            <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Major not found
            </h2>
            <Button onClick={() => navigate('/majors')} id="major-detail-not-found-back-button" className="mt-4">
              Back to Majors
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <PageAnimation>
      <div className="min-h-screen bg-gradient-to-br from-[#e3e8ff] via-[#f5f7ff] to-[#cbd4ff] dark:from-[#0f172a] dark:via-[#1e2a4a] dark:to-[#2a3b6b]">
        <Navbar />
      
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-10 py-20">
        {/* Back Button */}
        <Button
          onClick={() => navigate('/majors')}
          id="major-detail-back-button"
          variant="ghost"
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {language === 'ar' ? 'العودة إلى التخصصات' : 'Back to Majors'}
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Header */}
            <Card className="p-8 mb-6">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-start gap-4">
                  <div className="w-24 h-24 bg-blue-100 dark:bg-blue-900 rounded-2xl flex items-center justify-center text-4xl overflow-hidden shadow-lg">
                    {major.icon_name?.startsWith('http') ? (
                      <img src={major.icon_name} alt={majorName} className="w-full h-full object-contain p-3" />
                    ) : (
                      <span className="text-4xl">{major.icon_name || '📚'}</span>
                    )}
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2" dir={language}>
                      {majorName}
                    </h1>
                    {major.name_ar && language === 'en' && (
                      <p className="text-lg text-gray-600 dark:text-gray-400" dir="rtl">
                        {major.name_ar}
                      </p>
                    )}
                  </div>
                </div>
                
                <Button
                  onClick={handleBookmark}
                  id="major-detail-bookmark-button"
                  variant="outline"
                  size="lg"
                  className="rounded-full"
                >
                  {bookmarked ? (
                    <BookmarkCheck className="w-5 h-5 text-blue-500 fill-blue-500" />
                  ) : (
                    <Bookmark className="w-5 h-5" />
                  )}
                </Button>
              </div>

              {/* Badges */}
              <div className="flex flex-wrap gap-2 mb-6">
                <Badge variant="outline" className="text-sm">
                  {major.category}
                </Badge>
                {major.degree_type && (
                  <Badge variant="outline" className="text-sm">
                    <GraduationCap className="w-3 h-3 mr-1" />
                    {major.degree_type}
                  </Badge>
                )}
                {major.duration_years && (
                  <Badge variant="outline" className="text-sm">
                    <Clock className="w-3 h-3 mr-1" />
                    {major.duration_years} {language === 'ar' ? 'سنوات' : 'years'}
                  </Badge>
                )}
              </div>

              {/* Description */}
              {majorDescription && (
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3" dir={language}>
                    {language === 'ar' ? 'نبذة عن التخصص' : 'About This Major'}
                  </h2>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed" dir={language}>
                    {majorDescription}
                  </p>
                </div>
              )}

              {/* Career Prospects */}
              {careerProspects && (
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3" dir={language}>
                    <Briefcase className="w-5 h-5 inline mr-2" />
                    {language === 'ar' ? 'الفرص الوظيفية' : 'Career Prospects'}
                  </h2>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed" dir={language}>
                    {careerProspects}
                  </p>
                </div>
              )}

              {/* Salary Range */}
              {major.average_salary_range && (
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                    <DollarSign className="w-5 h-5" />
                    <span className="font-semibold">
                      {language === 'ar' ? 'متوسط الراتب' : 'Average Salary'}:
                    </span>
                    <span>{major.average_salary_range}</span>
                  </div>
                </div>
              )}

              {/* Required Skills */}
              {major.required_skills && major.required_skills.length > 0 && (
                <div className="mt-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3" dir={language}>
                    {language === 'ar' ? 'المهارات المطلوبة' : 'Required Skills'}
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {major.required_skills.map((skill, index) => (
                      <Badge key={index} variant="secondary">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Related Fields */}
              {major.related_fields && major.related_fields.length > 0 && (
                <div className="mt-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3" dir={language}>
                    {language === 'ar' ? 'مجالات ذات صلة' : 'Related Fields'}
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {major.related_fields.map((field, index) => (
                      <Badge key={index} variant="outline">
                        {field}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </Card>

            {/* Universities Section */}
            <Card className="p-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6" dir={language}>
                {language === 'ar' ? 'الجامعات التي تقدم هذا التخصص' : 'Universities Offering This Major'}
                <span className="text-gray-500 ml-2">({universities.length})</span>
              </h2>

              {universities.length > 0 ? (
                <div className="grid grid-cols-1 gap-4">
                  {universities.map((university) => {
                    const universityName = language === 'ar' && university.name_ar ? university.name_ar : university.name;
                    const universityLocation = language === 'ar' && university.location_ar ? university.location_ar : university.location;
                    
                    return (
                      <Card
                        key={university.id}
                        id={`major-detail-university-card-${university.id}`}
                        className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
                        onClick={() => navigate(`/universities/${university.id}`)}
                      >
                        <div className="flex items-center gap-4">
                          {university.logo_url ? (
                            <img 
                              src={university.logo_url} 
                              alt={universityName} 
                              className="w-20 h-20 object-cover rounded-xl shadow-md"
                            />
                          ) : (
                            <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900 rounded-xl flex items-center justify-center shadow-md">
                              <Building2 className="w-10 h-10 text-blue-600 dark:text-blue-400" />
                            </div>
                          )}
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100" dir={language}>
                              {universityName}
                            </h3>
                            <div className="flex items-center gap-4 mt-2">
                              {university.city && (
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  📍 {universityLocation || university.city}
                                </p>
                              )}
                              {university.university_type && (
                                <Badge variant="secondary" className="text-xs">
                                  {university.university_type}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <ArrowLeft className="w-5 h-5 text-gray-400 rotate-180" />
                        </div>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8" dir={language}>
                  {language === 'ar' ? 'لا توجد جامعات تقدم هذا التخصص حالياً' : 'No universities offer this major at this time'}
                </p>
              )}
            </Card>
          </div>

          {/* Sidebar */}
          <div>
            <Card className="p-6 sticky top-24">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4" dir={language}>
                {language === 'ar' ? 'تفاصيل البرنامج' : 'Program Details'}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {language === 'ar' ? 'الفئة' : 'Category'}
                  </p>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {major.category}
                  </p>
                </div>

                {major.degree_type && (
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {language === 'ar' ? 'الدرجة العلمية' : 'Degree Type'}
                    </p>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {major.degree_type}
                    </p>
                  </div>
                )}

                {major.duration_years && (
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {language === 'ar' ? 'المدة' : 'Duration'}
                    </p>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {major.duration_years} {language === 'ar' ? 'سنوات' : 'years'}
                    </p>
                  </div>
                )}

                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                    {language === 'ar' ? 'الجامعات المتاحة' : 'Available at'}
                  </p>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {universities.length} {language === 'ar' ? 'جامعة' : 'universities'}
                  </p>
                </div>
              </div>

              <Button 
                onClick={() => navigate('/assessment')}
                id="major-detail-assessment-button"
                className="w-full mt-6"
              >
                {language === 'ar' ? 'هل هذا التخصص مناسب لي؟' : 'Is This Right for Me?'}
              </Button>
            </Card>
          </div>
        </div>
      </div>
    </div>
    </PageAnimation>
  );
}

