import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  ArrowLeft, 
  MapPin, 
  Globe, 
  Mail, 
  Phone, 
  Calendar, 
  Users, 
  Star, 
  Bookmark, 
  BookmarkCheck,
  ExternalLink,
  Building2
} from 'lucide-react';
import { getUniversityById } from '@/lib/universitiesApi';
import { getMajorsByUniversity } from '@/lib/majorsApi';
import { useBookmarks } from '@/hooks/useBookmarks';
import { useI18n } from '@/contexts/I18nContext';
import type { University, Major } from '@/types/database';
import { toast } from 'sonner';

export default function UniversityDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { language } = useI18n();
  const { toggleBookmark, isBookmarked } = useBookmarks();
  
  const [university, setUniversity] = useState<University | null>(null);
  const [majors, setMajors] = useState<Major[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchUniversityDetails();
    }
  }, [id]);

  const fetchUniversityDetails = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const [uniData, majorsData] = await Promise.all([
        getUniversityById(id),
        getMajorsByUniversity(id)
      ]);
      
      setUniversity(uniData);
      setMajors(majorsData);
    } catch (error) {
      console.error('Error fetching university details:', error);
      toast.error('Failed to load university details');
    } finally {
      setLoading(false);
    }
  };

  const handleBookmark = async () => {
    if (id) {
      await toggleBookmark('university', id);
    }
  };

  const bookmarked = id ? isBookmarked('university', id) : false;
  const universityName = language === 'ar' && university?.name_ar ? university.name_ar : university?.name;
  const universityDescription = language === 'ar' && university?.description_ar ? university.description_ar : university?.description;
  const universityLocation = language === 'ar' && university?.location_ar ? university.location_ar : university?.location;
  const studentCount = Number(university?.student_count ?? 0);

  const getLocalizedType = (type?: string): string | undefined => {
    if (!type) return undefined;
    if (language === 'ar') {
      const map: Record<string, string> = {
        Public: 'حكومية',
        Private: 'أهلية',
        International: 'دولية',
      };
      return map[type] ?? type;
    }
    return type;
  };

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

  if (!university) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#e3e8ff] via-[#f5f7ff] to-[#cbd4ff] dark:from-[#0f172a] dark:via-[#1e2a4a] dark:to-[#2a3b6b]">
        <Navbar />
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-10 py-20">
          <div className="text-center">
            <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              University not found
            </h2>
            <Button onClick={() => navigate('/universities')} id="university-detail-not-found-back-button" className="mt-4">
              Back to Universities
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#e3e8ff] via-[#f5f7ff] to-[#cbd4ff] dark:from-[#0f172a] dark:via-[#1e2a4a] dark:to-[#2a3b6b]">
      <Navbar />
      
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-10 py-20">
        {/* Back Button */}
        <Button
          onClick={() => navigate('/universities')}
          id="university-detail-back-button"
          variant="ghost"
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {language === 'ar' ? 'العودة إلى الجامعات' : 'Back to Universities'}
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Header */}
            <Card className="p-8 mb-6">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-start gap-4">
                  <div className="w-24 h-24 bg-blue-100 dark:bg-blue-900 rounded-2xl flex items-center justify-center overflow-hidden shadow-lg">
                    {university.logo_url ? (
                      <img 
                        src={`${university.logo_url}?t=${new Date(university.updated_at || Date.now()).getTime()}`}
                        alt={universityName} 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                          if (fallback) fallback.style.display = 'block';
                        }}
                      />
                    ) : null}
                    <Building2 
                      className="w-12 h-12 text-blue-600 dark:text-blue-400" 
                      style={{ display: university.logo_url ? 'none' : 'block' }}
                    />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2" dir={language}>
                      {universityName}
                    </h1>
                    {university.name_ar && language === 'en' && (
                      <p className="text-lg text-gray-600 dark:text-gray-400" dir="rtl">
                        {university.name_ar}
                      </p>
                    )}
                  </div>
                </div>
                
                <Button
                  onClick={handleBookmark}
                  id="university-detail-bookmark-button"
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
                {university.university_type && (
                  <Badge variant="outline" className="text-sm">
                    {getLocalizedType(university.university_type)}
                  </Badge>
                )}
                {Number(university.establishment_year ?? 0) > 0 && (
                  <Badge variant="outline" className="text-sm">
                    <Calendar className="w-3 h-3 mr-1" />
                    {language === 'ar' ? 'تأسست ' : 'Est. '}{university.establishment_year}
                  </Badge>
                )}
                {Number(university.ranking_national ?? 0) > 0 && (
                  <Badge variant="outline" className="text-sm">
                    <Star className="w-3 h-3 mr-1 fill-yellow-500 text-yellow-500" />
                    #{university.ranking_national} {language === 'ar' ? 'محلياً' : 'National'}
                  </Badge>
                )}
              </div>

              {/* Description */}
              {universityDescription && (
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3" dir={language}>
                    {language === 'ar' ? 'نبذة' : 'About'}
                  </h2>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed" dir={language}>
                    {universityDescription}
                  </p>
                </div>
              )}

              {/* Website */}
              {university.website_url && (
              <Button
                onClick={() => window.open(university.website_url, '_blank')}
                id="university-detail-website-button"
                className="w-full sm:w-auto"
              >
                  <Globe className="w-4 h-4 mr-2" />
                  {language === 'ar' ? 'زيارة الموقع' : 'Visit Website'}
                  <ExternalLink className="w-4 h-4 ml-2" />
                </Button>
              )}
            </Card>

            {/* Majors Section */}
            <Card className="p-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6" dir={language}>
                {language === 'ar' ? 'التخصصات المتاحة' : 'Available Majors'}
                <span className="text-gray-500 ml-2">({majors.length})</span>
              </h2>

              {majors.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {majors.map((major) => {
                    const majorName = language === 'ar' && major.name_ar ? major.name_ar : major.name;
                    
                    return (
                      <Card
                        key={major.id}
                        id={`university-detail-major-card-${major.id}`}
                        className="p-4 hover:shadow-lg transition-shadow cursor-pointer"
                        onClick={() => navigate(`/majors/${major.id}`)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900 rounded-xl flex items-center justify-center text-2xl shadow-md">
                            {major.icon_name || '📚'}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 dark:text-gray-100" dir={language}>
                              {majorName}
                            </h3>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="secondary" className="text-xs">
                                {major.category}
                              </Badge>
                              {major.degree_type && (
                                <Badge variant="outline" className="text-xs">
                                  {major.degree_type}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8" dir={language}>
                  {language === 'ar' ? 'لا توجد تخصصات متاحة حالياً' : 'No majors available at this time'}
                </p>
              )}
            </Card>
          </div>

          {/* Sidebar */}
          <div>
            <Card className="p-6 sticky top-24">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4" dir={language}>
                {language === 'ar' ? 'معلومات الاتصال' : 'Contact Information'}
              </h3>
              
              <div className="space-y-4">
                {university.city && (
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-gray-500 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {language === 'ar' ? 'الموقع' : 'Location'}
                      </p>
                      <p className="font-medium text-gray-900 dark:text-gray-100" dir={language}>
                        {universityLocation || university.city}
                        {university.country && `, ${university.country}`}
                      </p>
                    </div>
                  </div>
                )}

                {university.contact_email && (
                  <div className="flex items-start gap-3">
                    <Mail className="w-5 h-5 text-gray-500 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {language === 'ar' ? 'البريد الإلكتروني' : 'Email'}
                      </p>
                      <a 
                        href={`mailto:${university.contact_email}`}
                        className="font-medium text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        {university.contact_email}
                      </a>
                    </div>
                  </div>
                )}

                {university.contact_phone && (
                  <div className="flex items-start gap-3">
                    <Phone className="w-5 h-5 text-gray-500 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {language === 'ar' ? 'الهاتف' : 'Phone'}
                      </p>
                      <a 
                        href={`tel:${university.contact_phone}`}
                        className="font-medium text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        {university.contact_phone}
                      </a>
                    </div>
                  </div>
                )}

                {studentCount > 0 && (
                  <div className="flex items-start gap-3">
                    <Users className="w-5 h-5 text-gray-500 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {language === 'ar' ? 'عدد الطلاب' : 'Students'}
                      </p>
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {studentCount.toLocaleString()}+
                      </p>
                    </div>
                  </div>
                )}

                {university.ranking_international && (
                  <div className="flex items-start gap-3">
                    <Star className="w-5 h-5 text-gray-500 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {language === 'ar' ? 'الترتيب الدولي' : 'International Rank'}
                      </p>
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        #{university.ranking_international}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
