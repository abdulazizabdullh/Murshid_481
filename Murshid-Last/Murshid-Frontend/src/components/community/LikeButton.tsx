import { useState, useEffect } from "react";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useI18n } from "@/contexts/I18nContext";
import { useAuth } from "@/contexts/AuthContext";

interface LikeButtonProps {
  itemId: string;
  itemType: "post" | "answer" | "comment";
  initialLikesCount: number;
  initialIsLiked: boolean;
  onLike: (itemId: string, userId: string) => Promise<void>;
  onUnlike: (itemId: string, userId: string) => Promise<void>;
  disabled?: boolean;
  onLikeChange?: (itemId: string, newCount: number, isLiked: boolean) => void;
}

export const LikeButton = ({
  itemId,
  itemType,
  initialLikesCount,
  initialIsLiked,
  onLike,
  onUnlike,
  disabled = false,
  onLikeChange,
}: LikeButtonProps) => {
  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [likesCount, setLikesCount] = useState(initialLikesCount);
  const [isLoading, setIsLoading] = useState(false);

  const { user } = useAuth();
  const { language } = useI18n();

  // Update state when initialIsLiked changes (e.g., when data is loaded)
  useEffect(() => {
    setIsLiked(initialIsLiked);
  }, [initialIsLiked]);

  // Update state when initialLikesCount changes
  useEffect(() => {
    setLikesCount(initialLikesCount);
  }, [initialLikesCount]);

  const handleToggleLike = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent event from bubbling to parent card
    
    if (!user) {
      toast.error(language === "ar" ? "يجب تسجيل الدخول أولاً" : "Please log in first");
      return;
    }

    if (disabled) {
      toast.error(
        language === "ar"
          ? "الرجاء إكمال ملفك الشخصي للتفاعل"
          : "Please complete your profile to interact"
      );
      return;
    }

    setIsLoading(true);

    try {
      if (isLiked) {
        // Optimistic update
        setIsLiked(false);
        const newCount = Math.max(0, likesCount - 1);
        setLikesCount(newCount);

        await onUnlike(itemId, user.id);

        // Notify parent component
        onLikeChange?.(itemId, newCount, false);
      } else {
        // Optimistic update
        setIsLiked(true);
        const newCount = likesCount + 1;
        setLikesCount(newCount);

        await onLike(itemId, user.id);

        // Notify parent component
        onLikeChange?.(itemId, newCount, true);
      }
    } catch (error) {
      // Revert optimistic update on error
      setIsLiked((prev) => !prev);
      setLikesCount((prev) => (isLiked ? prev + 1 : Math.max(0, prev - 1)));

      console.error(`Error toggling like on ${itemType}:`, error);
      toast.error(
        language === "ar"
          ? "فشل في تحديث الإعجاب"
          : "Failed to update like"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleToggleLike}
      disabled={isLoading || !user}
      className={`flex items-center gap-1 ${
        isLiked
          ? "text-red-500 hover:text-red-600"
          : "text-gray-500 hover:text-red-500"
      } transition-all duration-200`}
      aria-label={
        isLiked
          ? language === "ar"
            ? "إلغاء الإعجاب"
            : "Unlike"
          : language === "ar"
          ? "إعجاب"
          : "Like"
      }
    >
      <Heart
        className={`w-4 h-4 transition-all duration-200 ${
          isLiked ? "fill-current scale-110" : "scale-100"
        }`}
        strokeWidth={isLiked ? 0 : 2}
      />
      <span className="text-sm font-medium">{likesCount}</span>
    </Button>
  );
};
