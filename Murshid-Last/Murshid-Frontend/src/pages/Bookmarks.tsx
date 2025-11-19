import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Bookmark, 
  Building2, 
  BookOpen, 
  Trash2,
  ArrowRight,
  Star,
  MapPin
} from 'lucide-react';
import { useBookmarks } from '@/hooks/useBookmarks';
import { useI18n } from '@/contexts/I18nContext';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Bookmarks() {
  const navigate = useNavigate();
  const { language } = useI18n();
  const { user } = useAuth();
  const { 
    bookmarkedUniversities, 
    bookmarkedMajors, 
    loading, 
    toggleBookmark 
  } = useBookmarks();

  // Redirect if not logged in or guest
  if (!user || user.id === 'guest') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#e3e8ff] via-[#f5f7ff] to-[#cbd4ff] dark:from-[#0f172a] dark:via-[#1e2a4a] dark:to-[#2a3b6b]">
        <Navbar />
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-10 py-20">
          <div className="text-center">
            <Bookmark className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              {language === 'ar' ? 'قم بتسجيل الدخول لرؤية العناصر المحفوظة' : 'Login to See Your Bookmarks'}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {language === 'ar' 
                ? 'يجب عليك تسجيل الدخول لحفظ الجامعات والتخصصات المفضلة لديك'
                : 'You need to be logged in to save your favorite universities and majors'}
            </p>
            <Button 
              onClick={() => navigate('/login')} 
              id="bookmarks-login-button"
              className="bg-blue-500 hover:bg-blue-600 text-white rounded-2xl px-8 py-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
            >
              {language === 'ar' ? 'تسجيل الدخول' : 'Login'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const handleRemoveBookmark = async (itemType: 'university' | 'major', itemId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await toggleBookmark(itemType, itemId);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#e3e8ff] via-[#f5f7ff] to-[#cbd4ff] dark:from-[#0f172a] dark:via-[#1e2a4a] dark:to-[#2a3b6b]">
      <Navbar />
      
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-10 py-20">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full mb-4">
            <Bookmark className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-gray-100 mb-4" dir={language}>
            {language === 'ar' ? 'العناصر المحفوظة' : 'My Bookmarks'}
          </h1>
          <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto" dir={language}>
            {language === 'ar' 
              ? 'جميع الجامعات والتخصصات التي حفظتها في مكان واحد'
              : 'All your saved universities and majors in one place'}
          </p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-3 mb-8">
            <TabsTrigger value="all" id="bookmarks-tab-all">
              {language === 'ar' ? 'الكل' : 'All'} ({bookmarkedUniversities.length + bookmarkedMajors.length})
            </TabsTrigger>
            <TabsTrigger value="universities" id="bookmarks-tab-universities">
              {language === 'ar' ? 'الجامعات' : 'Universities'} ({bookmarkedUniversities.length})
            </TabsTrigger>
            <TabsTrigger value="majors" id="bookmarks-tab-majors">
              {language === 'ar' ? 'التخصصات' : 'Majors'} ({bookmarkedMajors.length})
            </TabsTrigger>
          </TabsList>

          {/* All Tab */}
          <TabsContent value="all" className="space-y-8">
            {/* Universities Section */}
            {bookmarkedUniversities.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-2" dir={language}>
                  <Building2 className="w-6 h-6" />
                  {language === 'ar' ? 'الجامعات' : 'Universities'}
                  <span className="text-gray-500">({bookmarkedUniversities.length})</span>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {bookmarkedUniversities.map((university) => {
                    const universityName = language === 'ar' && university.name_ar ? university.name_ar : university.name;
                    const universityLocation = language === 'ar' && university.location_ar ? university.location_ar : university.location;
                    
                    return (
                      <Card
                        key={university.id}
                        id={`bookmarks-university-card-${university.id}`}
                        className="p-6 hover:shadow-xl transition-shadow cursor-pointer relative group"
                        onClick={() => navigate(`/universities/${university.id}`)}
                      >
                        {/* Remove Button */}
                        <button
                          onClick={(e) => handleRemoveBookmark('university', university.id, e)}
                          id={`bookmarks-remove-university-${university.id}`}
                          className="absolute top-4 right-4 p-2 rounded-full bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors opacity-0 group-hover:opacity-100 z-10"
                          title={language === 'ar' ? 'إزالة' : 'Remove'}
                        >
                          <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                        </button>

                        <div className="flex items-start gap-4">
                          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
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
                              className="w-8 h-8 text-blue-600 dark:text-blue-400" 
                              style={{ display: university.logo_url ? 'none' : 'block' }}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2 pr-8" dir={language}>
                              {universityName}
                            </h3>
                            {university.city && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1 mb-2">
                                <MapPin className="w-3 h-3" />
                                {universityLocation || university.city}
                              </p>
                            )}
                            <div className="flex flex-wrap gap-2">
                              {university.university_type && (
                                <Badge variant="secondary" className="text-xs">
                                  {university.university_type}
                                </Badge>
                              )}
                              {university.ranking_national && (
                                <Badge variant="outline" className="text-xs">
                                  <Star className="w-3 h-3 mr-1 fill-yellow-500 text-yellow-500" />
                                  #{university.ranking_national}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Majors Section */}
            {bookmarkedMajors.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-2" dir={language}>
                  <BookOpen className="w-6 h-6" />
                  {language === 'ar' ? 'التخصصات' : 'Majors'}
                  <span className="text-gray-500">({bookmarkedMajors.length})</span>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {bookmarkedMajors.map((major) => {
                    const majorName = language === 'ar' && major.name_ar ? major.name_ar : major.name;
                    
                    return (
                      <Card
                        key={major.id}
                        id={`bookmarks-major-card-${major.id}`}
                        className="p-6 hover:shadow-xl transition-shadow cursor-pointer relative group"
                        onClick={() => navigate(`/majors/${major.id}`)}
                      >
                        {/* Remove Button */}
                        <button
                          onClick={(e) => handleRemoveBookmark('major', major.id, e)}
                          id={`bookmarks-remove-major-${major.id}`}
                          className="absolute top-4 right-4 p-2 rounded-full bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors opacity-0 group-hover:opacity-100 z-10"
                          title={language === 'ar' ? 'إزالة' : 'Remove'}
                        >
                          <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                        </button>

                        <div className="flex items-start gap-4">
                          <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center text-3xl flex-shrink-0 overflow-hidden">
                            {major.icon_name?.startsWith('http') ? (
                              <img src={major.icon_name} alt={majorName} className="w-full h-full object-cover" />
                            ) : (
                              <span>{major.icon_name || '📚'}</span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2 pr-8" dir={language}>
                              {majorName}
                            </h3>
                            <div className="flex flex-wrap gap-2">
                              <Badge variant="secondary" className="text-xs">
                                {major.category}
                              </Badge>
                              {major.degree_type && (
                                <Badge variant="outline" className="text-xs">
                                  {major.degree_type}
                                </Badge>
                              )}
                              {major.duration_years && (
                                <Badge variant="outline" className="text-xs">
                                  {major.duration_years} {language === 'ar' ? 'سنوات' : 'years'}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Empty State - All */}
            {bookmarkedUniversities.length === 0 && bookmarkedMajors.length === 0 && !loading && (
              <div className="text-center py-20">
                <Bookmark className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2" dir={language}>
                  {language === 'ar' ? 'لا توجد عناصر محفوظة بعد' : 'No Bookmarks Yet'}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6" dir={language}>
                  {language === 'ar' 
                    ? 'ابدأ بحفظ الجامعات والتخصصات المفضلة لديك'
                    : 'Start bookmarking your favorite universities and majors'}
                </p>
                <div className="flex gap-4 justify-center">
                  <Button 
                    onClick={() => navigate('/universities')} 
                    id="bookmarks-browse-universities-button"
                    className="bg-blue-500 hover:bg-blue-600 text-white rounded-2xl px-8 py-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
                  >
                    {language === 'ar' ? 'تصفح الجامعات' : 'Browse Universities'}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                  <Button 
                    onClick={() => navigate('/majors')} 
                    id="bookmarks-browse-majors-button" 
                    variant="outline"
                    className="rounded-2xl px-8 py-6 border-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
                  >
                    {language === 'ar' ? 'تصفح التخصصات' : 'Browse Majors'}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}

            {/* Loading State */}
            {loading && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Card key={i} className="p-6">
                    <div className="flex items-start gap-4">
                      <Skeleton className="w-16 h-16 rounded-lg" />
                      <div className="flex-1">
                        <Skeleton className="h-6 w-3/4 mb-2" />
                        <Skeleton className="h-4 w-1/2 mb-2" />
                        <div className="flex gap-2">
                          <Skeleton className="h-6 w-16" />
                          <Skeleton className="h-6 w-16" />
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Universities Only Tab */}
          <TabsContent value="universities">
            {bookmarkedUniversities.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {bookmarkedUniversities.map((university) => {
                  const universityName = language === 'ar' && university.name_ar ? university.name_ar : university.name;
                  const universityLocation = language === 'ar' && university.location_ar ? university.location_ar : university.location;
                  
                  return (
                    <Card
                      key={university.id}
                      id={`bookmarks-tab-universities-card-${university.id}`}
                      className="p-6 hover:shadow-xl transition-shadow cursor-pointer relative group"
                      onClick={() => navigate(`/universities/${university.id}`)}
                    >
                      <button
                        onClick={(e) => handleRemoveBookmark('university', university.id, e)}
                        id={`bookmarks-tab-universities-remove-${university.id}`}
                        className="absolute top-4 right-4 p-2 rounded-full bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors opacity-0 group-hover:opacity-100 z-10"
                        title={language === 'ar' ? 'إزالة' : 'Remove'}
                      >
                        <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                      </button>

                      <div className="flex items-start gap-4">
                        <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
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
                            className="w-8 h-8 text-blue-600 dark:text-blue-400" 
                            style={{ display: university.logo_url ? 'none' : 'block' }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2 pr-8" dir={language}>
                            {universityName}
                          </h3>
                          {university.city && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1 mb-2">
                              <MapPin className="w-3 h-3" />
                              {universityLocation || university.city}
                            </p>
                          )}
                          <div className="flex flex-wrap gap-2">
                            {university.university_type && (
                              <Badge variant="secondary" className="text-xs">
                                {university.university_type}
                              </Badge>
                            )}
                            {university.ranking_national && (
                              <Badge variant="outline" className="text-xs">
                                <Star className="w-3 h-3 mr-1 fill-yellow-500 text-yellow-500" />
                                #{university.ranking_national}
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
              <div className="text-center py-20">
                <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2" dir={language}>
                  {language === 'ar' ? 'لا توجد جامعات محفوظة' : 'No Universities Bookmarked'}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6" dir={language}>
                  {language === 'ar' 
                    ? 'ابدأ بحفظ الجامعات المفضلة لديك'
                    : 'Start bookmarking your favorite universities'}
                </p>
                <Button 
                  onClick={() => navigate('/universities')} 
                  id="bookmarks-tab-universities-browse-button"
                  className="bg-blue-500 hover:bg-blue-600 text-white rounded-2xl px-8 py-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
                >
                  {language === 'ar' ? 'تصفح الجامعات' : 'Browse Universities'}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Majors Only Tab */}
          <TabsContent value="majors">
            {bookmarkedMajors.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {bookmarkedMajors.map((major) => {
                  const majorName = language === 'ar' && major.name_ar ? major.name_ar : major.name;
                  
                  return (
                    <Card
                      key={major.id}
                      id={`bookmarks-tab-majors-card-${major.id}`}
                      className="p-6 hover:shadow-xl transition-shadow cursor-pointer relative group"
                      onClick={() => navigate(`/majors/${major.id}`)}
                    >
                      <button
                        onClick={(e) => handleRemoveBookmark('major', major.id, e)}
                        id={`bookmarks-tab-majors-remove-${major.id}`}
                        className="absolute top-4 right-4 p-2 rounded-full bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors opacity-0 group-hover:opacity-100 z-10"
                        title={language === 'ar' ? 'إزالة' : 'Remove'}
                      >
                        <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                      </button>

                      <div className="flex items-start gap-4">
                        <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center text-3xl flex-shrink-0 overflow-hidden">
                          {major.icon_name?.startsWith('http') ? (
                            <img src={major.icon_name} alt={majorName} className="w-full h-full object-cover" />
                          ) : (
                            <span>{major.icon_name || '📚'}</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2 pr-8" dir={language}>
                            {majorName}
                          </h3>
                          <div className="flex flex-wrap gap-2">
                            <Badge variant="secondary" className="text-xs">
                              {major.category}
                            </Badge>
                            {major.degree_type && (
                              <Badge variant="outline" className="text-xs">
                                {major.degree_type}
                              </Badge>
                            )}
                            {major.duration_years && (
                              <Badge variant="outline" className="text-xs">
                                {major.duration_years} {language === 'ar' ? 'سنوات' : 'years'}
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
              <div className="text-center py-20">
                <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2" dir={language}>
                  {language === 'ar' ? 'لا توجد تخصصات محفوظة' : 'No Majors Bookmarked'}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6" dir={language}>
                  {language === 'ar' 
                    ? 'ابدأ بحفظ التخصصات المفضلة لديك'
                    : 'Start bookmarking your favorite majors'}
                </p>
                <Button 
                  onClick={() => navigate('/majors')} 
                  id="bookmarks-tab-majors-browse-button"
                  className="bg-blue-500 hover:bg-blue-600 text-white rounded-2xl px-8 py-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
                >
                  {language === 'ar' ? 'تصفح التخصصات' : 'Browse Majors'}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

