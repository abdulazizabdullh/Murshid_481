import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { formatTimeAgo } from '@/lib/timeUtils';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageAnimation } from "@/components/animations/PageAnimation";
import { Heart, MessageCircle, Eye, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/contexts/I18nContext';
import { useAuth } from '@/contexts/AuthContext';
import { getUserLikedPosts, getUserLikedAnswers, getUserLikedComments } from '@/lib/communityApi';
import type { Post, Answer, Comment } from '@/types/community';
import { toast } from 'sonner';
import { translateTagSync } from '@/lib/tagTranslation';

export default function MyLikes() {
  const [likedPosts, setLikedPosts] = useState<Post[]>([]);
  const [likedAnswers, setLikedAnswers] = useState<Answer[]>([]);
  const [likedComments, setLikedComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'posts' | 'answers' | 'comments'>('posts');
  const [timeRefresh, setTimeRefresh] = useState(0);

  const { language } = useI18n();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchLikedItems();
  }, [user]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeRefresh(prev => prev + 1);
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchLikedItems = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const [posts, answers, comments] = await Promise.all([
        getUserLikedPosts(user.id),
        getUserLikedAnswers(user.id),
        getUserLikedComments(user.id)
      ]);
      setLikedPosts(posts);
      setLikedAnswers(answers);
      setLikedComments(comments);
    } catch (error) {
      console.error('Error fetching liked items:', error);
      toast.error(language === 'ar' ? 'فشل تحميل الإعجابات' : 'Failed to load likes');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#e3e8ff] via-[#f5f7ff] to-[#cbd4ff] dark:from-[#0f172a] dark:via-[#1e2a4a] dark:to-[#2a3b6b]">
        <Navbar />
        <div className="py-20 flex items-center justify-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <PageAnimation>
      <div className="min-h-screen bg-gradient-to-br from-[#e3e8ff] via-[#f5f7ff] to-[#cbd4ff] dark:from-[#0f172a] dark:via-[#1e2a4a] dark:to-[#2a3b6b]">
        <Navbar />

        <div className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
            {/* Back Button */}
            <Button
              onClick={() => navigate('/community')}
              variant="ghost"
              className="mb-6"
            >
              <ArrowLeft className={`w-4 h-4 ${language === 'ar' ? 'ml-2 rotate-180' : 'mr-2'}`} />
              {language === 'ar' ? 'العودة إلى المجتمع' : 'Back to Community'}
            </Button>

            {/* Header */}
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                <Heart className="w-10 h-10 inline-block mr-3 text-red-500 fill-current" />
                {language === 'ar' ? 'إعجاباتي' : 'My Likes'}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {language === 'ar'
                  ? 'جميع المنشورات والإجابات التي أعجبت بها'
                  : 'All posts and answers you have liked'}
              </p>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'posts' | 'answers' | 'comments')}>
              <TabsList className="mb-8">
                <TabsTrigger value="posts">
                  {language === 'ar' ? `المنشورات (${likedPosts.length})` : `Posts (${likedPosts.length})`}
                </TabsTrigger>
                <TabsTrigger value="answers">
                  {language === 'ar' ? `الإجابات (${likedAnswers.length})` : `Answers (${likedAnswers.length})`}
                </TabsTrigger>
                <TabsTrigger value="comments">
                  {language === 'ar' ? `التعليقات (${likedComments.length})` : `Comments (${likedComments.length})`}
                </TabsTrigger>
              </TabsList>

              {/* Liked Posts Tab */}
              <TabsContent value="posts">
                {likedPosts.length === 0 ? (
                  <Card className="p-12 text-center">
                    <Heart className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                      {language === 'ar' ? 'لا توجد منشورات محببة' : 'No Liked Posts'}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      {language === 'ar'
                        ? 'ابدأ بالإعجاب بالمنشورات لترىها هنا'
                        : 'Start liking posts to see them here'}
                    </p>
                  </Card>
                ) : (
                  <div className="space-y-6">
                    {likedPosts.map((post) => (
                      <Card
                        key={post.id}
                        className="p-6 hover:shadow-lg transition-all duration-300 cursor-pointer"
                        onClick={() => navigate(`/community/post/${post.id}`)}
                      >
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2" dir={language}>
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
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <div className="flex items-center gap-1">
                              <Heart className="w-4 h-4 text-red-500 fill-current" />
                              <span>{post.likes_count || 0}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <MessageCircle className="w-4 h-4" />
                              <span>{post.answers_count || 0}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Eye className="w-4 h-4" />
                              <span>{post.views_count || 0}</span>
                            </div>
                          </div>
                          <span className="text-sm text-gray-500">
                            {formatTimeAgo(post.created_at, language)}
                          </span>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Liked Answers Tab */}
              <TabsContent value="answers">
                {likedAnswers.length === 0 ? (
                  <Card className="p-12 text-center">
                    <Heart className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                      {language === 'ar' ? 'لا توجد إجابات محببة' : 'No Liked Answers'}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      {language === 'ar'
                        ? 'ابدأ بالإعجاب بالإجابات لترىها هنا'
                        : 'Start liking answers to see them here'}
                    </p>
                  </Card>
                ) : (
                  <div className="space-y-6">
                    {likedAnswers.map((answer) => (
                      <Card
                        key={answer.id}
                        className="p-6 hover:shadow-lg transition-all duration-300 cursor-pointer"
                        onClick={() => navigate(`/community/post/${answer.post_id}`)}
                      >
                        <div className="flex items-center gap-2 mb-3">
                          <Badge variant="secondary" className="text-xs">
                            {answer.author_role === 'specialist'
                              ? language === 'ar' ? 'متخصص' : 'Specialist'
                              : answer.author_role === 'student'
                              ? language === 'ar' ? 'طالب' : 'Student'
                              : language === 'ar' ? 'مشرف' : 'Admin'}
                          </Badge>
                          <span 
                            className="text-sm text-gray-600 dark:text-gray-400 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/user/${answer.author_id}`);
                            }}
                          >
                            {answer.author_name}
                          </span>
                        </div>

                        <p className="text-gray-700 dark:text-gray-300 mb-4 line-clamp-3" dir={language}>
                          {answer.content}
                        </p>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1 text-sm text-gray-500">
                            <Heart className="w-4 h-4 text-red-500 fill-current" />
                            <span>{answer.likes_count || 0}</span>
                          </div>
                          <span className="text-sm text-gray-500">
                            {formatTimeAgo(answer.created_at, language)}
                          </span>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Liked Comments Tab */}
              <TabsContent value="comments">
                {likedComments.length === 0 ? (
                  <Card className="p-12 text-center">
                    <Heart className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                      {language === 'ar' ? 'لا توجد تعليقات محببة' : 'No Liked Comments'}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      {language === 'ar'
                        ? 'ابدأ بالإعجاب بالتعليقات لترىها هنا'
                        : 'Start liking comments to see them here'}
                    </p>
                  </Card>
                ) : (
                  <div className="space-y-6">
                    {likedComments.map((comment) => (
                      <Card
                        key={comment.id}
                        className="p-6 hover:shadow-lg transition-all duration-300 cursor-pointer"
                        onClick={() => {
                          // Navigate to the post containing this comment
                          const postId = (comment as any).post_id;
                          if (postId) {
                            navigate(`/community/post/${postId}`);
                          } else {
                            toast.error(language === 'ar'
                              ? 'لم يتم العثور على المنشور'
                              : 'Post not found');
                          }
                        }}
                      >
                        <div className="flex items-center gap-2 mb-3">
                          <Badge variant="secondary" className="text-xs">
                            {comment.author_role === 'specialist'
                              ? language === 'ar' ? 'متخصص' : 'Specialist'
                              : comment.author_role === 'student'
                              ? language === 'ar' ? 'طالب' : 'Student'
                              : language === 'ar' ? 'مشرف' : 'Admin'}
                          </Badge>
                          <span 
                            className="text-sm text-gray-600 dark:text-gray-400 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/user/${comment.author_id}`);
                            }}
                          >
                            {comment.author_name}
                          </span>
                          {comment.parent_comment_id && (
                            <Badge variant="outline" className="text-xs">
                              {language === 'ar' ? 'رد' : 'Reply'}
                            </Badge>
                          )}
                        </div>

                        <p className="text-gray-700 dark:text-gray-300 mb-4" dir={language}>
                          {comment.content}
                        </p>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1 text-sm text-gray-500">
                            <Heart className="w-4 h-4 text-red-500 fill-current" />
                            <span>{comment.likes_count || 0}</span>
                          </div>
                          <span className="text-sm text-gray-500">
                            {formatTimeAgo(comment.created_at, language)}
                          </span>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </PageAnimation>
  );
}
