import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from './ui/dialog';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { useToast } from '@/hooks/use-toast';
import { submitCommunityReport } from '@/lib/communityApi';

interface ReportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  contentType: 'post' | 'answer';
  contentId: string;
  contentTitle?: string;
}

export default function ReportDialog({
  isOpen,
  onClose,
  contentType,
  contentId,
  contentTitle,
}: ReportDialogProps) {
  const { user } = useAuth();
  const { language } = useI18n();
  const { toast } = useToast();
  const [reason, setReason] = useState<string>('spam');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const reasonOptions = [
    {
      value: 'spam',
      label: language === 'ar' ? 'محتوى غير مرغوب فيه' : 'Spam',
    },
    {
      value: 'inappropriate',
      label: language === 'ar' ? 'محتوى غير لائق' : 'Inappropriate Content',
    },
    {
      value: 'harassment',
      label: language === 'ar' ? 'تحرش أو تنمر' : 'Harassment or Bullying',
    },
    {
      value: 'misinformation',
      label: language === 'ar' ? 'معلومات خاطئة' : 'Misinformation',
    },
    {
      value: 'other',
      label: language === 'ar' ? 'أخرى' : 'Other',
    },
  ];

  const handleSubmit = async () => {
    if (!user) {
      toast({
        title: language === 'ar' ? 'تسجيل الدخول مطلوب' : 'Login Required',
        description:
          language === 'ar'
            ? 'يجب عليك تسجيل الدخول للإبلاغ عن محتوى'
            : 'You must be logged in to report content',
        variant: 'destructive',
      });
      return;
    }

    if (!description.trim() && reason === 'other') {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description:
          language === 'ar'
            ? 'الرجاء تقديم وصف للسبب'
            : 'Please provide a description for the reason',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const reportRequest = {
        target_type: contentType,
        target_id: contentId,
        reason,
        target_title: contentTitle,
        target_excerpt: description.trim() || undefined,
      };

      const reporter = {
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

      await submitCommunityReport(reportRequest, reporter);

      toast({
        title: language === 'ar' ? 'نجح' : 'Success',
        description:
          language === 'ar'
            ? 'تم إرسال البلاغ بنجاح. سيتم مراجعته قريباً.'
            : 'Report submitted successfully. It will be reviewed soon.',
      });

      onClose();
      setReason('spam');
      setDescription('');
    } catch (error) {
      console.error('Error submitting report:', error);
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description:
          language === 'ar'
            ? 'فشل في إرسال البلاغ. حاول مرة أخرى.'
            : 'Failed to submit report. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {language === 'ar' ? 'الإبلاغ عن محتوى' : 'Report Content'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {contentTitle && (
            <div className="text-sm text-muted-foreground">
              <span className="font-medium">
                {language === 'ar' ? 'المحتوى: ' : 'Content: '}
              </span>
              {contentTitle}
            </div>
          )}

          <div className="space-y-3">
            <Label>
              {language === 'ar' ? 'سبب الإبلاغ' : 'Reason for Report'}
            </Label>
            <RadioGroup value={reason} onValueChange={setReason}>
              {reasonOptions.map((option) => (
                <div key={option.value} className="flex items-center space-x-2 space-x-reverse">
                  <RadioGroupItem value={option.value} id={option.value} />
                  <Label htmlFor={option.value} className="cursor-pointer">
                    {option.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">
              {language === 'ar'
                ? 'وصف إضافي (اختياري)'
                : 'Additional Description (Optional)'}
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={
                language === 'ar'
                  ? 'قدم المزيد من التفاصيل حول البلاغ...'
                  : 'Provide more details about the report...'
              }
              rows={4}
              disabled={isSubmitting}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              onClose();
              setReason('spam');
              setDescription('');
            }}
            disabled={isSubmitting}
          >
            {language === 'ar' ? 'إلغاء' : 'Cancel'}
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting} variant="destructive">
            {isSubmitting
              ? language === 'ar'
                ? 'جاري الإرسال...'
                : 'Submitting...'
              : language === 'ar'
              ? 'إرسال البلاغ'
              : 'Submit Report'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
