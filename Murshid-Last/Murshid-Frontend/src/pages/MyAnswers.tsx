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
  ArrowLeft,
  MessageCircle,
  Heart,
  CheckCircle,
  Ban,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useI18n } from '@/contexts/I18nContext';
import { useAuth } from '@/contexts/AuthContext';
import type { Answer, Comment } from '@/types/community';
import { toast } from 'sonner';
import {
  getCommunityAnswersByAuthor,
  getCommentsByAuthor
} from '@/lib/communityApi';

export default function MyAnswers() {
  const [userAnswers, setUserAnswers] = useState<Answer[]>([]);
  const [userComments, setUserComments] = useState<Comment[]>([]);
  const [activeTab, setActiveTab] = useState<'answers' | 'comments'>('answers');
  const [loading, setLoading] = useState(true);
  const [showDeletedAnswers, setShowDeletedAnswers] = useState(false);
  const [showDeletedComments, setShowDeletedComments] = useState(false);
  const [timeRefresh, setTimeRefresh] = useState(0);
  const { language } = useI18n();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchUserContent();
  }, [user]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeRefresh(prev => prev + 1);
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchUserContent = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [answersData, commentsData] = await Promise.all([
        getCommunityAnswersByAuthor(user.id),
        getCommentsByAuthor(user.id)
      ]);

      setUserAnswers(answersData);
      setUserComments(commentsData);
    } catch (error) {
      console.error('Error loading user content:', error);
      toast.error(language === 'ar' ? 'فشل تحميل نشاطك' : 'Failed to load your activity');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <PageAnimation>
        <div className="min-h-screen bg-gradient-to-br from-[#e3e8ff] via-[#f5f7ff] to-[#cbd4ff] dark:from-[#0f172a] dark:via-[#1e2a4a] dark:to-[#2a3b6b]">
          <Navbar />
          <div className="py-20 flex items-center justify-center">
            <p className="text-gray-600 dark:text-gray-300">Loading...</p>
          </div>
        </div>
      </PageAnimation>
    );
  }

  return (
    <PageAnimation>
      <div className="min-h-screen bg-gradient-to-br from-[#e3e8ff] via-[#f5f7ff] to-[#cbd4ff] dark:from-[#0f172a] dark:via-[#1e2a4a] dark:to-[#2a3b6b]">
        <Navbar />
        
        <div className="py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-10">
            {/* Header */}
            <ScrollAnimation>
              <div className="mb-8">
                <Button
                  onClick={() => navigate('/community')}
                  variant="ghost"
                  className="mb-4 rounded-2xl px-6 py-3 transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  {language === 'ar' ? 'العودة إلى المجتمع' : 'Back to Community'}
                </Button>
                
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4" dir={language}>
                  {language === 'ar' ? 'إجاباتي وتعليقاتي' : 'My Answers & Comments'}
                </h1>
                
                <div className="flex gap-4">
                  <Button
                    variant={activeTab === 'answers' ? 'default' : 'outline'}
                    onClick={() => setActiveTab('answers')}
                    className={`rounded-2xl px-6 py-3 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
                      activeTab === 'answers'
                        ? 'bg-blue-500 hover:bg-blue-600 text-white'
                        : 'border-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400'
                    }`}
                  >
                    {language === 'ar' ? `إجاباتي (${userAnswers.length})` : `My Answers (${userAnswers.length})`}
                  </Button>
                  <Button
                    variant={activeTab === 'comments' ? 'default' : 'outline'}
                    onClick={() => setActiveTab('comments')}
                    className={`rounded-2xl px-6 py-3 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
                      activeTab === 'comments'
                        ? 'bg-blue-500 hover:bg-blue-600 text-white'
                        : 'border-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400'
                    }`}
                  >
                    {language === 'ar' ? `تعليقاتي (${userComments.length})` : `My Comments (${userComments.length})`}
                  </Button>
                </div>
              </div>
            </ScrollAnimation>

            {/* Answers Tab */}
            {activeTab === 'answers' && (
              <div className="space-y-6">
                {/* Active Answers */}
                {userAnswers.filter(a => !a.is_deleted).length > 0 ? (
                  userAnswers.filter(a => !a.is_deleted).map((answer) => (
                    <ScrollAnimation key={answer.id}>
                      <Card className="p-6 transition-shadow !border-2 !border-blue-500 dark:!border-blue-400 hover:shadow-lg">
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                            <MessageCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                          </div>

                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-sm text-gray-500">
                                {language === 'ar' ? 'أجبت منذ' : 'Answered'} {formatTimeAgo(answer.created_at, language)}
                              </span>
                              {answer.is_accepted && (
                                <Badge variant="outline" className="text-xs text-green-600">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  {language === 'ar' ? 'مقبولة' : 'Accepted'}
                                </Badge>
                              )}
                            </div>

                            <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed" dir={language}>
                              {answer.content}
                            </p>

                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-1 text-sm text-gray-500">
                                <Heart className="w-4 h-4" />
                                <span>{answer.likes_count}</span>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate(`/community/post/${answer.post_id}`)}
                                className="text-blue-600 hover:text-blue-800 rounded-xl transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                              >
                                {language === 'ar' ? 'عرض المنشور' : 'View Post'}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </Card>
                    </ScrollAnimation>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2" dir={language}>
                      {language === 'ar' ? 'لا توجد إجابات' : 'No Answers Yet'}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300" dir={language}>
                      {language === 'ar' ? 'ابدأ بالإجابة على أسئلة المجتمع' : 'Start by answering community questions'}
                    </p>
                  </div>
                )}

                {/* Deleted Answers Section */}
                <div className="mt-8">
                  <Button
                    onClick={() => setShowDeletedAnswers(!showDeletedAnswers)}
                    variant="outline"
                    className="w-full mb-4 rounded-2xl py-6 transition-all duration-300 hover:shadow-lg"
                  >
                      <div className="flex items-center justify-between w-full">
                        <span className="text-lg font-semibold" dir={language}>
                          {language === 'ar' 
                            ? `الإجابات المحذوفة (${userAnswers.filter(a => a.is_deleted).length})`
                            : `Deleted Answers (${userAnswers.filter(a => a.is_deleted).length})`
                          }
                        </span>
                        {showDeletedAnswers ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </div>
                    </Button>

                    {showDeletedAnswers && (
                      <div className="space-y-6">
                        {userAnswers.filter(a => a.is_deleted).map((answer) => (
                          <ScrollAnimation key={answer.id}>
                            <Card className="p-6 transition-shadow !border-2 !border-red-300 dark:!border-red-800 hover:shadow-lg">
                              {/* Deleted Banner */}
                              <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                                <div className="flex items-start gap-3">
                                  <Ban className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-1" />
                                  <div className="flex-1">
                                    <p className="text-red-800 dark:text-red-300 font-semibold mb-1" dir={language}>
                                      {language === 'ar' ? 'تم حذف هذه الإجابة من قبل المشرف' : 'This answer was removed by admin'}
                                    </p>
                                    {answer.deletion_reason && (
                                      <p className="text-red-700 dark:text-red-400 text-sm" dir={language}>
                                        <span className="font-medium">{language === 'ar' ? 'السبب: ' : 'Reason: '}</span>
                                        {answer.deletion_reason}
                                      </p>
                                    )}
                                    {answer.deleted_at && (
                                      <p className="text-red-600 dark:text-red-500 text-xs mt-1">
                                        {language === 'ar' ? 'تم الحذف ' : 'Deleted '}{formatTimeAgo(answer.deleted_at, language)}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-start gap-4">
                                <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                                  <MessageCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                                </div>

                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="text-sm text-gray-500">
                                      {language === 'ar' ? 'أجبت منذ' : 'Answered'} {formatTimeAgo(answer.created_at, language)}
                                    </span>
                                    {answer.is_accepted && (
                                      <Badge variant="outline" className="text-xs text-green-600">
                                        <CheckCircle className="w-3 h-3 mr-1" />
                                        {language === 'ar' ? 'مقبولة' : 'Accepted'}
                                      </Badge>
                                    )}
                                  </div>

                                  <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed" dir={language}>
                                    {answer.content}
                                  </p>

                                  <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-1 text-sm text-gray-500">
                                      <Heart className="w-4 h-4" />
                                      <span>{answer.likes_count}</span>
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => navigate(`/community/post/${answer.post_id}`)}
                                      className="text-blue-600 hover:text-blue-800 rounded-xl transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                                    >
                                      {language === 'ar' ? 'عرض المنشور' : 'View Post'}
                                    </Button>
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
            )}

            {/* Comments Tab */}
            {activeTab === 'comments' && (
              <div className="space-y-6">
                {/* Active Comments */}
                {userComments.filter(c => !c.is_deleted).length > 0 ? (
                  userComments.filter(c => !c.is_deleted).map((comment) => (
                    <ScrollAnimation key={comment.id}>
                      <Card className="p-6 transition-shadow !border-2 !border-blue-500 dark:!border-blue-400 hover:shadow-lg">
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
                            <MessageCircle className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                          </div>

                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-sm text-gray-500">
                                {language === 'ar' ? 'علقت منذ' : 'Commented'} {formatTimeAgo(comment.created_at, language)}
                              </span>
                              {comment.parent_comment_id && (
                                <Badge variant="outline" className="text-xs">
                                  {language === 'ar' ? 'رد' : 'Reply'}
                                </Badge>
                              )}
                            </div>

                            <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed" dir={language}>
                              {comment.content}
                            </p>

                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-1 text-sm text-gray-500">
                                <Heart className="w-4 h-4" />
                                <span>{comment.likes_count}</span>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  const postId = (comment as any).post_id;
                                  if (postId) {
                                    navigate(`/community/post/${postId}`);
                                  } else {
                                    toast.info(language === 'ar' ? 'لا يمكن العثور على المنشور' : 'Cannot find the post');
                                  }
                                }}
                                className="text-blue-600 hover:text-blue-800 rounded-xl transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                              >
                                {language === 'ar' ? 'عرض المنشور' : 'View Post'}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </Card>
                    </ScrollAnimation>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2" dir={language}>
                      {language === 'ar' ? 'لا توجد تعليقات' : 'No Comments Yet'}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300" dir={language}>
                      {language === 'ar' ? 'ابدأ بالتعليق على الإجابات' : 'Start by commenting on answers'}
                    </p>
                  </div>
                )}

                {/* Deleted Comments Section */}
                <div className="mt-8">
                  <Button
                    onClick={() => setShowDeletedComments(!showDeletedComments)}
                    variant="outline"
                    className="w-full mb-4 rounded-2xl py-6 transition-all duration-300 hover:shadow-lg"
                  >
                      <div className="flex items-center justify-between w-full">
                        <span className="text-lg font-semibold" dir={language}>
                          {language === 'ar' 
                            ? `التعليقات المحذوفة (${userComments.filter(c => c.is_deleted).length})`
                            : `Deleted Comments (${userComments.filter(c => c.is_deleted).length})`
                          }
                        </span>
                        {showDeletedComments ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </div>
                    </Button>

                    {showDeletedComments && (
                      <div className="space-y-6">
                        {userComments.filter(c => c.is_deleted).map((comment) => (
                          <ScrollAnimation key={comment.id}>
                            <Card className="p-6 transition-shadow !border-2 !border-red-300 dark:!border-red-800 hover:shadow-lg">
                              {/* Deleted Banner */}
                              <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                                <div className="flex items-start gap-3">
                                  <Ban className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-1" />
                                  <div className="flex-1">
                                    <p className="text-red-800 dark:text-red-300 font-semibold mb-1" dir={language}>
                                      {language === 'ar' ? 'تم حذف هذا التعليق من قبل المشرف' : 'This comment was removed by admin'}
                                    </p>
                                    {comment.deletion_reason && (
                                      <p className="text-red-700 dark:text-red-400 text-sm" dir={language}>
                                        <span className="font-medium">{language === 'ar' ? 'السبب: ' : 'Reason: '}</span>
                                        {comment.deletion_reason}
                                      </p>
                                    )}
                                    {comment.deleted_at && (
                                      <p className="text-red-600 dark:text-red-500 text-xs mt-1">
                                        {language === 'ar' ? 'تم الحذف ' : 'Deleted '}{formatTimeAgo(comment.deleted_at, language)}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-start gap-4">
                                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
                                  <MessageCircle className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                                </div>

                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="text-sm text-gray-500">
                                      {language === 'ar' ? 'علقت منذ' : 'Commented'} {formatTimeAgo(comment.created_at, language)}
                                    </span>
                                  </div>

                                  <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed" dir={language}>
                                    {comment.content}
                                  </p>

                                  <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-1 text-sm text-gray-500">
                                      <Heart className="w-4 h-4" />
                                      <span>{comment.likes_count}</span>
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        if (comment.answer_id) {
                                          const relatedAnswer = userAnswers.find(a => a.id === comment.answer_id);
                                          if (relatedAnswer) {
                                            navigate(`/community/post/${relatedAnswer.post_id}`);
                                          }
                                        }
                                      }}
                                      className="text-blue-600 hover:text-blue-800 rounded-xl transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                                    >
                                      {language === 'ar' ? 'عرض المنشور' : 'View Post'}
                                    </Button>
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
            )}
          </div>
        </div>
      </div>
    </PageAnimation>
  );
}
