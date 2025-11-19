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
  Eye,
  CheckCircle,
  Edit2,
  Trash2,
  AlertTriangle,
  Ban,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useI18n } from '@/contexts/I18nContext';
import { useAuth } from '@/contexts/AuthContext';
import type { Post } from '@/types/community';
import { toast } from 'sonner';
import { translateTagSync } from '@/lib/tagTranslation';
import {
  getCommunityPostsByAuthor,
  deleteCommunityPost
} from '@/lib/communityApi';
import { EditPostModal } from '@/components/community/EditPostModal';
import { ConfirmDialog } from '@/components/ConfirmDialog';

export default function MyPosts() {
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [deletePostId, setDeletePostId] = useState<string | null>(null);
  const [timeRefresh, setTimeRefresh] = useState(0);
  const [showDeleted, setShowDeleted] = useState(false);
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
      const postsData = await getCommunityPostsByAuthor(user.id);
      setUserPosts(postsData);
    } catch (error) {
      console.error('Error loading user content:', error);
      toast.error(language === 'ar' ? 'فشل تحميل منشوراتك' : 'Failed to load your posts');
    } finally {
      setLoading(false);
    }
  };

  const deletePost = (postId: string) => {
    setDeletePostId(postId);
  };

  const confirmDeletePost = async () => {
    if (!deletePostId || !user) return;

    try {
      await deleteCommunityPost(deletePostId, user.id, "User deleted");
      setUserPosts(prev => prev.map(post => 
        post.id === deletePostId 
          ? { ...post, is_deleted: true, deletion_reason: "User deleted", deleted_at: new Date().toISOString() }
          : post
      ));
      toast.success(language === 'ar' ? 'تم حذف المنشور' : 'Post deleted');
    } catch (error) {
      console.error('Error deleting post:', error);
      toast.error(language === 'ar' ? 'فشل حذف المنشور' : 'Failed to delete post');
    } finally {
      setDeletePostId(null);
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
    <>
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
                  {language === 'ar' ? 'منشوراتي' : 'My Posts'}
                </h1>
              </div>
            </ScrollAnimation>

            {/* Posts */}
            <div className="space-y-6">
                {/* Active Posts */}
                {userPosts.filter(p => !p.is_deleted).length > 0 ? (
                  userPosts.filter(p => !p.is_deleted).map((post) => (
                    <ScrollAnimation key={post.id}>
                      <Card 
                        className={`p-6 transition-shadow !border-2 ${
                          post.is_deleted 
                            ? '!border-red-500 dark:!border-red-400 bg-red-50 dark:bg-red-900/10 opacity-75' 
                            : '!border-blue-500 dark:!border-blue-400 hover:shadow-lg cursor-pointer'
                        }`}
                        onClick={post.is_deleted ? undefined : () => navigate(`/community/post/${post.id}`)}
                      >
                        {/* Deleted Banner */}
                        {post.is_deleted && (
                          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg">
                            <div className="flex items-start gap-2">
                              <Ban className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                              <div className="flex-1">
                                <p className="text-sm font-semibold text-red-800 dark:text-red-300 mb-1" dir={language}>
                                  {language === 'ar' ? 'تم حذف هذا المنشور من قبل المشرف' : 'This post was removed by admin'}
                                </p>
                                <p className="text-sm text-red-700 dark:text-red-400" dir={language}>
                                  <span className="font-medium">{language === 'ar' ? 'السبب: ' : 'Reason: '}</span>
                                  {post.deletion_reason || (language === 'ar' ? 'لم يتم تحديد السبب' : 'No reason provided')}
                                </p>
                                {post.deleted_at && (
                                  <p className="text-xs text-red-600 dark:text-red-500 mt-1">
                                    {language === 'ar' ? 'تم الحذف ' : 'Deleted '}{formatTimeAgo(post.deleted_at, language)}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                        
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-sm text-gray-500">
                                {formatTimeAgo(post.created_at, language)}
                              </span>
                              {post.is_solved && (
                                <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  {language === 'ar' ? 'محلولة' : 'Solved'}
                                </Badge>
                              )}
                            </div>
                            
                            <h3 
                              className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2" 
                              dir={language}
                            >
                              {post.title}
                            </h3>
                            
                            <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-2" dir={language}>
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
                              {post.tags.map((tag) => (
                                <Badge key={tag} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                            
                            <div className="flex items-center gap-6 text-sm text-gray-500">
                              <div className="flex items-center gap-1">
                                <Heart className="w-4 h-4" />
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
                          
                          {!post.is_deleted && (
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingPost(post);
                                }}
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deletePost(post.id);
                                }}
                                className="text-red-500 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </Card>
                    </ScrollAnimation>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2" dir={language}>
                      {language === 'ar' ? 'لا توجد منشورات' : 'No Posts Yet'}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-4" dir={language}>
                      {language === 'ar' ? 'ابدأ بإنشاء منشورك الأول' : 'Start by creating your first post'}
                    </p>
                    <Button 
                      onClick={() => navigate('/community/create')}
                      className="bg-blue-500 hover:bg-blue-600 text-white rounded-2xl px-8 py-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
                    >
                      {language === 'ar' ? 'إنشاء منشور' : 'Create Post'}
                    </Button>
                  </div>
                )}
              </div>

              {/* Deleted Posts Section */}
              <div className="mt-8">
                <Button
                  onClick={() => setShowDeleted(!showDeleted)}
                  variant="outline"
                  className="w-full mb-4 rounded-2xl py-6 transition-all duration-300 hover:shadow-lg"
                >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-lg font-semibold" dir={language}>
                        {language === 'ar' 
                          ? `المنشورات المحذوفة (${userPosts.filter(p => p.is_deleted).length})`
                          : `Deleted Posts (${userPosts.filter(p => p.is_deleted).length})`
                        }
                      </span>
                      {showDeleted ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                  </Button>

                  {showDeleted && (
                    <div className="space-y-6">
                      {userPosts.filter(p => p.is_deleted).map((post) => (
                        <ScrollAnimation key={post.id}>
                          <Card className="p-6 transition-shadow !border-2 !border-red-300 dark:!border-red-800 hover:shadow-lg">
                            <div className="cursor-pointer" onClick={() => navigate(`/community/post/${post.id}`)}>
                              {/* Deleted Banner */}
                              <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                                <div className="flex items-start gap-3">
                                  <Ban className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-1" />
                                  <div className="flex-1">
                                    <p className="text-red-800 dark:text-red-300 font-semibold mb-1" dir={language}>
                                      {language === 'ar' 
                                        ? 'تم حذف هذا المنشور من قبل المشرف'
                                        : 'This post has been removed by an admin'
                                      }
                                    </p>
                                    {post.deletion_reason && (
                                      <p className="text-red-700 dark:text-red-400 text-sm" dir={language}>
                                        <span className="font-medium">
                                          {language === 'ar' ? 'السبب: ' : 'Reason: '}
                                        </span>
                                        {post.deletion_reason}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-start justify-between mb-4">
                                <div className="flex-1">
                                  <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2" dir={language}>
                                    {post.title}
                                  </h3>
                                  
                                  <p className="text-gray-700 dark:text-gray-200 mb-4 line-clamp-3" dir={language}>
                                    {post.content}
                                  </p>
                                  
                                  <div className="flex flex-wrap gap-2 mb-3">
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
                                  
                                  <p className="text-sm text-gray-500" dir={language}>
                                    {formatTimeAgo(post.created_at, language)}
                                  </p>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-6 text-sm text-gray-500">
                                <div className="flex items-center gap-1">
                                  <Heart className="w-4 h-4" />
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
                          </Card>
                        </ScrollAnimation>
                      ))}
                    </div>
                  )}
                </div>
            </div>
          </div>
        </div>
      </PageAnimation>

      {/* Edit Post Modal */}
      {editingPost && (
        <EditPostModal
          post={editingPost}
          isOpen={!!editingPost}
          onClose={() => setEditingPost(null)}
          onSuccess={(updatedPost) => {
            setUserPosts(prev => prev.map(p => p.id === updatedPost.id ? updatedPost : p));
            setEditingPost(null);
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={!!deletePostId}
        onOpenChange={(open) => !open && setDeletePostId(null)}
        onConfirm={confirmDeletePost}
        title={language === 'ar' ? 'حذف المنشور' : 'Delete Post'}
        description={language === 'ar' ? 'هل أنت متأكد من حذف هذا المنشور؟ لا يمكن التراجع عن هذا الإجراء.' : 'Are you sure you want to delete this post? This action cannot be undone.'}
        confirmText={language === 'ar' ? 'حذف' : 'Delete'}
        destructive={true}
      />
    </>
  );
}
