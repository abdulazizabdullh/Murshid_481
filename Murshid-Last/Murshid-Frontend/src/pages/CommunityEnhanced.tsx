import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { formatTimeAgo } from '@/lib/timeUtils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
  Bookmark,
  Share2,
  Send,
  X,
  BookmarkCheck,
  FileQuestion
} from 'lucide-react';
import { useI18n } from '@/contexts/I18nContext';
import { useAuth } from '@/contexts/AuthContext';
import type { Post } from '@/types/community';
import { toast } from 'sonner';
import { getCommunityPosts } from '@/lib/communityApi';

export default function CommunityEnhanced() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'questions' | 'discussions'>('all');
  const [selectedView, setSelectedView] = useState<'all' | 'bookmarked' | 'myQuestions'>('all');
  const [loading, setLoading] = useState(true);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [bookmarkedPosts, setBookmarkedPosts] = useState<Set<string>>(new Set());
  const [quickReplyPost, setQuickReplyPost] = useState<Post | null>(null);
  const [quickReplyContent, setQuickReplyContent] = useState('');
  const [timeRefresh, setTimeRefresh] = useState(0);
  const { language } = useI18n();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchPosts();
    loadUserInteractions();
  }, [selectedFilter, searchQuery]);

  useEffect(() => {
    const handleFocus = () => {
      fetchPosts();
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeRefresh(prev => prev + 1);
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const loadUserInteractions = () => {
    if (user) {
      const liked = localStorage.getItem(`liked_posts_${user.id}`);
      const bookmarked = localStorage.getItem(`bookmarked_posts_${user.id}`);
      if (liked) setLikedPosts(new Set(JSON.parse(liked)));
      if (bookmarked) setBookmarkedPosts(new Set(JSON.parse(bookmarked)));
    }
  };

  const saveUserInteractions = (liked: Set<string>, bookmarked: Set<string>) => {
    if (user) {
      localStorage.setItem(`liked_posts_${user.id}`, JSON.stringify([...liked]));
      localStorage.setItem(`bookmarked_posts_${user.id}`, JSON.stringify([...bookmarked]));
    }
  };

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const fetchedPosts = await getCommunityPosts({
        type: selectedFilter,
        search: searchQuery.trim() || undefined,
      });
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

  const handleLikePost = (postId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      navigate('/login');
      return;
    }

    const newLikedPosts = new Set(likedPosts);
    if (newLikedPosts.has(postId)) {
      newLikedPosts.delete(postId);
      setPosts(posts.map(p => p.id === postId ? { ...p, likes_count: p.likes_count - 1 } : p));
    } else {
      newLikedPosts.add(postId);
      setPosts(posts.map(p => p.id === postId ? { ...p, likes_count: p.likes_count + 1 } : p));
    }
    setLikedPosts(newLikedPosts);
    saveUserInteractions(newLikedPosts, bookmarkedPosts);
  };

  const handleBookmarkPost = (postId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      navigate('/login');
      return;
    }

    const newBookmarkedPosts = new Set(bookmarkedPosts);
    if (newBookmarkedPosts.has(postId)) {
      newBookmarkedPosts.delete(postId);
      toast.success(language === 'ar' ? 'تم إزالة الإشارة المرجعية' : 'Bookmark removed');
    } else {
      newBookmarkedPosts.add(postId);
      toast.success(language === 'ar' ? 'تم الإضافة إلى الإشارات المرجعية' : 'Added to bookmarks');
    }
    setBookmarkedPosts(newBookmarkedPosts);
    saveUserInteractions(likedPosts, newBookmarkedPosts);
  };

  const handleSharePost = (post: Post, e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/community/post/${post.id}`;
    if (navigator.share) {
      navigator.share({
        title: post.title,
        text: post.content,
        url: url,
      });
    } else {
      navigator.clipboard.writeText(url);
      toast.success(language === 'ar' ? 'تم نسخ الرابط' : 'Link copied to clipboard');
    }
  };

  const handleQuickReply = (post: Post, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      navigate('/login');
      return;
    }
    setQuickReplyPost(post);
  };

  const submitQuickReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickReplyContent.trim() || !quickReplyPost) return;

    // Navigate to post detail to submit the reply
    navigate(`/community/post/${quickReplyPost.id}`, { 
      state: { quickReply: quickReplyContent } 
    });
    setQuickReplyPost(null);
    setQuickReplyContent('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submitQuickReply(e as any);
    }
  };

  const extractHashtags = (text: string) => {
    const hashtagRegex = /#[\u0600-\u06FFa-zA-Z0-9_]+/g;
    return text.match(hashtagRegex) || [];
  };

  const filteredPosts = posts.filter(post => {
    if (selectedView === 'bookmarked') {
      return bookmarkedPosts.has(post.id);
    }
    if (selectedView === 'myQuestions') {
      return post.author_id === user?.id;
    }
    return true;
  });

  return (
    <PageAnimation>
      <div className="min-h-screen bg-gradient-to-br from-[#e3e8ff] via-[#f5f7ff] to-[#cbd4ff] dark:from-[#0f172a] dark:via-[#1e2a4a] dark:to-[#2a3b6b]">
        <Navbar />
        
        {/* Quick Reply Modal */}
        {quickReplyPost && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                    {language === 'ar' ? 'رد سريع' : 'Quick Reply'}
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setQuickReplyPost(null)}
                    className="rounded-full"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>

                <Card className="p-4 mb-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    {quickReplyPost.title}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3">
                    {quickReplyPost.content}
                  </p>
                </Card>

                <form onSubmit={submitQuickReply}>
                  <Textarea
                    value={quickReplyContent}
                    onChange={(e) => setQuickReplyContent(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder={language === 'ar' ? 'اكتب ردك هنا... (اضغط Enter للإرسال)' : 'Type your reply... (Press Enter to send)'}
                    className="rounded-xl min-h-32 mb-4"
                    dir={language}
                    autoFocus
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setQuickReplyPost(null)}
                      className="rounded-xl"
                    >
                      {language === 'ar' ? 'إلغاء' : 'Cancel'}
                    </Button>
                    <Button
                      type="submit"
                      className="rounded-xl bg-blue-500 hover:bg-blue-600"
                      disabled={!quickReplyContent.trim()}
                    >
                      <Send className="w-4 h-4 mr-2" />
                      {language === 'ar' ? 'إرسال' : 'Send'}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

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
                <div className="flex gap-4 justify-center">
                  <Button
                    onClick={handleCreatePost}
                    className="bg-blue-500 hover:bg-blue-600 text-white rounded-2xl px-8 py-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    {language === 'ar' ? 'إنشاء منشور' : 'Create Post'}
                  </Button>
                  {user && (
                    <>
                      <Button
                        onClick={() => setSelectedView('bookmarked')}
                        variant={selectedView === 'bookmarked' ? 'default' : 'outline'}
                        className={`rounded-2xl px-8 py-6 border-2 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
                          selectedView === 'bookmarked'
                            ? 'bg-blue-500 hover:bg-blue-600 text-white'
                            : 'hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400'
                        }`}
                      >
                        <BookmarkCheck className="w-5 h-5 mr-2" />
                        {language === 'ar' ? 'المحفوظات' : 'Bookmarks'}
                      </Button>
                      <Button
                        onClick={() => setSelectedView('myQuestions')}
                        variant={selectedView === 'myQuestions' ? 'default' : 'outline'}
                        className={`rounded-2xl px-8 py-6 border-2 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
                          selectedView === 'myQuestions'
                            ? 'bg-blue-500 hover:bg-blue-600 text-white'
                            : 'hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400'
                        }`}
                      >
                        <FileQuestion className="w-5 h-5 mr-2" />
                        {language === 'ar' ? 'أسئلتي' : 'My Questions'}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </ScrollAnimation>

            {/* Two Column Layout */}
            <div className="grid lg:grid-cols-4 gap-8">
              {/* Filters Sidebar */}
              <div className="lg:col-span-1">
                <Card className="p-6 sticky top-24">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                    <Filter className="w-5 h-5" />
                    {language === 'ar' ? 'الفلاتر' : 'Filters'}
                  </h3>
                  
                  {/* Search */}
                  <div className="relative mb-6">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      type="text"
                      placeholder={language === 'ar' ? 'بحث...' : 'Search...'}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 rounded-xl"
                    />
                  </div>

                  {/* Type Filters */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {language === 'ar' ? 'النوع' : 'Type'}
                    </h4>
                    {[
                      { id: 'all', label: language === 'ar' ? 'الكل' : 'All', icon: TrendingUp },
                      { id: 'questions', label: language === 'ar' ? 'الأسئلة' : 'Questions', icon: MessageCircle },
                      { id: 'discussions', label: language === 'ar' ? 'النقاشات' : 'Discussions', icon: MessageCircle }
                    ].map((filter) => {
                      const Icon = filter.icon;
                      return (
                        <Button
                          key={filter.id}
                          variant={selectedFilter === filter.id ? 'default' : 'ghost'}
                          onClick={() => setSelectedFilter(filter.id as any)}
                          className={`w-full justify-start rounded-xl transition-all duration-300 ${
                            selectedFilter === filter.id
                              ? 'bg-blue-500 hover:bg-blue-600 text-white'
                              : 'hover:bg-blue-50 dark:hover:bg-blue-900/20'
                          }`}
                        >
                          <Icon className="w-4 h-4 mr-2" />
                          {filter.label}
                        </Button>
                      );
                    })}
                  </div>

                  {/* View Filters */}
                  {user && (
                    <div className="space-y-2 mt-6">
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {language === 'ar' ? 'العرض' : 'View'}
                      </h4>
                      <Button
                        variant={selectedView === 'all' ? 'default' : 'ghost'}
                        onClick={() => setSelectedView('all')}
                        className={`w-full justify-start rounded-xl transition-all duration-300 ${
                          selectedView === 'all'
                            ? 'bg-blue-500 hover:bg-blue-600 text-white'
                            : 'hover:bg-blue-50 dark:hover:bg-blue-900/20'
                        }`}
                      >
                        {language === 'ar' ? 'جميع المنشورات' : 'All Posts'}
                      </Button>
                    </div>
                  )}
                </Card>
              </div>

              {/* Posts Feed */}
              <div className="lg:col-span-3 space-y-6">
                {loading ? (
                  <div className="text-center py-20">
                    <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-300">
                      {language === 'ar' ? 'جاري التحميل...' : 'Loading...'}
                    </p>
                  </div>
                ) : filteredPosts.length === 0 ? (
                  <Card className="p-12 text-center">
                    <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                      {language === 'ar' ? 'لا توجد منشورات' : 'No posts found'}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300">
                      {language === 'ar' ? 'كن أول من يبدأ المحادثة!' : 'Be the first to start a conversation!'}
                    </p>
                  </Card>
                ) : (
                  filteredPosts.map((post) => {
                    const isLiked = likedPosts.has(post.id);
                    const isBookmarked = bookmarkedPosts.has(post.id);
                    const isOwnPost = post.author_id === user?.id;
                    const hashtags = extractHashtags(post.content);

                    return (
                      <ScrollAnimation key={post.id}>
                        <Card 
                          className={`p-6 cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
                            isOwnPost ? 'border-2 border-blue-500 dark:border-blue-400' : ''
                          }`}
                          onClick={() => navigate(`/community/post/${post.id}`)}
                        >
                          {isOwnPost && (
                            <Badge className="mb-2 bg-blue-500">
                              {language === 'ar' ? 'منشورك' : 'Your Post'}
                            </Badge>
                          )}
                          
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center shadow-md">
                              <span className="text-white font-semibold text-lg">
                                {post.author_name.charAt(0)}
                              </span>
                            </div>
                            
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2 flex-wrap">
                                <span className="font-medium text-gray-900 dark:text-gray-100">
                                  {post.author_name}
                                </span>
                                <Badge 
                                  variant="secondary" 
                                  className={`text-xs ${
                                    post.author_role === 'specialist' 
                                      ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
                                      : post.author_role === 'admin'
                                      ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                                      : 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                                  }`}
                                >
                                  {post.author_role === 'specialist' ? (language === 'ar' ? 'مختص' : 'Specialist') : 
                                   post.author_role === 'student' ? (language === 'ar' ? 'طالب' : 'Student') : 
                                   (language === 'ar' ? 'مدير' : 'Admin')}
                                </Badge>
                                <span className="text-sm text-gray-500">
                                  {formatTimeAgo(post.created_at, language)}
                                </span>
                              </div>
                              
                              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2" dir={language}>
                                {post.title}
                              </h3>
                              
                              <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-2" dir={language}>
                                {post.content}
                              </p>
                              
                              {/* Hashtags */}
                              {hashtags.length > 0 && (
                                <div className="flex flex-wrap gap-2 mb-4">
                                  {hashtags.map((tag, idx) => (
                                    <Badge 
                                      key={idx} 
                                      variant="outline" 
                                      className="text-xs cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSearchQuery(tag);
                                      }}
                                    >
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                              )}

                              {/* Tags */}
                              <div className="flex flex-wrap gap-2 mb-4">
                                {post.major_tags?.map((tag) => (
                                  <Badge key={tag} variant="outline" className="text-xs">
                                    📚 {tag}
                                  </Badge>
                                ))}
                                {post.university_tags?.map((tag) => (
                                  <Badge key={tag} variant="outline" className="text-xs">
                                    🏛️ {tag}
                                  </Badge>
                                ))}
                                {post.tags.map((tag) => (
                                  <Badge key={tag} variant="secondary" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                              
                              {/* Interaction Buttons */}
                              <div className="flex items-center gap-4 text-sm">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => handleLikePost(post.id, e)}
                                  className={`flex items-center gap-1 transition-all duration-300 hover:scale-110 ${
                                    isLiked 
                                      ? 'text-red-500 hover:text-red-600' 
                                      : 'text-gray-500 hover:text-red-500'
                                  }`}
                                >
                                  <Heart 
                                    className={`w-4 h-4 transition-all duration-300 ${
                                      isLiked ? 'fill-red-500' : ''
                                    }`} 
                                  />
                                  <span className="font-medium">{post.likes_count}</span>
                                </Button>
                                
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => handleQuickReply(post, e)}
                                  className="flex items-center gap-1 text-gray-500 hover:text-blue-500 transition-all duration-300 hover:scale-110"
                                >
                                  <MessageCircle className="w-4 h-4" />
                                  <span className="font-medium">{post.answers_count}</span>
                                </Button>
                                
                                <div className="flex items-center gap-1 text-gray-500">
                                  <Eye className="w-4 h-4" />
                                  <span className="font-medium">{post.views_count}</span>
                                </div>
                                
                                {post.is_solved && (
                                  <div className="flex items-center gap-1 text-green-600">
                                    <CheckCircle className="w-4 h-4" />
                                    <span className="text-sm font-medium">{language === 'ar' ? 'محلول' : 'Solved'}</span>
                                  </div>
                                )}

                                <div className="ml-auto flex items-center gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => handleBookmarkPost(post.id, e)}
                                    className={`transition-all duration-300 hover:scale-110 ${
                                      isBookmarked 
                                        ? 'text-yellow-500 hover:text-yellow-600' 
                                        : 'text-gray-400 hover:text-yellow-500'
                                    }`}
                                  >
                                    <Bookmark 
                                      className={`w-4 h-4 transition-all duration-300 ${
                                        isBookmarked ? 'fill-yellow-500' : ''
                                      }`} 
                                    />
                                  </Button>
                                  
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => handleSharePost(post, e)}
                                    className="text-gray-400 hover:text-blue-500 transition-all duration-300 hover:scale-110"
                                  >
                                    <Share2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </Card>
                      </ScrollAnimation>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageAnimation>
  );
}
