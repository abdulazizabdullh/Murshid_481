import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useI18n } from "@/contexts/I18nContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createReport } from "@/lib/communityApi";
import type { ReportReason, ReportContentType } from "@/types/community";

interface ReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contentType: ReportContentType;
  contentId: string;
  contentTitle?: string; // For display in dialog (e.g., post title)
}

const ReportDialog = ({
  open,
  onOpenChange,
  contentType,
  contentId,
  contentTitle,
}: ReportDialogProps) => {
  const { user } = useAuth();
  const { language } = useI18n();
  const [reason, setReason] = useState<ReportReason | "">("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const reportReasons: { value: ReportReason; label: { en: string; ar: string } }[] = [
    {
      value: "spam",
      label: { en: "Spam or advertising", ar: "رسائل غير مرغوب فيها أو إعلانات" },
    },
    {
      value: "harassment",
      label: { en: "Harassment or hate speech", ar: "تحرش أو خطاب كراهية" },
    },
    {
      value: "inappropriate",
      label: { en: "Inappropriate content", ar: "محتوى غير لائق" },
    },
    {
      value: "misinformation",
      label: { en: "Misinformation", ar: "معلومات مضللة" },
    },
  ];

  const contentTypeLabels = {
    post: { en: "post", ar: "المنشور" },
    answer: { en: "answer", ar: "الإجابة" },
    comment: { en: "comment", ar: "التعليق" },
  };

  const handleSubmit = async () => {
    if (!user) {
      toast.error(language === "ar" ? "يجب تسجيل الدخول أولاً" : "You must be logged in");
      return;
    }

    if (!reason) {
      toast.error(
        language === "ar" ? "الرجاء اختيار سبب البلاغ" : "Please select a reason for reporting"
      );
      return;
    }

    try {
      setSubmitting(true);

      await createReport(
        {
          reported_content_type: contentType,
          reported_content_id: contentId,
          reason: reason as ReportReason,
          description: description.trim() || undefined,
        },
        user.id,
        user.name
      );

      toast.success(
        language === "ar"
          ? "تم إرسال البلاغ بنجاح. سيتم مراجعته من قبل المشرفين."
          : "Report submitted successfully. It will be reviewed by moderators."
      );

      // Reset and close
      setReason("");
      setDescription("");
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error submitting report:", error);
      if (error.message?.includes("already reported")) {
        toast.error(
          language === "ar"
            ? "لقد قمت بالفعل بالإبلاغ عن هذا المحتوى"
            : "You have already reported this content"
        );
      } else {
        toast.error(
          language === "ar"
            ? "فشل إرسال البلاغ. الرجاء المحاولة مرة أخرى."
            : "Failed to submit report. Please try again."
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    setReason("");
    setDescription("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]" dir={language}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-orange-600" />
            {language === "ar"
              ? `الإبلاغ عن ${contentTypeLabels[contentType].ar}`
              : `Report ${contentTypeLabels[contentType].en}`}
          </DialogTitle>
          <DialogDescription dir={language}>
            {contentTitle && (
              <span className="block font-semibold text-foreground mb-2">"{contentTitle}"</span>
            )}
            {language === "ar"
              ? "ساعدنا في الحفاظ على مجتمع آمن ومحترم. اختر سبب البلاغ أدناه."
              : "Help us maintain a safe and respectful community. Select a reason below."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Reason Selection */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">
              {language === "ar" ? "سبب البلاغ" : "Reason"}
              <span className="text-red-500 ml-1">*</span>
            </Label>
            <RadioGroup value={reason} onValueChange={(value) => setReason(value as ReportReason)}>
              {reportReasons.map((item) => (
                <div key={item.value} className="flex items-center space-x-2 space-x-reverse">
                  <RadioGroupItem value={item.value} id={item.value} />
                  <Label htmlFor={item.value} className="font-normal cursor-pointer">
                    {language === "ar" ? item.label.ar : item.label.en}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Optional Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-base font-semibold">
              {language === "ar" ? "تفاصيل إضافية (اختياري)" : "Additional details (optional)"}
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={
                language === "ar"
                  ? "يمكنك إضافة تفاصيل إضافية لمساعدتنا في فهم البلاغ..."
                  : "You can add more details to help us understand the issue..."
              }
              rows={4}
              maxLength={500}
              dir={language}
            />
            <p className="text-sm text-muted-foreground text-right">
              {description.length}/500
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleCancel} disabled={submitting}>
            {language === "ar" ? "إلغاء" : "Cancel"}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!reason || submitting}
            className="bg-orange-600 hover:bg-orange-700"
          >
            {submitting ? (
              <>
                <Loader2 className={`w-4 h-4 ${language === "ar" ? "ml-2" : "mr-2"} animate-spin`} />
                {language === "ar" ? "جاري الإرسال..." : "Submitting..."}
              </>
            ) : (
              <>
                <AlertCircle className={`w-4 h-4 ${language === "ar" ? "ml-2" : "mr-2"}`} />
                {language === "ar" ? "إرسال البلاغ" : "Submit Report"}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ReportDialog;
