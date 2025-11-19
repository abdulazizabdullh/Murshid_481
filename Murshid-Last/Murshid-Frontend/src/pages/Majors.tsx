import Navbar from "@/components/Navbar";
import { useState, useEffect } from 'react';
import { Search, Bookmark, BookmarkCheck } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageAnimation } from "@/components/animations/PageAnimation";
import { ScrollAnimation } from "@/components/animations/ScrollAnimation";
import { useI18n } from '@/contexts/I18nContext';
import { useNavigate } from 'react-router-dom';
import { getMajors } from '@/lib/majorsApi';
import { useBookmarks } from '@/hooks/useBookmarks';
import type { MajorWithUniversities, MajorCategory, DegreeType } from '@/types/database';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from '@/components/ui/skeleton';

export default function MajorsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<MajorCategory | 'all'>('all');
  const [selectedDegreeType, setSelectedDegreeType] = useState<DegreeType | 'all'>('all');
  const [majors, setMajors] = useState<MajorWithUniversities[]>([]);
  const [loading, setLoading] = useState(true);
  const { t, language } = useI18n();
  const navigate = useNavigate();
  const { toggleBookmark, isBookmarked } = useBookmarks();

  // Fetch majors from database
  useEffect(() => {
    fetchMajors();
  }, [selectedCategory, selectedDegreeType]);

  const fetchMajors = async () => {
    setLoading(true);
    try {
      const filters: any = {};
      if (selectedCategory !== 'all') filters.category = selectedCategory;
      if (selectedDegreeType !== 'all') filters.degree_type = selectedDegreeType;
      if (searchQuery) filters.search = searchQuery;

      const data = await getMajors(filters);
      setMajors(data);
    } catch (error) {
      console.error('Error fetching majors:', error);
      toast.error('Failed to load majors');
    } finally {
      setLoading(false);
    }
  };

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchMajors();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const categories: { id: MajorCategory | 'all', label: string }[] = [
    { id: 'all', label: t('categories.all') || 'All' },
    { id: 'Engineering', label: language === 'ar' ? 'الهندسة' : 'Engineering' },
    { id: 'Medicine', label: language === 'ar' ? 'الطب' : 'Medicine' },
    { id: 'Business', label: language === 'ar' ? 'الأعمال' : 'Business' },
    { id: 'IT', label: language === 'ar' ? 'تقنية المعلومات' : 'IT' },
    { id: 'Science', label: language === 'ar' ? 'العلوم' : 'Science' },
    { id: 'Arts', label: language === 'ar' ? 'الفنون' : 'Arts' },
    { id: 'Law', label: language === 'ar' ? 'القانون' : 'Law' },
    { id: 'Education', label: language === 'ar' ? 'التربية' : 'Education' },
    { id: 'Other', label: language === 'ar' ? 'أخرى' : 'Other' },
  ];

  const degreeTypes: { id: DegreeType | 'all', label: string }[] = [
    { id: 'all', label: language === 'ar' ? 'جميع الدرجات' : 'All Degrees' },
    { id: 'Bachelor', label: language === 'ar' ? 'بكالوريوس' : 'Bachelor' },
    { id: 'Master', label: language === 'ar' ? 'ماجستير' : 'Master' },
    { id: 'PhD', label: language === 'ar' ? 'دكتوراه' : 'PhD' },
    { id: 'Diploma', label: language === 'ar' ? 'دبلوم' : 'Diploma' },
  ];

  const handleBookmark = async (majorId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await toggleBookmark('major', majorId);
  };

  const handleStartTest = () => {
    navigate('/assessment');
  };

  const getCategoryColor = (category: MajorCategory): string => {
    const colors: Record<MajorCategory, string> = {
      'Engineering': 'from-blue-400 to-blue-500',
      'Medicine': 'from-red-400 to-red-500',
      'Business': 'from-green-400 to-green-500',
      'IT': 'from-purple-400 to-purple-500',
      'Science': 'from-cyan-400 to-cyan-500',
      'Arts': 'from-pink-400 to-pink-500',
      'Law': 'from-yellow-400 to-yellow-500',
      'Education': 'from-indigo-400 to-indigo-500',
      'Other': 'from-gray-400 to-gray-500',
    };
    return colors[category] || 'from-gray-400 to-gray-500';
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
                {language === 'ar' ? 'استكشف التخصصات' : 'Explore Majors'}
              </h1>
              <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto" dir={language}>
                {language === 'ar'
                  ? 'اكتشف التخصصات المتاحة واختر المسار المناسب لمستقبلك الأكاديمي'
                  : 'Discover available majors and choose the right path for your academic future'}
              </p>
            </div>
          </ScrollAnimation>

          {/* Search and Filters */}
          <div className="max-w-4xl mx-auto mb-12 space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className={`absolute ${language === 'ar' ? 'right-4' : 'left-4'} top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5`} />
              <Input
                id="majors-search-input"
                type="text"
                placeholder={language === 'ar' ? 'ابحث عن تخصص...' : 'Search for a major...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`${language === 'ar' ? 'pr-12' : 'pl-12'} py-6 rounded-2xl border-0 bg-white dark:bg-gray-800 shadow-md`}
                dir={language}
              />
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Select value={selectedCategory} onValueChange={(value) => setSelectedCategory(value as MajorCategory | 'all')}>
                <SelectTrigger id="majors-category-select" className="rounded-xl bg-white dark:bg-gray-800 border-0 shadow-md">
                  <SelectValue placeholder={language === 'ar' ? 'الفئة' : 'Category'} />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedDegreeType} onValueChange={(value) => setSelectedDegreeType(value as DegreeType | 'all')}>
                <SelectTrigger id="majors-degree-type-select" className="rounded-xl bg-white dark:bg-gray-800 border-0 shadow-md">
                  <SelectValue placeholder={language === 'ar' ? 'الدرجة العلمية' : 'Degree Type'} />
                </SelectTrigger>
                <SelectContent>
                  {degreeTypes.map((degree) => (
                    <SelectItem key={degree.id} value={degree.id}>
                      {degree.label}
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
                {language === 'ar' ? `عرض ${majors.length} تخصص` : `Showing ${majors.length} majors`}
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
                  <div className="flex gap-2">
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="h-6 w-24" />
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Majors Grid */}
          {!loading && majors.length > 0 && (
            <ScrollAnimation delay={0.2}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {majors.map((major, index) => {
                const bookmarked = isBookmarked('major', major.id);
                const majorName = language === 'ar' && major.name_ar ? major.name_ar : major.name;
                const majorDescription = language === 'ar' && major.description_ar ? major.description_ar : major.description;

                return (
                  <ScrollAnimation key={major.id} delay={index * 0.1}>
                    <Card
                      id={`majors-card-${major.id}`}
                      className="p-6 rounded-3xl shadow-md card-hover border-0 bg-white dark:bg-gray-800 cursor-pointer group relative"
                      onClick={() => navigate(`/majors/${major.id}`)}
                    >
                    {/* Bookmark Button */}
                    <button
                      onClick={(e) => handleBookmark(major.id, e)}
                      id={`majors-bookmark-${major.id}`}
                      className={`absolute top-4 ${language === 'ar' ? 'left-4' : 'right-4'} p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors z-10`}
                    >
                      {bookmarked ? (
                        <BookmarkCheck className="w-5 h-5 text-blue-500 fill-blue-500" />
                      ) : (
                        <Bookmark className="w-5 h-5 text-gray-400" />
                      )}
                    </button>

                    <div className={`w-20 h-20 bg-gradient-to-br ${getCategoryColor(major.category)} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg overflow-hidden`}>
                      {major.icon_name?.startsWith('http') ? (
                        <img 
                          src={major.icon_name} 
                          alt={majorName} 
                          className="w-full h-full object-contain p-3" 
                        />
                      ) : (
                        <span className="text-3xl text-white">{major.icon_name || '📚'}</span>
                      )}
                    </div>
                    
                    <h3 className={`text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2 ${language === 'ar' ? 'pl-8' : 'pr-8'}`} dir={language}>
                      {majorName}
                    </h3>
                    
                    <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-2" dir={language}>
                      {majorDescription || (language === 'ar' ? 'لا يوجد وصف متاح' : 'No description available')}
                    </p>
                    
                    <div className="flex flex-wrap gap-2 mb-4">
                      <span className="px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm">
                        {major.category}
                      </span>
                      {major.degree_type && (
                        <span className="px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-sm">
                          {major.degree_type}
                        </span>
                      )}
                      {major.duration_years && (
                        <span className="px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-sm">
                          {major.duration_years} {language === 'ar' ? 'سنوات' : 'years'}
                        </span>
                      )}
                    </div>
                    
                    <Button
                      variant="outline"
                      id={`majors-learn-more-${major.id}`}
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
          {!loading && majors.length === 0 && (
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
                ? 'خذ اختبارنا الشامل لاكتشاف التخصص المثالي بناءً على اهتماماتك ومهاراتك'
                : 'Take our comprehensive test to discover your ideal major based on your interests and skills'}
            </p>
            <Button 
              onClick={handleStartTest}
              id="majors-start-test-button"
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
