import { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { Button } from './ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useI18n } from '@/contexts/I18nContext';
import {
  likePost,
  unlikePost,
  getUserPostLike,
  likeAnswer,
  unlikeAnswer,
  getUserAnswerLike,
  likeComment,
  unlikeComment,
  getUserCommentLike,
} from '@/lib/communityApi';

interface LikeButtonProps {
  contentType: 'post' | 'answer' | 'comment';
  contentId: string;
  initialLikesCount: number;
  onLikeChange?: (newCount: number) => void;
  variant?: 'default' | 'ghost' | 'outline';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showCount?: boolean;
}

export default function LikeButton({
  contentType,
  contentId,
  initialLikesCount,
  onLikeChange,
  variant = 'ghost',
  size = 'sm',
  showCount = true,
}: LikeButtonProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t, language } = useI18n();
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(initialLikesCount);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      checkLikeStatus();
    }
  }, [user, contentId]);

  const checkLikeStatus = async () => {
    if (!user) return;

    try {
      let liked = false;
      switch (contentType) {
        case 'post':
          liked = await getUserPostLike(contentId, user.id);
          break;
        case 'answer':
          liked = await getUserAnswerLike(contentId, user.id);
          break;
        case 'comment':
          liked = await getUserCommentLike(contentId, user.id);
          break;
      }
      setIsLiked(liked);
    } catch (error) {
      console.error('Error checking like status:', error);
    }
  };

  const handleLike = async () => {
    if (!user) {
      toast({
        title: language === 'ar' ? 'تسجيل الدخول مطلوب' : 'Login Required',
        description:
          language === 'ar'
            ? 'يجب عليك تسجيل الدخول للإعجاب بالمحتوى'
            : 'You must be logged in to like content',
        variant: 'destructive',
      });
      return;
    }

    // Check profile completion
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

    setIsLoading(true);

    try {
      if (isLiked) {
        // Unlike
        switch (contentType) {
          case 'post':
            await unlikePost(contentId, user.id);
            break;
          case 'answer':
            await unlikeAnswer(contentId, user.id);
            break;
          case 'comment':
            await unlikeComment(contentId, user.id);
            break;
        }
        setIsLiked(false);
        const newCount = Math.max(likesCount - 1, 0);
        setLikesCount(newCount);
        onLikeChange?.(newCount);
      } else {
        // Like
        switch (contentType) {
          case 'post':
            await likePost(contentId, user.id);
            break;
          case 'answer':
            await likeAnswer(contentId, user.id);
            break;
          case 'comment':
            await likeComment(contentId, user.id);
            break;
        }
        setIsLiked(true);
        const newCount = likesCount + 1;
        setLikesCount(newCount);
        onLikeChange?.(newCount);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description:
          language === 'ar'
            ? 'فشل في تحديث الإعجاب. حاول مرة أخرى.'
            : 'Failed to update like. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleLike}
      disabled={isLoading}
      className="gap-2"
    >
      <Heart
        className={`h-4 w-4 ${isLiked ? 'fill-red-500 text-red-500' : ''}`}
      />
      {showCount && <span>{likesCount}</span>}
    </Button>
  );
}
