import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/contexts/I18nContext";
import { toast } from "sonner";
import { updateCommunityAnswer } from "@/lib/communityApi";
import type { Answer, UpdateAnswerRequest } from "@/types/community";

interface EditAnswerModalProps {
  answer: Answer;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (updatedAnswer: Answer) => void;
}

export const EditAnswerModal = ({
  answer,
  isOpen,
  onClose,
  onSuccess,
}: EditAnswerModalProps) => {
  const [content, setContent] = useState(answer.content);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { language } = useI18n();

  // Reset form when modal opens with new answer
  useEffect(() => {
    if (isOpen) {
      setContent(answer.content);
    }
  }, [isOpen, answer]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedContent = content.trim();

    if (!trimmedContent) {
      toast.error(language === "ar" ? "المحتوى مطلوب" : "Content is required");
      return;
    }

    if (trimmedContent.length < 20) {
      toast.error(
        language === "ar"
          ? "المحتوى قصير جداً (20 حرف على الأقل)"
          : "Content is too short (minimum 20 characters)"
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const payload: UpdateAnswerRequest = {
        content: trimmedContent,
      };

      const updatedAnswer = await updateCommunityAnswer(answer.id, payload);

      toast.success(
        language === "ar"
          ? "تم تحديث الإجابة بنجاح"
          : "Answer updated successfully"
      );

      onSuccess?.(updatedAnswer);
      onClose();
    } catch (error) {
      console.error("Error updating answer:", error);
      toast.error(
        language === "ar"
          ? "فشل في تحديث الإجابة"
          : "Failed to update answer"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {language === "ar" ? "تعديل الإجابة" : "Edit Answer"}
          </DialogTitle>
          <DialogDescription>
            {language === "ar"
              ? "عدل محتوى إجابتك"
              : "Edit your answer content"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="edit-answer-content">
              {language === "ar" ? "المحتوى" : "Content"} <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="edit-answer-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={
                language === "ar"
                  ? "اكتب محتوى إجابتك هنا..."
                  : "Write your answer content here..."
              }
              className="min-h-[250px] resize-none"
              disabled={isSubmitting}
              dir={language === "ar" ? "rtl" : "ltr"}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {content.length}/5000
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              {language === "ar" ? "إلغاء" : "Cancel"}
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !content.trim()}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {language === "ar" ? "جاري الحفظ..." : "Saving..."}
                </>
              ) : (
                language === "ar" ? "حفظ التغييرات" : "Save Changes"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
