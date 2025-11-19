import Navbar from "@/components/Navbar";
import { useState, useEffect } from 'react';
import { Search, MapPin, Star, Users, Bookmark, BookmarkCheck, Building2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageAnimation } from "@/components/animations/PageAnimation";
import { ScrollAnimation } from "@/components/animations/ScrollAnimation";
import { useI18n } from '@/contexts/I18nContext';
import { useNavigate } from 'react-router-dom';
import { getUniversities, getUniversityCities } from '@/lib/universitiesApi';
import { useBookmarks } from '@/hooks/useBookmarks';
import type { UniversityWithMajors, UniversityType } from '@/types/database';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from '@/components/ui/skeleton';

export default function UniversitiesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<UniversityType | 'all'>('all');
  const [selectedCity, setSelectedCity] = useState<string>('all');
  const [universities, setUniversities] = useState<UniversityWithMajors[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const { t, language } = useI18n();
  const navigate = useNavigate();
  const { toggleBookmark, isBookmarked } = useBookmarks();

  // Fetch universities from database
  useEffect(() => {
    fetchUniversities();
    fetchCities();
  }, [selectedType, selectedCity]);

  const fetchUniversities = async () => {
    setLoading(true);
    try {
      const filters: any = {};
      if (selectedType !== 'all') filters.type = selectedType;
      if (selectedCity !== 'all') filters.city = selectedCity;
      if (searchQuery) filters.search = searchQuery;

      const data = await getUniversities(filters);
      setUniversities(data);
    } catch (error) {
      console.error('Error fetching universities:', error);
      toast.error('Failed to load universities');
    } finally {
      setLoading(false);
    }
  };

  const fetchCities = async () => {
    try {
      const citiesList = await getUniversityCities();
      setCities(citiesList);
    } catch (error) {
      console.error('Error fetching cities:', error);
    }
  };

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUniversities();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const universityTypes: { id: UniversityType | 'all', label: string }[] = [
    { id: 'all', label: language === 'ar' ? 'جميع الأنواع' : 'All Types' },
    { id: 'Public', label: language === 'ar' ? 'حكومية' : 'Public' },
    { id: 'Private', label: language === 'ar' ? 'أهلية' : 'Private' },
    { id: 'International', label: language === 'ar' ? 'دولية' : 'International' },
  ];

  const handleBookmark = async (universityId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await toggleBookmark('university', universityId);
  };

  const handleStartTest = () => {
    navigate('/assessment');
  };

  const getTypeColor = (type?: UniversityType): string => {
    const colors: Record<UniversityType, string> = {
      'Public': 'from-blue-400 to-blue-500',
      'Private': 'from-green-400 to-green-500',
      'International': 'from-purple-400 to-purple-500',
    };
    return type ? colors[type] : 'from-gray-400 to-gray-500';
  };

  const getLocalizedType = (type?: UniversityType): string | undefined => {
    if (!type) return undefined;
    if (language === 'ar') {
      const map: Record<UniversityType, string> = {
        Public: 'حكومية',
        Private: 'أهلية',
        International: 'دولية',
      };
      return map[type] ?? type;
    }
    return type;
  };

  return (
    <PageAnimation>
      <div className="min-h-screen bg-gradient-to-br from-[#e3e8ff] via-[#f5f7ff] to-[#cbd4ff] dark:from-[#0f172a] dark:via-[#1e2a4a] dark:to-[#2a3b6b]">
        <Navbar />
      
      <div className="py-20">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-10">
          {/* Header */}
          <ScrollAnimation>
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-gray-100 mb-4" dir={language}>
                {language === 'ar' ? 'استكشف الجامعات' : 'Explore Universities'}
              </h1>
              <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto" dir={language}>
                {language === 'ar'
                  ? 'اكتشف أفضل الجامعات في المملكة وابحث عن الخيار المناسب لك'
                  : 'Discover top universities in the Kingdom and find the right fit for you'}
              </p>
            </div>
          </ScrollAnimation>

          {/* Search and Filters */}
          <div className="max-w-4xl mx-auto mb-12 space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className={`absolute ${language === 'ar' ? 'right-4' : 'left-4'} top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5`} />
              <Input
                id="universities-search-input"
                type="text"
                placeholder={language === 'ar' ? 'ابحث عن جامعة...' : 'Search for a university...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`${language === 'ar' ? 'pr-12' : 'pl-12'} py-6 rounded-2xl border-0 bg-white dark:bg-gray-800 shadow-md`}
                dir={language}
              />
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Select value={selectedType} onValueChange={(value) => setSelectedType(value as UniversityType | 'all')}>
                <SelectTrigger id="universities-type-select" className="rounded-xl bg-white dark:bg-gray-800 border-0 shadow-md">
                  <SelectValue placeholder={language === 'ar' ? 'نوع الجامعة' : 'University Type'} />
                </SelectTrigger>
                <SelectContent>
                  {universityTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedCity} onValueChange={setSelectedCity}>
                <SelectTrigger id="universities-city-select" className="rounded-xl bg-white dark:bg-gray-800 border-0 shadow-md">
                  <SelectValue placeholder={language === 'ar' ? 'المدينة' : 'City'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{language === 'ar' ? 'جميع المدن' : 'All Cities'}</SelectItem>
                  {cities.map((city) => (
                    <SelectItem key={city} value={city}>
                      {city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Results Count */}
          {!loading && (
            <div className="text-center mb-8">
              <p className="text-gray-600 dark:text-gray-300" dir={language}>
                {language === 'ar' ? `عرض ${universities.length} جامعة` : `Showing ${universities.length} universities`}
              </p>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="p-6 rounded-3xl">
                  <Skeleton className="w-16 h-16 rounded-2xl mb-4" />
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-2/3 mb-4" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-28" />
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Universities Grid */}
          {!loading && universities.length > 0 && (
            <ScrollAnimation delay={0.2}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {universities.map((university, index) => {
                const bookmarked = isBookmarked('university', university.id);
                const universityName = language === 'ar' && university.name_ar ? university.name_ar : university.name;
                const universityDescription = language === 'ar' && university.description_ar ? university.description_ar : university.description;
                const universityLocation = language === 'ar' && university.location_ar ? university.location_ar : university.location;

                return (
                  <ScrollAnimation key={university.id} delay={index * 0.1}>
                    <Card
                      id={`universities-card-${university.id}`}
                      className="p-6 rounded-3xl shadow-md card-hover border-0 bg-white dark:bg-gray-800 cursor-pointer group relative h-full flex flex-col min-h-96"
                      onClick={() => navigate(`/universities/${university.id}`)}
                    >
                    {/* Bookmark Button */}
                    <button
                      onClick={(e) => handleBookmark(university.id, e)}
                      id={`universities-bookmark-${university.id}`}
                      className={`absolute top-4 ${language === 'ar' ? 'left-4' : 'right-4'} p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors z-10`}
                    >
                      {bookmarked ? (
                        <BookmarkCheck className="w-5 h-5 text-blue-500 fill-blue-500" />
                      ) : (
                        <Bookmark className="w-5 h-5 text-gray-400" />
                      )}
                    </button>

                    {/* University Logo or Icon */}
                    <div className={`w-20 h-20 bg-gradient-to-br ${getTypeColor(university.university_type)} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg overflow-hidden`}>
                      {university.logo_url ? (
                        <img 
                          src={`${university.logo_url}?t=${new Date(university.updated_at || Date.now()).getTime()}`} 
                          alt={universityName} 
                          className="w-full h-full object-cover" 
                          onError={(e) => {
                            // Fallback to icon if image fails to load
                            e.currentTarget.style.display = 'none';
                            const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                            if (fallback) fallback.style.display = 'block';
                          }}
                        />
                      ) : null}
                      <Building2 
                        className="w-10 h-10 text-white" 
                        style={{ display: university.logo_url ? 'none' : 'block' }}
                      />
                    </div>
                    
                    <h3 className={`text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2 ${language === 'ar' ? 'pl-8' : 'pr-8'} h-14 flex items-start`} dir={language}>
                      {universityName}
                    </h3>
                    
                    <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-2" dir={language}>
                      {universityDescription || (language === 'ar' ? 'لا يوجد وصف متاح' : 'No description available')}
                    </p>
                    
                    <div className="space-y-3 mb-4">
                      {university.city && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">{universityLocation || university.city}</span>
                        </div>
                      )}
                      
                      {Number(university.ranking_national ?? 0) > 0 && (
                        <div className="flex items-center gap-2">
                          <Star className="w-4 h-4 text-yellow-500 fill-current" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {language === 'ar' ? 'الترتيب المحلي: ' : 'National Rank: '}
                            #{university.ranking_national}
                          </span>
                        </div>
                      )}
                      
                      {Number(university.student_count ?? 0) > 0 && (
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {university.student_count.toLocaleString()}+ {language === 'ar' ? 'طالب' : 'Students'}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mb-4 flex-grow">
                      {university.university_type && (
                        <span className="px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm">
                          {getLocalizedType(university.university_type)}
                        </span>
                      )}
                      {Number(university.establishment_year ?? 0) > 0 && (
                        <span className="px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-sm">
                          {language === 'ar' ? `تأسست ${university.establishment_year}` : `Founded ${university.establishment_year}`}
                        </span>
                      )}
                      {Number(university.major_count ?? 0) > 0 && (
                        <span className="px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-sm">
                          {university.major_count} {language === 'ar' ? 'تخصص' : 'Majors'}
                        </span>
                      )}
                    </div>
                    
                    <Button
                      variant="outline"
                      id={`universities-learn-more-${university.id}`}
                      className="w-full rounded-2xl px-8 py-6 border-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400"
                      dir={language}
                    >
                      {language === 'ar' ? 'المزيد' : 'Learn More'} {language === 'ar' ? '←' : '→'}
                    </Button>
                  </Card>
                  </ScrollAnimation>
                );
              })}
            </div>
            </ScrollAnimation>
          )}

          {/* No Results */}
          {!loading && universities.length === 0 && (
            <div className="text-center py-20">
              <div className="w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-12 h-12 text-gray-400 dark:text-gray-500" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2" dir={language}>
                {language === 'ar' ? 'لم يتم العثور على نتائج' : 'No results found'}
              </h3>
              <p className="text-gray-600 dark:text-gray-300" dir={language}>
                {language === 'ar' ? 'جرب تغيير معايير البحث أو الفلاتر' : 'Try changing your search criteria or filters'}
              </p>
            </div>
          )}

          {/* CTA Section */}
          <ScrollAnimation delay={0.4}>
            <div className="mt-20 bg-[#cdd6ff] dark:bg-[#2a3b6b] rounded-3xl p-12 text-center shadow-xl">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4" dir={language}>
              {language === 'ar' ? 'لا تزال محتاراً؟' : 'Still Confused?'}
            </h2>
            <p className="text-gray-700 dark:text-gray-200 mb-6 max-w-2xl mx-auto" dir={language}>
              {language === 'ar' 
                ? 'خذ اختبارنا الشامل لاكتشاف أفضل الجامعات والتخصصات المناسبة لك'
                : 'Take our comprehensive test to discover the best universities and majors for you'}
            </p>
            <Button
              onClick={handleStartTest}
              id="universities-start-test-button"
              variant="outline"
              className="rounded-2xl px-8 py-6 border-2 bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 border-gray-200 dark:border-gray-700"
            >
              {language === 'ar' ? 'ابدأ الاختبار الآن' : 'Start Test Now'}
            </Button>
          </div>
        </ScrollAnimation>
        </div>
      </div>
    </div>
    </PageAnimation>
  );
}
