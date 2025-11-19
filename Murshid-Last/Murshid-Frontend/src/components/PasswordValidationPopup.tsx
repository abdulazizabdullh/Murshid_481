import { Check, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useMemo } from "react";
import { useI18n } from "@/contexts/I18nContext";

interface PasswordValidationPopupProps {
  password: string;
  isVisible: boolean;
}

interface ValidationRule {
  id: string;
  text: string;
  isValid: boolean;
}

const PasswordValidationPopup = ({ password, isVisible }: PasswordValidationPopupProps) => {
  const { t, language } = useI18n();

  const validationRules = useMemo<ValidationRule[]>(
    () => [
      {
        id: "length",
        text: t("auth.passwordRules.length"),
        isValid: password.length >= 8,
      },
      {
        id: "uppercase",
        text: t("auth.passwordRules.uppercase"),
        isValid: /[A-Z]/.test(password),
      },
      {
        id: "lowercase",
        text: t("auth.passwordRules.lowercase"),
        isValid: /[a-z]/.test(password),
      },
    ],
    [password, language, t],
  );

  if (!isVisible || password.length === 0) {
    return null;
  }

  return (
    <Card className="absolute top-full left-0 right-0 mt-2 z-50 border-border/50 shadow-lg" dir={language}>
      <CardContent className="p-4">
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-foreground mb-2">{t("auth.passwordRules.title")}</h4>
          {validationRules.map((rule) => (
            <div key={rule.id} className="flex items-center gap-2 text-sm">
              <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                rule.isValid ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
              }`}>
                {rule.isValid ? (
                  <Check className="w-3 h-3" />
                ) : (
                  <X className="w-3 h-3" />
                )}
              </div>
              <span className={rule.isValid ? 'text-green-600' : 'text-muted-foreground'}>
                {rule.text}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default PasswordValidationPopup;
