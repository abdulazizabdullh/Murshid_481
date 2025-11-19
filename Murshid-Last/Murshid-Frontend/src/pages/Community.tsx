import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { PageAnimation } from "@/components/animations/PageAnimation";
import { ScrollAnimation } from "@/components/animations/ScrollAnimation";
import { 
  Search, 
  Plus, 
  MessageCircle, 
  Heart, 
  Eye, 
  CheckCircle,
  Filter,
  TrendingUp,
  FileText
} from 'lucide-react';
import { useI18n } from '@/contexts/I18nContext';
import { useAuth } from '@/contexts/AuthContext';
import type { Post } from '@/types/community';
import { toast } from 'sonner';
import { getCommunityPosts, getUserPostLike, likePost, unlikePost } from '@/lib/communityApi';
import { LikeButton } from '@/components/community/LikeButton';
import { formatTimeAgo } from '@/lib/timeUtils';
import { translateTagSync } from '@/lib/tagTranslation';

export default function Community() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'student' | 'specialist'>('all');
  const [loading, setLoading] = useState(true);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [timeRefresh, setTimeRefresh] = useState(0);
  const { language } = useI18n();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchPosts();
  }, [selectedFilter, searchQuery]);

  // Refresh posts when component mounts (e.g., returning from create post)
  useEffect(() => {
    const handleFocus = () => {
      fetchPosts();
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  // Load liked status for all posts
  useEffect(() => {
    if (user && posts.length > 0) {
      Promise.all(
        posts.map(post => getUserPostLike(post.id, user.id))
      ).then(likes => {
        const likedSet = new Set<string>();
        posts.forEach((post, idx) => {
          if (likes[idx]) {
            likedSet.add(post.id);
          }
        });
        setLikedPosts(likedSet);
      });
    }
  }, [user, posts.length]);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      let fetchedPosts = await getCommunityPosts({
        search: searchQuery.trim() || undefined,
      });
      
      console.log('Fetched posts:', fetchedPosts.length);
      console.log('Sample post roles:', fetchedPosts.slice(0, 5).map(p => ({ id: p.id, role: p.author_role })));
      
      // Filter by author role
      if (selectedFilter !== 'all') {
        console.log('Filtering by:', selectedFilter);
        fetchedPosts = fetchedPosts.filter(post => {
          console.log(`Post ${post.id}: author_role="${post.author_role}", matches: ${post.author_role === selectedFilter}`);
          return post.author_role === selectedFilter;
        });
        console.log('After filter:', fetchedPosts.length);
      }
      
      setPosts(fetchedPosts);
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast.error(language === 'ar' ? 'فشل تحميل المشاركات' : 'Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    navigate('/community/create');
  };

  // Auto-refresh time display every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeRefresh(prev => prev + 1);
    }, 60000); // 60 seconds

    return () => clearInterval(interval);
  }, []);

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
                  {language === 'ar' ? 'المجتمع الأكاديمي' : 'Academic Community'}
                </h1>
                <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-8" dir={language}>
                  {language === 'ar'
                    ? 'شارك الأسئلة والخبرات مع الطلاب والمختصين'
                    : 'Share questions and experiences with students and specialists'}
                </p>
                <div className="grid grid-cols-2 xl:flex xl:flex-row gap-4 justify-center max-w-4xl mx-auto">
                  <Button
                    onClick={handleCreatePost}
                    className="bg-blue-500 hover:bg-blue-600 text-white rounded-2xl px-8 py-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 w-full xl:w-auto"
                  >
                    <Plus className={`w-5 h-5 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
                    {language === 'ar' ? 'إنشاء منشور' : 'Create Post'}
                  </Button>
                  {user && (
                    <>
                      <Button
                        onClick={() => navigate('/community/my-posts')}
                        variant="outline"
                        className="rounded-2xl px-8 py-6 border-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 w-full xl:w-auto"
                      >
                        <FileText className={`w-5 h-5 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
                        {language === 'ar' ? 'منشوراتي' : 'My Posts'}
                      </Button>
                      <Button
                        onClick={() => navigate('/community/my-answers')}
                        variant="outline"
                        className="rounded-2xl px-8 py-6 border-2 hover:bg-green-50 dark:hover:bg-green-900/20 hover:text-green-600 dark:hover:text-green-400 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 w-full xl:w-auto"
                      >
                        <MessageCircle className={`w-5 h-5 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
                        {language === 'ar' ? 'إجاباتي' : 'My Answers'}
                      </Button>
                      <Button
                        onClick={() => navigate('/community/my-likes')}
                        variant="outline"
                        className="rounded-2xl px-8 py-6 border-2 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 w-full xl:w-auto"
                      >
                        <Heart className={`w-5 h-5 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
                        {language === 'ar' ? 'إعجاباتي' : 'My Likes'}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </ScrollAnimation>

            {/* Search and Filters */}
            <div className="max-w-4xl mx-auto mb-12 space-y-4">
              <div className="relative">
                <Search className={`absolute ${language === 'ar' ? 'right-4' : 'left-4'} top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5`} />
                <Input
                  type="text"
                  placeholder={language === 'ar' ? 'ابحث في المنشورات...' : 'Search posts...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`${language === 'ar' ? 'pr-12' : 'pl-12'} py-6 rounded-2xl border-0 bg-white dark:bg-gray-800 shadow-md`}
                  dir={language}
                />
              </div>

              <div className="flex gap-4 justify-center">
                {[
                  { id: 'all', label: language === 'ar' ? 'الكل' : 'All' },
                  { id: 'student', label: language === 'ar' ? 'الطلاب' : 'Students' },
                  { id: 'specialist', label: language === 'ar' ? 'المختصين' : 'Specialists' }
                ].map((filter) => (
                  <Button
                    key={filter.id}
                    variant={selectedFilter === filter.id ? 'default' : 'outline'}
                    onClick={() => setSelectedFilter(filter.id as any)}
                    className={`rounded-2xl px-6 py-3 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
                      selectedFilter === filter.id 
                        ? 'bg-blue-500 hover:bg-blue-600 text-white' 
                        : 'border-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400'
                    }`}
                  >
                    {filter.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Posts List */}
            <TooltipProvider>
              <div className="max-w-4xl mx-auto space-y-6">
                {loading ? (
                  <div className="text-center py-12">
                    <p className="text-gray-500">{language === 'ar' ? 'جاري التحميل...' : 'Loading...'}</p>
                  </div>
                ) : posts.length === 0 ? (
                  <Card className="p-12 text-center">
                    <div className="max-w-md mx-auto">
                      <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                        {selectedFilter === 'all' ? (
                          language === 'ar' ? 'لا توجد منشورات حتى الآن' : 'No posts yet'
                        ) : selectedFilter === 'student' ? (
                          language === 'ar' ? 'لا توجد منشورات من الطلاب' : 'No posts from students'
                        ) : (
                          language === 'ar' ? 'لا توجد منشورات من المختصين' : 'No posts from specialists'
                        )}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-6">
                        {selectedFilter === 'student' && user?.role === 'student' ? (
                          language === 'ar' 
                            ? 'كن أول من يطرح سؤالاً أو يبدأ نقاشاً!' 
                            : 'Be the first to ask a question or start a discussion!'
                        ) : selectedFilter === 'specialist' && user?.role === 'specialist' ? (
                          language === 'ar'
                            ? 'كن أول من يشارك خبرته مع المجتمع!'
                            : 'Be the first to share your expertise with the community!'
                        ) : selectedFilter === 'all' ? (
                          language === 'ar'
                            ? 'كن أول من ينشئ منشوراً في المجتمع!'
                            : 'Be the first to create a post in the community!'
                        ) : (
                          language === 'ar'
                            ? 'لا توجد منشورات متاحة لهذا الفلتر'
                            : 'No posts available for this filter'
                        )}
                      </p>
                      {((selectedFilter === 'student' && user?.role === 'student') || 
                        (selectedFilter === 'specialist' && user?.role === 'specialist') ||
                        selectedFilter === 'all') && (
                        <Button 
                          onClick={handleCreatePost}
                          className="rounded-xl bg-blue-500 hover:bg-blue-600"
                        >
                          <Plus className={`w-4 h-4 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
                          {language === 'ar' ? 'إنشاء منشور' : 'Create Post'}
                        </Button>
                      )}
                    </div>
                  </Card>
                ) : (
                  posts.map((post) => (
                  <ScrollAnimation key={post.id}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Card 
                          className={`p-6 card-hover cursor-pointer animate-pulse-glow ${
                            user && post.author_id === user.id ? '!border-2 !border-blue-500 dark:!border-blue-400' : ''
                          }`}
                          onClick={() => navigate(`/community/post/${post.id}`)}
                        >
                    <div className="flex items-start gap-4">
                      <Avatar 
                        className="w-12 h-12 cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/user/${post.author_id}`);
                        }}
                      >
                        <AvatarImage src={post.author_avatar} alt={post.author_name} />
                        <AvatarFallback className="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 font-semibold">
                          {post.author_name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span 
                            className="font-medium text-gray-900 dark:text-gray-100 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/user/${post.author_id}`);
                            }}
                          >
                            {post.author_name}
                          </span>
                          <Badge variant="secondary" className="text-xs">
                            {post.author_role === 'specialist' ? (language === 'ar' ? 'مختص' : 'Specialist') : 
                             post.author_role === 'student' ? (language === 'ar' ? 'طالب' : 'Student') : 
                             (language === 'ar' ? 'مدير' : 'Admin')}
                          </Badge>
                          <span className="text-sm text-gray-500">
                            {formatTimeAgo(post.created_at, language)}
                          </span>
                        </div>
                        {post.author_academic_level && (
                          <div className="mb-2">
                            <span className="text-xs text-gray-500">
                              {language === 'ar' ? 'المستوى الأكاديمي: ' : 'Academic Level: '}{post.author_academic_level}
                            </span>
                          </div>
                        )}
                        
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2" dir={language}>
                          {post.title}
                        </h3>
                        
                        <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-2" dir={language}>
                          {post.content}
                        </p>
                        
                        {((post.major_tags && post.major_tags.length > 0) || (post.university_tags && post.university_tags.length > 0) || (post.tags && post.tags.length > 0)) && (
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
                            {post.tags.map((tag) => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                        
                        <div className="flex items-center gap-6 text-sm text-gray-500" onClick={(e) => e.stopPropagation()}>
                          <LikeButton
                            itemId={post.id}
                            itemType="post"
                            initialLikesCount={post.likes_count || 0}
                            initialIsLiked={likedPosts.has(post.id)}
                            onLike={likePost}
                            onUnlike={unlikePost}
                            disabled={!user || !user.role || !user.gender}
                            onLikeChange={(postId, newCount, isLiked) => {
                              setPosts(prev => prev.map(p =>
                                p.id === postId ? { ...p, likes_count: newCount } : p
                              ));
                              setLikedPosts(prev => {
                                const newSet = new Set(prev);
                                if (isLiked) {
                                  newSet.add(postId);
                                } else {
                                  newSet.delete(postId);
                                }
                                return newSet;
                              });
                            }}
                          />
                          <div className="flex items-center gap-1">
                            <MessageCircle className="w-4 h-4" />
                            <span>{post.answers_count || 0}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Eye className="w-4 h-4" />
                            <span>{post.views_count || 0}</span>
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
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={5}>
                  <p>{language === 'ar' ? 'اضغط لعرض تفاصيل المنشور' : 'Click to view post details'}</p>
                </TooltipContent>
              </Tooltip>
            </ScrollAnimation>
          )))}
        </div>
      </TooltipProvider>
          </div>
        </div>
      </div>
    </PageAnimation>
  );
}
