import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Flag } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useI18n } from '@/contexts/I18nContext';
import { getUserReport } from '@/lib/communityApi';
import ReportDialog from './ReportDialog';

interface ReportButtonProps {
  contentType: 'post' | 'answer';
  contentId: string;
  contentTitle?: string;
  authorId: string;
  variant?: 'default' | 'ghost' | 'outline';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export default function ReportButton({
  contentType,
  contentId,
  contentTitle,
  authorId,
  variant = 'ghost',
  size = 'sm',
}: ReportButtonProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { language } = useI18n();
  const [hasReported, setHasReported] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Don't show report button if user is the author
  if (user && user.id === authorId) {
    return null;
  }

  useEffect(() => {
    if (user) {
      checkReportStatus();
    }
  }, [user, contentId]);

  const checkReportStatus = async () => {
    if (!user) return;

    try {
      const report = await getUserReport(contentType, contentId, user.id);
      setHasReported(!!report);
    } catch (error) {
      console.error('Error checking report status:', error);
    }
  };

  const handleClick = () => {
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

    if (hasReported) {
      toast({
        title: language === 'ar' ? 'تم الإبلاغ مسبقاً' : 'Already Reported',
        description:
          language === 'ar'
            ? 'لقد قمت بالفعل بالإبلاغ عن هذا المحتوى'
            : 'You have already reported this content',
      });
      return;
    }

    setIsDialogOpen(true);
  };

  const handleReportSubmitted = () => {
    setHasReported(true);
    setIsDialogOpen(false);
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={handleClick}
        disabled={hasReported}
        className="gap-2"
      >
        <Flag className={`h-4 w-4 ${hasReported ? 'text-red-500' : ''}`} />
        {hasReported
          ? language === 'ar'
            ? 'تم الإبلاغ'
            : 'Reported'
          : language === 'ar'
          ? 'إبلاغ'
          : 'Report'}
      </Button>

      <ReportDialog
        isOpen={isDialogOpen}
        onClose={handleReportSubmitted}
        contentType={contentType}
        contentId={contentId}
        contentTitle={contentTitle}
      />
    </>
  );
}
