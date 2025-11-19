import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { formatTimeAgo } from '@/lib/timeUtils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { PageAnimation } from "@/components/animations/PageAnimation";
import { 
  ArrowLeft, 
  Heart, 
  MessageCircle, 
  Eye, 
  CheckCircle,
  Send,
  ThumbsUp,
  Bookmark,
  Share2,
  Reply,
  Award
} from 'lucide-react';
import { useI18n } from '@/contexts/I18nContext';
import { useAuth } from '@/contexts/AuthContext';
import type { Post, Answer } from '@/types/community';
import { analyzeContent } from '@/lib/contentFilter';
import { toast } from 'sonner';
import { getCommunityPostById, getPostAnswers, createCommunityAnswer, submitCommunityReport } from '@/lib/communityApi';

interface Reply {
  id: string;
  answerId: string;
  content: string;
  author_name: string;
  author_role: 'student' | 'specialist' | 'admin';
  likes_count: number;
  created_at: string;
}

export default function PostDetailEnhanced() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const [post, setPost] = useState<Post | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [replies, setReplies] = useState<Record<string, Reply[]>>({});
  const [newAnswer, setNewAnswer] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [reportingId, setReportingId] = useState<string | null>(null);
  const [timeRefresh, setTimeRefresh] = useState(0);
  const [likedPost, setLikedPost] = useState(false);
  const [bookmarkedPost, setBookmarkedPost] = useState(false);
  const [likedAnswers, setLikedAnswers] = useState<Set<string>>(new Set());
  const [likedReplies, setLikedReplies] = useState<Set<string>>(new Set());
  const { language } = useI18n();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (id) {
      fetchPostDetails();
    }
  }, [id]);

  useEffect(() => {
    // Handle quick reply from Community page
    const quickReply = location.state?.quickReply;
    if (quickReply) {
      setNewAnswer(quickReply);
      // Clear the state
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location]);

  useEffect(() => {
    loadUserInteractions();
  }, [post, answers]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeRefresh(prev => prev + 1);
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const loadUserInteractions = () => {
    if (user && id) {
      const likedPostsStr = localStorage.getItem(`liked_posts_${user.id}`);
      const bookmarkedPostsStr = localStorage.getItem(`bookmarked_posts_${user.id}`);
      const likedAnswersStr = localStorage.getItem(`liked_answers_${user.id}`);
      
      if (likedPostsStr) {
        const likedPosts = new Set(JSON.parse(likedPostsStr));
        setLikedPost(likedPosts.has(id));
      }
      if (bookmarkedPostsStr) {
        const bookmarkedPosts = new Set(JSON.parse(bookmarkedPostsStr));
        setBookmarkedPost(bookmarkedPosts.has(id));
      }
      if (likedAnswersStr) {
        setLikedAnswers(new Set(JSON.parse(likedAnswersStr)));
      }
    }
  };

  const saveUserInteractions = () => {
    if (user && id) {
      const likedPostsStr = localStorage.getItem(`liked_posts_${user.id}`) || '[]';
      const likedPosts = new Set(JSON.parse(likedPostsStr));
      
      if (likedPost) {
        likedPosts.add(id);
      } else {
        likedPosts.delete(id);
      }
      
      localStorage.setItem(`liked_posts_${user.id}`, JSON.stringify([...likedPosts]));
      localStorage.setItem(`liked_answers_${user.id}`, JSON.stringify([...likedAnswers]));
    }
  };

  const fetchPostDetails = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [fetchedPost, fetchedAnswers] = await Promise.all([
        getCommunityPostById(id),
        getPostAnswers(id)
      ]);

      if (!fetchedPost) {
        toast.error(language === 'ar' ? 'Post not found' : 'Post not found');
        navigate('/community');
        return;
      }

      setPost(fetchedPost);
      setAnswers(fetchedAnswers);
      
      // Initialize empty replies for each answer
      const initialReplies: Record<string, Reply[]> = {};
      fetchedAnswers.forEach(answer => {
        initialReplies[answer.id] = [];
      });
      setReplies(initialReplies);
    } catch (error) {
      console.error('Error fetching post details:', error);
      toast.error(language === 'ar' ? 'Failed to load post details' : 'Failed to load post details');
    } finally {
      setLoading(false);
    }
  };

  const handleLikePost = () => {
    if (!user) {
      navigate('/login');
      return;
    }

    setLikedPost(!likedPost);
    setPost(prev => prev ? { 
      ...prev, 
      likes_count: likedPost ? prev.likes_count - 1 : prev.likes_count + 1 
    } : prev);
    
    setTimeout(saveUserInteractions, 100);
  };

  const handleBookmarkPost = () => {
    if (!user) {
      navigate('/login');
      return;
    }

    const bookmarkedPostsStr = localStorage.getItem(`bookmarked_posts_${user.id}`) || '[]';
    const bookmarkedPosts = new Set(JSON.parse(bookmarkedPostsStr));
    
    if (bookmarkedPost) {
      bookmarkedPosts.delete(id!);
      toast.success(language === 'ar' ? 'تم إزالة الإشارة المرجعية' : 'Bookmark removed');
    } else {
      bookmarkedPosts.add(id!);
      toast.success(language === 'ar' ? 'تم الإضافة إلى الإشارات المرجعية' : 'Added to bookmarks');
    }
    
    localStorage.setItem(`bookmarked_posts_${user.id}`, JSON.stringify([...bookmarkedPosts]));
    setBookmarkedPost(!bookmarkedPost);
  };

  const handleSharePost = () => {
    const url = window.location.href;
    if (navigator.share && post) {
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

  const handleLikeAnswer = (answerId: string) => {
    if (!user) {
      navigate('/login');
      return;
    }

    const newLikedAnswers = new Set(likedAnswers);
    const isLiked = newLikedAnswers.has(answerId);
    
    if (isLiked) {
      newLikedAnswers.delete(answerId);
    } else {
      newLikedAnswers.add(answerId);
    }
    
    setLikedAnswers(newLikedAnswers);
    setAnswers(answers.map(a => 
      a.id === answerId 
        ? { ...a, likes_count: isLiked ? a.likes_count - 1 : a.likes_count + 1 }
        : a
    ));

    localStorage.setItem(`liked_answers_${user.id}`, JSON.stringify([...newLikedAnswers]));
  };

  const handleReport = async (
    targetType: 'post' | 'answer',
    targetId: string,
    targetTitle: string,
    targetExcerpt: string
  ) => {
    if (!user) {
      navigate('/login');
      return;
    }
    const reason = window.prompt(language === 'ar' ? 'وصف المشكلة' : 'Describe the issue');
    if (!reason || !reason.trim()) {
      return;
    }
    setReportingId(targetId);
    try {
      await submitCommunityReport(
        {
          target_type: targetType,
          target_id: targetId,
          reason: reason.trim(),
          target_title: targetTitle,
          target_excerpt: targetExcerpt.slice(0, 180),
        },
        {
          id: user.id,
          name: user.name || user.email,
          role: user.role,
          establishment_name: user.establishment_name,
          track: user.track,
          level: user.level,
          university_id: user.university_id,
          avatar_url: user.avatar_url,
          is_admin: user.is_admin,
        }
      );
      toast.success(language === 'ar' ? 'تم إرسال البلاغ' : 'Report submitted');
    } catch (error: any) {
      console.error('Error reporting content:', error);
      const message = error?.message || (language === 'ar' ? 'فشل إرسال البلاغ' : 'Failed to submit report');
      toast.error(message);
    } finally {
      setReportingId(null);
    }
  };

  const handleSubmitAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }

    if (post && post.author_id === user.id) {
      toast.error(language === 'ar' ? 'لا يمكنك الإجابة على سؤالك الخاص' : 'You cannot answer your own question');
      return;
    }

    if (!newAnswer.trim()) {
      toast.error(language === 'ar' ? 'الرجاء كتابة إجابة' : 'Please write an answer');
      return;
    }

    const answerAnalysis = analyzeContent(newAnswer, language);
    
    if (!answerAnalysis.isAllowed) {
      toast.error(language === 'ar' ? 
        `الإجابة غير مسموحة: ${answerAnalysis.issues.join(', ')}` :
        `Answer not allowed: ${answerAnalysis.issues.join(', ')}`
      );
      return;
    }
    
    if (answerAnalysis.severity === 'medium') {
      toast.warning(language === 'ar' ? 
        `تحذير: ${answerAnalysis.issues.join(', ')}` :
        `Warning: ${answerAnalysis.issues.join(', ')}`
      );
    }

    setSubmitting(true);
    try {
      const createdAnswer = await createCommunityAnswer(
        { post_id: id!, content: newAnswer },
        {
          id: user.id,
          name: user.name || user.email,
          role: user.role,
          establishment_name: user.establishment_name,
          track: user.track,
          level: user.level,
          university_id: user.university_id,
          avatar_url: user.avatar_url,
          is_admin: user.is_admin,
        }
      );

      toast.success(language === 'ar' ? 'تم إرسال الإجابة' : 'Answer submitted');
      setNewAnswer('');
      setAnswers(prev => [createdAnswer, ...prev]);
      setPost(prev => prev ? { ...prev, answers_count: (prev.answers_count || 0) + 1 } : prev);
      
      // Initialize replies for new answer
      setReplies(prev => ({ ...prev, [createdAnswer.id]: [] }));
    } catch (error: any) {
      console.error('Error submitting answer:', error);
      const message = error?.message || (language === 'ar' ? 'فشل إرسال الإجابة' : 'Failed to submit answer');
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitReply = async (answerId: string) => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (!replyContent.trim()) {
      toast.error(language === 'ar' ? 'الرجاء كتابة رد' : 'Please write a reply');
      return;
    }

    // Simulate reply creation (you'll need to implement this in your API)
    const newReply: Reply = {
      id: `reply_${Date.now()}`,
      answerId: answerId,
      content: replyContent,
      author_name: user.name || user.email,
      author_role: user.is_admin ? 'admin' : (user.role === 'specialist' ? 'specialist' : 'student'),
      likes_count: 0,
      created_at: new Date().toISOString(),
    };

    setReplies(prev => ({
      ...prev,
      [answerId]: [...(prev[answerId] || []), newReply]
    }));

    toast.success(language === 'ar' ? 'تم إرسال الرد' : 'Reply submitted');
    setReplyContent('');
    setReplyingTo(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#e3e8ff] via-[#f5f7ff] to-[#cbd4ff] dark:from-[#0f172a] dark:via-[#1e2a4a] dark:to-[#2a3b6b]">
        <Navbar />
        <div className="py-20 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-300">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#e3e8ff] via-[#f5f7ff] to-[#cbd4ff] dark:from-[#0f172a] dark:via-[#1e2a4a] dark:to-[#2a3b6b]">
        <Navbar />
        <div className="py-20 text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            {language === 'ar' ? 'المنشور غير موجود' : 'Post not found'}
          </h2>
          <Button onClick={() => navigate('/community')}>
            {language === 'ar' ? 'العودة إلى المجتمع' : 'Back to Community'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <PageAnimation>
      <div className="min-h-screen bg-gradient-to-br from-[#e3e8ff] via-[#f5f7ff] to-[#cbd4ff] dark:from-[#0f172a] dark:via-[#1e2a4a] dark:to-[#2a3b6b]">
        <Navbar />
        
        {/* Reply Modal Overlay */}
        {replyingTo && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <Card className="max-w-2xl w-full p-6 shadow-2xl">
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                {language === 'ar' ? 'الرد على الإجابة' : 'Reply to Answer'}
              </h3>
              
              <Textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmitReply(replyingTo);
                  }
                }}
                placeholder={language === 'ar' ? 'اكتب ردك هنا... (اضغط Enter للإرسال)' : 'Type your reply... (Press Enter to send)'}
                className="rounded-xl min-h-32 mb-4"
                dir={language}
                autoFocus
              />
              
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setReplyingTo(null);
                    setReplyContent('');
                  }}
                  className="rounded-xl"
                >
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </Button>
                <Button
                  onClick={() => handleSubmitReply(replyingTo)}
                  disabled={!replyContent.trim()}
                  className="rounded-xl bg-blue-500 hover:bg-blue-600"
                >
                  <Send className="w-4 h-4 mr-2" />
                  {language === 'ar' ? 'إرسال' : 'Send Reply'}
                </Button>
              </div>
            </Card>
          </div>
        )}

        <div className="py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-10">
            {/* Back Button */}
            <Button
              onClick={() => navigate('/community')}
              variant="ghost"
              className="mb-6 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {language === 'ar' ? 'العودة إلى المجتمع' : 'Back to Community'}
            </Button>

            {/* Post Card */}
            <Card className="p-8 mb-8 shadow-xl">
              <div className="flex items-start gap-4 mb-6">
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
                  
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4" dir={language}>
                    {post.title}
                  </h1>
                  
                  <p className="text-gray-700 dark:text-gray-300 mb-6 leading-relaxed whitespace-pre-wrap" dir={language}>
                    {post.content}
                  </p>
                  
                  <div className="flex flex-wrap gap-2 mb-6">
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
                  
                  <div className="flex items-center gap-4 text-sm">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleLikePost}
                      className={`flex items-center gap-1 transition-all duration-300 hover:scale-110 ${
                        likedPost 
                          ? 'text-red-500 hover:text-red-600' 
                          : 'text-gray-500 hover:text-red-500'
                      }`}
                    >
                      <Heart 
                        className={`w-5 h-5 transition-all duration-300 ${
                          likedPost ? 'fill-red-500' : ''
                        }`} 
                      />
                      <span className="font-medium">{post.likes_count}</span>
                    </Button>
                    
                    <div className="flex items-center gap-1 text-gray-500">
                      <MessageCircle className="w-5 h-5" />
                      <span className="font-medium">{post.answers_count}</span>
                    </div>
                    
                    <div className="flex items-center gap-1 text-gray-500">
                      <Eye className="w-5 h-5" />
                      <span className="font-medium">{post.views_count}</span>
                    </div>
                    
                    {post.is_solved && (
                      <div className="flex items-center gap-1 text-green-600">
                        <CheckCircle className="w-5 h-5" />
                        <span className="text-sm font-medium">{language === 'ar' ? 'محلول' : 'Solved'}</span>
                      </div>
                    )}

                    <div className="ml-auto flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleBookmarkPost}
                        className={`transition-all duration-300 hover:scale-110 ${
                          bookmarkedPost 
                            ? 'text-yellow-500 hover:text-yellow-600' 
                            : 'text-gray-400 hover:text-yellow-500'
                        }`}
                      >
                        <Bookmark 
                          className={`w-5 h-5 transition-all duration-300 ${
                            bookmarkedPost ? 'fill-yellow-500' : ''
                          }`} 
                        />
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleSharePost}
                        className="text-gray-400 hover:text-blue-500 transition-all duration-300 hover:scale-110"
                      >
                        <Share2 className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Quick Reply Form (Outside answers) */}
            {user && post && post.author_id !== user.id && (
              <Card className="p-6 mb-8 shadow-lg border-2 border-blue-200 dark:border-blue-800">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2" dir={language}>
                  <Send className="w-5 h-5 text-blue-500" />
                  {language === 'ar' ? 'رد سريع' : 'Quick Reply'}
                </h3>
                
                <form onSubmit={handleSubmitAnswer}>
                  <Textarea
                    value={newAnswer}
                    onChange={(e) => setNewAnswer(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmitAnswer(e as any);
                      }
                    }}
                    placeholder={language === 'ar' ? 'اكتب إجابتك هنا... (اضغط Enter للإرسال)' : 'Write your answer here... (Press Enter to send)'}
                    className="rounded-xl min-h-32 mb-4"
                    dir={language}
                    required
                  />
                  
                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      disabled={submitting}
                      className="rounded-xl bg-blue-500 hover:bg-blue-600 px-6 py-3 transition-all duration-300 hover:shadow-xl"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      {submitting ? (language === 'ar' ? 'جاري الإرسال...' : 'Submitting...') : 
                                   (language === 'ar' ? 'إرسال الإجابة' : 'Submit Answer')}
                    </Button>
                  </div>
                </form>
              </Card>
            )}

            {/* Answers Section */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6" dir={language}>
                {language === 'ar' ? `الإجابات (${answers.length})` : `Answers (${answers.length})`}
              </h2>
              
              <div className="space-y-6">
                {answers.map((answer) => {
                  const isLikedAnswer = likedAnswers.has(answer.id);
                  const answerReplies = replies[answer.id] || [];
                  
                  return (
                    <Card key={answer.id} className="p-6 shadow-lg hover:shadow-xl transition-all duration-300">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-md">
                          <span className="text-white font-semibold text-sm">
                            {answer.author_name.charAt(0)}
                          </span>
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <span className="font-medium text-gray-900 dark:text-gray-100">
                              {answer.author_name}
                            </span>
                            <Badge 
                              variant="secondary" 
                              className={`text-xs ${
                                answer.author_role === 'specialist' 
                                  ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
                                  : answer.author_role === 'admin'
                                  ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                                  : 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                              }`}
                            >
                              {answer.author_role === 'specialist' ? (language === 'ar' ? 'مختص' : 'Specialist') : 
                               answer.author_role === 'student' ? (language === 'ar' ? 'طالب' : 'Student') : 
                               (language === 'ar' ? 'مدير' : 'Admin')}
                            </Badge>
                            {answer.author_university && (
                              <Badge variant="outline" className="text-xs">
                                🏛️ {answer.author_university}
                              </Badge>
                            )}
                            {answer.author_major && (
                              <Badge variant="outline" className="text-xs">
                                📚 {answer.author_major}
                              </Badge>
                            )}
                            <span className="text-sm text-gray-500">
                              {formatTimeAgo(answer.created_at, language)}
                            </span>
                          </div>
                          
                          <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed whitespace-pre-wrap" dir={language}>
                            {answer.content}
                          </p>
                          
                          <div className="flex items-center gap-4">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleLikeAnswer(answer.id)}
                              className={`flex items-center gap-1 transition-all duration-300 hover:scale-110 ${
                                isLikedAnswer 
                                  ? 'text-blue-500 hover:text-blue-600' 
                                  : 'text-gray-500 hover:text-blue-500'
                              }`}
                            >
                              <ThumbsUp 
                                className={`w-4 h-4 transition-all duration-300 ${
                                  isLikedAnswer ? 'fill-blue-500' : ''
                                }`} 
                              />
                              <span className="font-medium">{answer.likes_count}</span>
                            </Button>
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setReplyingTo(answer.id)}
                              className="flex items-center gap-1 text-gray-500 hover:text-green-500 transition-all duration-300 hover:scale-110"
                            >
                              <Reply className="w-4 h-4" />
                              <span>{language === 'ar' ? 'رد' : 'Reply'}</span>
                            </Button>
                            
                            {answer.is_accepted && (
                              <div className="flex items-center gap-1 text-green-600">
                                <Award className="w-4 h-4 fill-green-600" />
                                <span className="text-sm font-medium">{language === 'ar' ? 'أفضل إجابة' : 'Best Answer'}</span>
                              </div>
                            )}
                          </div>

                          {/* Nested Replies */}
                          {answerReplies.length > 0 && (
                            <div className="mt-4 ml-6 space-y-3 border-l-2 border-blue-200 dark:border-blue-800 pl-4">
                              {answerReplies.map((reply) => {
                                const isLikedReply = likedReplies.has(reply.id);
                                
                                return (
                                  <div key={reply.id} className="bg-blue-50 dark:bg-blue-900/10 rounded-xl p-4">
                                    <div className="flex items-start gap-3">
                                      <div className="w-8 h-8 bg-gradient-to-br from-blue-300 to-blue-500 rounded-full flex items-center justify-center">
                                        <span className="text-white font-semibold text-xs">
                                          {reply.author_name.charAt(0)}
                                        </span>
                                      </div>
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                            {reply.author_name}
                                          </span>
                                          <Badge variant="outline" className="text-xs">
                                            {reply.author_role === 'specialist' ? (language === 'ar' ? 'مختص' : 'Specialist') : 
                                             reply.author_role === 'student' ? (language === 'ar' ? 'طالب' : 'Student') : 
                                             (language === 'ar' ? 'مدير' : 'Admin')}
                                          </Badge>
                                          <span className="text-xs text-gray-500">
                                            {formatTimeAgo(reply.created_at, language)}
                                          </span>
                                        </div>
                                        <p className="text-sm text-gray-700 dark:text-gray-300 mb-2" dir={language}>
                                          {reply.content}
                                        </p>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => {
                                            const newLikedReplies = new Set(likedReplies);
                                            if (isLikedReply) {
                                              newLikedReplies.delete(reply.id);
                                            } else {
                                              newLikedReplies.add(reply.id);
                                            }
                                            setLikedReplies(newLikedReplies);
                                          }}
                                          className={`text-xs ${
                                            isLikedReply ? 'text-blue-500' : 'text-gray-400'
                                          }`}
                                        >
                                          <ThumbsUp className={`w-3 h-3 mr-1 ${isLikedReply ? 'fill-blue-500' : ''}`} />
                                          {reply.likes_count}
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageAnimation>
  );
}
