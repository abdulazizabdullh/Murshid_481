import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from './ui/dialog';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { useI18n } from '@/contexts/I18nContext';
import { useToast } from '@/hooks/use-toast';
import { updateCommunityAnswer } from '@/lib/communityApi';
import { Answer } from '@/types/community';

interface EditAnswerModalProps {
  answer: Answer;
  isOpen: boolean;
  onClose: () => void;
  onAnswerUpdated: () => void;
}

export default function EditAnswerModal({
  answer,
  isOpen,
  onClose,
  onAnswerUpdated,
}: EditAnswerModalProps) {
  const { language } = useI18n();
  const { toast } = useToast();
  const [content, setContent] = useState(answer.content);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim()) {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description:
          language === 'ar'
            ? 'المحتوى مطلوب'
            : 'Content is required',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await updateCommunityAnswer(answer.id, {
        content: content.trim(),
      });

      toast({
        title: language === 'ar' ? 'نجح' : 'Success',
        description:
          language === 'ar'
            ? 'تم تحديث الإجابة بنجاح'
            : 'Answer updated successfully',
      });

      onAnswerUpdated();
      onClose();
    } catch (error) {
      console.error('Error updating answer:', error);
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description:
          language === 'ar'
            ? 'فشل في تحديث الإجابة. حاول مرة أخرى.'
            : 'Failed to update answer. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {language === 'ar' ? 'تعديل الإجابة' : 'Edit Answer'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="content">
              {language === 'ar' ? 'المحتوى' : 'Content'} *
            </Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={
                language === 'ar'
                  ? 'اكتب محتوى الإجابة...'
                  : 'Write your answer content...'
              }
              rows={10}
              disabled={isSubmitting}
              className="resize-none"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            {language === 'ar' ? 'إلغاء' : 'Cancel'}
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !content.trim()}>
            {isSubmitting
              ? language === 'ar'
                ? 'جاري الحفظ...'
                : 'Saving...'
              : language === 'ar'
              ? 'حفظ التغييرات'
              : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
