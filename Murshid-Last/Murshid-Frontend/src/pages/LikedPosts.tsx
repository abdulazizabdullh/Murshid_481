import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { formatTimeAgo } from '@/lib/timeUtils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageAnimation } from "@/components/animations/PageAnimation";
import { ScrollAnimation } from "@/components/animations/ScrollAnimation";
import { 
  Heart, 
  MessageCircle, 
  Eye, 
  CheckCircle,
  ArrowLeft
} from 'lucide-react';
import { useI18n } from '@/contexts/I18nContext';
import { useAuth } from '@/contexts/AuthContext';
import type { Post } from '@/types/community';
import { toast } from 'sonner';
import { translateTagSync } from '@/lib/tagTranslation';
import { getUserLikedPosts } from '@/lib/communityApi';

export default function LikedPosts() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRefresh, setTimeRefresh] = useState(0);
  const { language } = useI18n();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      fetchLikedPosts();
    } else {
      navigate('/login');
    }
  }, [user]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeRefresh(prev => prev + 1);
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchLikedPosts = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const likedPosts = await getUserLikedPosts(user.id);
      setPosts(likedPosts);
    } catch (error) {
      console.error('Error fetching liked posts:', error);
      toast.error(language === 'ar' ? 'فشل في تحميل المنشورات المفضلة' : 'Failed to load liked posts');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#e3e8ff] via-[#f5f7ff] to-[#cbd4ff] dark:from-[#0f172a] dark:via-[#1e2a4a] dark:to-[#2a3b6b]">
        <Navbar />
        <div className="py-20 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-300">
              {language === 'ar' ? 'جاري التحميل...' : 'Loading...'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <PageAnimation>
      <div className="min-h-screen bg-gradient-to-br from-[#e3e8ff] via-[#f5f7ff] to-[#cbd4ff] dark:from-[#0f172a] dark:via-[#1e2a4a] dark:to-[#2a3b6b]">
        <Navbar />
        
        <div className="py-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-10">
            {/* Header */}
            <div className="mb-8">
              <Button
                onClick={() => navigate('/community')}
                variant="ghost"
                className="mb-4"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                {language === 'ar' ? 'العودة إلى المجتمع' : 'Back to Community'}
              </Button>
              
              <div className="flex items-center gap-3 mb-2">
                <Heart className="w-8 h-8 text-red-500 fill-red-500" />
                <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">
                  {language === 'ar' ? 'المنشورات المفضلة' : 'Liked Posts'}
                </h1>
              </div>
              <p className="text-gray-600 dark:text-gray-300 mb-2">
                {language === 'ar' 
                  ? `${posts.length} منشور قمت بالإعجاب به` 
                  : `${posts.length} posts you liked`}
              </p>
              <p className="text-sm text-pink-600 dark:text-pink-400" dir={language}>
                {language === 'ar' 
                  ? 'انقر على أي منشور للانتقال إليه'
                  : 'Click on any post to go to it'}
              </p>
            </div>

            {/* Posts Grid */}
            {posts.length === 0 ? (
              <Card className="p-12 text-center">
                <Heart className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  {language === 'ar' ? 'لا توجد منشورات مفضلة' : 'No Liked Posts Yet'}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  {language === 'ar' 
                    ? 'ابدأ بالإعجاب بالمنشورات لتظهر هنا' 
                    : 'Start liking posts to see them here'}
                </p>
                <Button onClick={() => navigate('/community')}>
                  {language === 'ar' ? 'تصفح المجتمع' : 'Browse Community'}
                </Button>
              </Card>
            ) : (
              <div className="grid gap-6">
                {posts.map((post, index) => (
                  <ScrollAnimation key={post.id} delay={index * 0.1}>
                    <Card 
                      className="p-6 hover:shadow-lg transition-all duration-300 cursor-pointer card-hover"
                      onClick={() => navigate(`/community/post/${post.id}`)}
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-blue-600 dark:text-blue-400 font-semibold">
                            {post.author_name.charAt(0)}
                          </span>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <span className="font-medium text-gray-900 dark:text-gray-100">
                              {post.author_name}
                            </span>
                            <Badge variant="secondary" className="text-xs">
                              {post.author_role === 'specialist' ? (language === 'ar' ? 'مختص' : 'Specialist') : 
                               post.author_role === 'student' ? (language === 'ar' ? 'طالب' : 'Student') : 
                               (language === 'ar' ? 'مدير' : 'Admin')}
                            </Badge>
                            {post.author_university && (
                              <Badge variant="outline" className="text-xs">
                                🏛️ {post.author_university}
                              </Badge>
                            )}
                            {post.author_major && (
                              <Badge variant="outline" className="text-xs">
                                📚 {post.author_major}
                              </Badge>
                            )}
                            <span className="text-sm text-gray-500">
                              {formatTimeAgo(post.created_at, language)}
                            </span>
                          </div>
                          
                          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors" dir={language}>
                            {post.title}
                          </h3>
                          
                          <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-2" dir={language}>
                            {post.content}
                          </p>
                          
                          <div className="flex flex-wrap gap-2 mb-4">
                            {post.major_tags?.map((tag) => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                📚 {translateTagSync(tag, language)}
                              </Badge>
                            ))}
                            {post.university_tags?.map((tag) => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                🏛️ {translateTagSync(tag, language)}
                              </Badge>
                            ))}
                            {post.tags?.map((tag) => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                          
                          <div className="flex items-center gap-6 text-sm text-gray-500">
                            <div className="flex items-center gap-1">
                              <Heart className="w-4 h-4 fill-red-500 text-red-500" />
                              <span>{post.likes_count}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <MessageCircle className="w-4 h-4" />
                              <span>{post.answers_count}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Eye className="w-4 h-4" />
                              <span>{post.views_count}</span>
                            </div>
                            {post.is_solved && (
                              <div className="flex items-center gap-1 text-green-600">
                                <CheckCircle className="w-4 h-4" />
                                <span>{language === 'ar' ? 'محلول' : 'Solved'}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  </ScrollAnimation>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </PageAnimation>
  );
}
