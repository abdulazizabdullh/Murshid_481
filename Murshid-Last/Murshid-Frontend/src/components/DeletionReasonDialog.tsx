import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { useI18n } from "@/contexts/I18nContext";

interface DeletionReasonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: string) => Promise<void>;
  itemType: "post" | "answer" | "comment";
  itemTitle?: string;
  deleting: boolean;
}

export function DeletionReasonDialog({
  open,
  onOpenChange,
  onConfirm,
  itemType,
  itemTitle,
  deleting,
}: DeletionReasonDialogProps) {
  const { language } = useI18n();
  const [reason, setReason] = useState("");

  const handleConfirm = async () => {
    if (!reason.trim()) return;
    await onConfirm(reason.trim());
    setReason("");
  };

  const getTitle = () => {
    if (language === "ar") {
      return itemType === "post" ? "حذف منشور" : itemType === "answer" ? "حذف إجابة" : "حذف تعليق";
    }
    return itemType === "post" ? "Delete Post" : itemType === "answer" ? "Delete Answer" : "Delete Comment";
  };

  const getDescription = () => {
    if (language === "ar") {
      return "يرجى كتابة سبب الحذف. سيظهر هذا السبب للمستخدم.";
    }
    return "Please provide a reason for deletion. This will be visible to the user.";
  };

  const getPlaceholder = () => {
    if (language === "ar") {
      return "مثال: محتوى غير لائق، مخالف لسياسة المجتمع، إساءة، إلخ...";
    }
    return "Example: Inappropriate content, violates community policy, spam, etc...";
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent dir={language}>
        <AlertDialogHeader>
          <AlertDialogTitle>{getTitle()}</AlertDialogTitle>
          {itemTitle && (
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-2 font-normal">
              "{itemTitle}"
            </div>
          )}
          <AlertDialogDescription className="mt-4">
            {getDescription()}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="my-4">
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={getPlaceholder()}
            rows={4}
            className="resize-none"
            disabled={deleting}
            dir={language}
          />
          {!reason.trim() && (
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-2" dir={language}>
              {language === "ar" ? "السبب مطلوب" : "Reason is required"}
            </p>
          )}
        </div>

        <AlertDialogFooter dir={language}>
          <AlertDialogCancel disabled={deleting}>
            {language === "ar" ? "إلغاء" : "Cancel"}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={!reason.trim() || deleting}
            className="bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800"
          >
            {deleting
              ? language === "ar"
                ? "جاري الحذف..."
                : "Deleting..."
              : language === "ar"
              ? "حذف"
              : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
