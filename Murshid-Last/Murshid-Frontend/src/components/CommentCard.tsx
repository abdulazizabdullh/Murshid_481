import { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';
import { MessageCircle, Edit2, Trash2, MoreVertical } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { useToast } from '@/hooks/use-toast';
import { Comment } from '@/types/community';
import { updateComment, deleteComment } from '@/lib/communityApi';
import LikeButton from './LikeButton';
import CommentForm from './CommentForm';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

interface CommentCardProps {
  comment: Comment;
  depth: number;
  maxDepth: number;
  onCommentUpdate: () => void;
  onReplyClick?: () => void;
}

export default function CommentCard({
  comment,
  depth,
  maxDepth,
  onCommentUpdate,
}: CommentCardProps) {
  const { user } = useAuth();
  const { language } = useI18n();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showReplyForm, setShowReplyForm] = useState(false);

  const canReply = depth < maxDepth;
  const isAuthor = user?.id === comment.author_id;

  const handleEdit = async () => {
    if (!editContent.trim()) {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description:
          language === 'ar'
            ? 'لا يمكن أن يكون التعليق فارغاً'
            : 'Comment cannot be empty',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await updateComment(comment.id, { content: editContent.trim() });

      toast({
        title: language === 'ar' ? 'نجح' : 'Success',
        description:
          language === 'ar' ? 'تم تحديث التعليق' : 'Comment updated successfully',
      });

      setIsEditing(false);
      onCommentUpdate();
    } catch (error) {
      console.error('Error updating comment:', error);
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description:
          language === 'ar'
            ? 'فشل في تحديث التعليق'
            : 'Failed to update comment',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (
      !confirm(
        language === 'ar'
          ? 'هل أنت متأكد من حذف هذا التعليق؟'
          : 'Are you sure you want to delete this comment?'
      )
    ) {
      return;
    }

    try {
      await deleteComment(comment.id);

      toast({
        title: language === 'ar' ? 'نجح' : 'Success',
        description:
          language === 'ar' ? 'تم حذف التعليق' : 'Comment deleted successfully',
      });

      onCommentUpdate();
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description:
          language === 'ar' ? 'فشل في حذف التعليق' : 'Failed to delete comment',
        variant: 'destructive',
      });
    }
  };

  const getRoleBadgeColor = (role?: string) => {
    switch (role) {
      case 'high-school-student':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'university-student':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'university-graduate':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'specialist':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const getRoleLabel = (role?: string) => {
    if (!role) return '';
    const roleMap: Record<string, { ar: string; en: string }> = {
      'high-school-student': { ar: 'طالب ثانوي', en: 'High School Student' },
      'university-student': { ar: 'طالب جامعي', en: 'University Student' },
      'university-graduate': { ar: 'خريج جامعي', en: 'University Graduate' },
      specialist: { ar: 'متخصص', en: 'Specialist' },
    };
    return roleMap[role]?.[language] || role;
  };

  return (
    <div className={`${depth > 0 ? 'ml-8 mt-3' : 'mt-3'}`}>
      <Card className="p-4">
        <div className="flex gap-3">
          <Avatar className="h-8 w-8 flex-shrink-0">
            <AvatarImage src={comment.avatar_url} />
            <AvatarFallback>
              {comment.author_name?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-sm">{comment.author_name}</span>
                {comment.author_role && (
                  <Badge variant="secondary" className={`text-xs ${getRoleBadgeColor(comment.author_role)}`}>
                    {getRoleLabel(comment.author_role)}
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(comment.created_at), {
                    addSuffix: true,
                    locale: language === 'ar' ? ar : undefined,
                  })}
                  {comment.is_edited && (
                    <span className="ml-1">
                      ({language === 'ar' ? 'معدل' : 'edited'})
                    </span>
                  )}
                </span>

                {isAuthor && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-6 w-6">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setIsEditing(true)}>
                        <Edit2 className="h-4 w-4 mr-2" />
                        {language === 'ar' ? 'تعديل' : 'Edit'}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleDelete} className="text-red-600">
                        <Trash2 className="h-4 w-4 mr-2" />
                        {language === 'ar' ? 'حذف' : 'Delete'}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>

            {comment.author_university && (
              <p className="text-xs text-muted-foreground mt-1">
                {comment.author_university}
                {comment.author_major && ` • ${comment.author_major}`}
                {comment.author_academic_level && ` • ${comment.author_academic_level}`}
              </p>
            )}

            {isEditing ? (
              <div className="mt-3 space-y-2">
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  rows={3}
                  disabled={isSubmitting}
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleEdit}
                    disabled={isSubmitting || !editContent.trim()}
                  >
                    {language === 'ar' ? 'حفظ' : 'Save'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setIsEditing(false);
                      setEditContent(comment.content);
                    }}
                    disabled={isSubmitting}
                  >
                    {language === 'ar' ? 'إلغاء' : 'Cancel'}
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-sm mt-2 whitespace-pre-wrap break-words">
                {comment.content}
              </p>
            )}

            <div className="flex items-center gap-2 mt-3">
              <LikeButton
                contentType="comment"
                contentId={comment.id}
                initialLikesCount={comment.likes_count}
                variant="ghost"
                size="sm"
                showCount={true}
              />

              {canReply && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowReplyForm(!showReplyForm)}
                  className="gap-2"
                >
                  <MessageCircle className="h-4 w-4" />
                  <span>{language === 'ar' ? 'رد' : 'Reply'}</span>
                </Button>
              )}
            </div>

            {showReplyForm && (
              <div className="mt-3">
                <CommentForm
                  answerId={comment.answer_id}
                  parentCommentId={comment.id}
                  onCommentCreated={() => {
                    setShowReplyForm(false);
                    onCommentUpdate();
                  }}
                  onCancel={() => setShowReplyForm(false)}
                  placeholder={
                    language === 'ar'
                      ? 'اكتب ردك...'
                      : 'Write your reply...'
                  }
                />
              </div>
            )}
          </div>
        </div>
      </Card>

      {comment.replies && comment.replies.length > 0 && (
        <div className="space-y-3">
          {comment.replies.map((reply) => (
            <CommentCard
              key={reply.id}
              comment={reply}
              depth={depth + 1}
              maxDepth={maxDepth}
              onCommentUpdate={onCommentUpdate}
            />
          ))}
        </div>
      )}
    </div>
  );
}
