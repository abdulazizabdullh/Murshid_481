import { useState } from 'react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { useToast } from '@/hooks/use-toast';
import { createComment } from '@/lib/communityApi';
import { CreateCommentRequest } from '@/types/community';

interface CommentFormProps {
  answerId: string;
  parentCommentId?: string | null;
  onCommentCreated: () => void;
  onCancel?: () => void;
  placeholder?: string;
}

export default function CommentForm({
  answerId,
  parentCommentId = null,
  onCommentCreated,
  onCancel,
  placeholder,
}: CommentFormProps) {
  const { user } = useAuth();
  const { language } = useI18n();
  const { toast } = useToast();
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast({
        title: language === 'ar' ? 'تسجيل الدخول مطلوب' : 'Login Required',
        description:
          language === 'ar'
            ? 'يجب عليك تسجيل الدخول لإضافة تعليق'
            : 'You must be logged in to comment',
        variant: 'destructive',
      });
      return;
    }

    if (!user.role || !user.gender) {
      toast({
        title: language === 'ar' ? 'أكمل ملفك الشخصي' : 'Complete Your Profile',
        description:
          language === 'ar'
            ? 'يجب عليك إكمال دورك وجنسك في ملفك الشخصي أولاً'
            : 'You must complete your role and gender in your profile first',
        variant: 'destructive',
      });
      return;
    }

    if (!content.trim()) {
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
      const commentRequest: CreateCommentRequest = {
        answer_id: answerId,
        parent_comment_id: parentCommentId,
        content: content.trim(),
      };

      const author = {
        id: user.id,
        name: user.name,
        role: user.role,
        establishment_name: user.establishment_name,
        track: user.track,
        level: user.level,
        university_id: user.university_id,
        avatar_url: user.avatar_url,
        is_admin: user.is_admin,
      };

      await createComment(commentRequest, author);

      toast({
        title: language === 'ar' ? 'نجح' : 'Success',
        description:
          language === 'ar' ? 'تم إضافة التعليق بنجاح' : 'Comment added successfully',
      });

      setContent('');
      onCommentCreated();
    } catch (error) {
      console.error('Error creating comment:', error);
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description:
          language === 'ar'
            ? 'فشل في إضافة التعليق. حاول مرة أخرى.'
            : 'Failed to add comment. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={
          placeholder ||
          (language === 'ar' ? 'اكتب تعليقك...' : 'Write your comment...')
        }
        rows={3}
        className="resize-none"
        disabled={isSubmitting}
      />
      <div className="flex gap-2 justify-end">
        {onCancel && (
          <Button type="button" variant="outline" size="sm" onClick={onCancel}>
            {language === 'ar' ? 'إلغاء' : 'Cancel'}
          </Button>
        )}
        <Button type="submit" size="sm" disabled={isSubmitting || !content.trim()}>
          {isSubmitting
            ? language === 'ar'
              ? 'جاري الإرسال...'
              : 'Posting...'
            : language === 'ar'
            ? 'إرسال'
            : 'Post'}
        </Button>
      </div>
    </form>
  );
}
