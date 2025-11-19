import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useI18n } from "@/contexts/I18nContext";
import { Flag } from "lucide-react";
import { checkExistingReport } from "@/lib/communityApi";
import type { ReportContentType } from "@/types/community";
import ReportDialog from "./ReportDialog";

interface ReportButtonProps {
  contentType: ReportContentType;
  contentId: string;
  contentTitle?: string;
  asMenuItem?: boolean; // For use in dropdown menus
  className?: string;
  onReportSubmitted?: () => void;
}

const ReportButton = ({
  contentType,
  contentId,
  contentTitle,
  asMenuItem = false,
  className = "",
  onReportSubmitted,
}: ReportButtonProps) => {
  const { user } = useAuth();
  const { language } = useI18n();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [alreadyReported, setAlreadyReported] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkIfReported = async () => {
      if (!user) {
        setChecking(false);
        return;
      }

      try {
        const reported = await checkExistingReport(user.id, contentType, contentId);
        setAlreadyReported(reported);
      } catch (error) {
        console.error("Error checking existing report:", error);
      } finally {
        setChecking(false);
      }
    };

    checkIfReported();
  }, [user, contentType, contentId]);

  const handleOpenDialog = () => {
    if (!user) {
      return;
    }
    setDialogOpen(true);
  };

  const handleDialogClose = (open: boolean) => {
    setDialogOpen(open);
    if (!open && onReportSubmitted) {
      // Refresh the already reported status
      if (user) {
        checkExistingReport(user.id, contentType, contentId).then(setAlreadyReported);
      }
      onReportSubmitted();
    }
  };

  if (!user || checking) {
    return null;
  }

  const label = language === "ar" ? "إبلاغ" : "Report";
  const alreadyReportedLabel = language === "ar" ? "تم الإبلاغ" : "Reported";

  if (asMenuItem) {
    // For use in dropdown menus
    return (
      <>
        <button
          onClick={handleOpenDialog}
          disabled={alreadyReported}
          className={`w-full flex items-center gap-2 px-2 py-1.5 text-sm ${
            alreadyReported
              ? "text-muted-foreground cursor-not-allowed"
              : "text-orange-600 hover:text-orange-700 hover:bg-orange-50 dark:hover:bg-orange-950/20"
          } rounded-md transition-colors ${className}`}
        >
          <Flag className="w-4 h-4" />
          {alreadyReported ? alreadyReportedLabel : label}
        </button>
        <ReportDialog
          open={dialogOpen}
          onOpenChange={handleDialogClose}
          contentType={contentType}
          contentId={contentId}
          contentTitle={contentTitle}
        />
      </>
    );
  }

  // Standalone button
  return (
    <>
      <button
        onClick={handleOpenDialog}
        disabled={alreadyReported}
        className={`flex items-center gap-1 px-3 py-1.5 text-sm ${
          alreadyReported
            ? "text-muted-foreground cursor-not-allowed bg-gray-100 dark:bg-gray-800"
            : "text-orange-600 hover:text-orange-700 hover:bg-orange-50 dark:hover:bg-orange-950/20"
        } rounded-lg transition-colors ${className}`}
      >
        <Flag className="w-4 h-4" />
        {alreadyReported ? alreadyReportedLabel : label}
      </button>
      <ReportDialog
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        contentType={contentType}
        contentId={contentId}
        contentTitle={contentTitle}
      />
    </>
  );
};

export default ReportButton;
