import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useI18n } from "@/contexts/I18nContext";
import { toast } from "sonner";
import { createComment } from "@/lib/communityApi";
import type { CreateCommentRequest } from "@/types/community";

interface CommentFormProps {
  answerId: string;
  parentCommentId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
  placeholder?: string;
}

export const CommentForm = ({
  answerId,
  parentCommentId,
  onSuccess,
  onCancel,
  placeholder,
}: CommentFormProps) => {
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { user } = useAuth();
  const { language } = useI18n();

  const isProfileComplete = user && user.role && user.gender;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error(language === "ar" ? "يجب تسجيل الدخول أولاً" : "Please log in first");
      return;
    }

    if (!isProfileComplete) {
      toast.error(
        language === "ar"
          ? "الرجاء إكمال ملفك الشخصي قبل التعليق"
          : "Please complete your profile before commenting"
      );
      return;
    }

    const trimmedContent = content.trim();
    if (!trimmedContent) {
      toast.error(
        language === "ar"
          ? "الرجاء كتابة تعليق"
          : "Please write a comment"
      );
      return;
    }

    if (trimmedContent.length < 2) {
      toast.error(
        language === "ar"
          ? "التعليق قصير جداً"
          : "Comment is too short"
      );
      return;
    }

    if (trimmedContent.length > 1000) {
      toast.error(
        language === "ar"
          ? "التعليق طويل جداً (الحد الأقصى 1000 حرف)"
          : "Comment is too long (max 1000 characters)"
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const payload: CreateCommentRequest = {
        answer_id: answerId,
        parent_comment_id: parentCommentId,
        content: trimmedContent,
      };

      await createComment(payload, {
        id: user.id,
        name: user.name,
        role: user.role,
        establishment_name: user.establishment_name,
        track: user.track,
        level: user.level,
        university_id: user.university_id,
        avatar_url: user.avatar_url,
        is_admin: user.is_admin,
      });

      toast.success(
        language === "ar"
          ? "تم إضافة التعليق بنجاح"
          : "Comment added successfully"
      );

      setContent("");
      onSuccess?.();
    } catch (error) {
      console.error("Error creating comment:", error);
      toast.error(
        language === "ar"
          ? "فشل في إضافة التعليق"
          : "Failed to add comment"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="text-sm text-gray-500 dark:text-gray-400 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
        {language === "ar"
          ? "يجب تسجيل الدخول للتعليق"
          : "Please log in to comment"}
      </div>
    );
  }

  if (!isProfileComplete) {
    return (
      <div className="text-sm text-amber-600 dark:text-amber-400 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
        {language === "ar"
          ? "الرجاء إكمال ملفك الشخصي للتعليق"
          : "Please complete your profile to comment"}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={
          placeholder ||
          (language === "ar" ? "اكتب تعليقاً..." : "Write a comment...")
        }
        className="min-h-[80px] resize-none"
        disabled={isSubmitting}
        dir={language === "ar" ? "rtl" : "ltr"}
      />

      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {content.length}/1000
        </span>

        <div className="flex gap-2">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              {language === "ar" ? "إلغاء" : "Cancel"}
            </Button>
          )}

          <Button
            type="submit"
            size="sm"
            disabled={isSubmitting || !content.trim()}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {language === "ar" ? "جاري الإرسال..." : "Posting..."}
              </>
            ) : (
              language === "ar" ? "تعليق" : "Comment"
            )}
          </Button>
        </div>
      </div>
    </form>
  );
};
