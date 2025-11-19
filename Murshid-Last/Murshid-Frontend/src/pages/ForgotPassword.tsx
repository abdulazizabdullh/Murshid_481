import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, Mail } from "lucide-react";
import { z } from "zod";
import { useI18n } from "@/contexts/I18nContext";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { t, language } = useI18n();

  const emailSchema = useMemo(
    () =>
      z.object({
        email: z.string().email(t("auth.errors.validEmail")),
      }),
    [language, t],
  );

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      emailSchema.parse({ email });
      setLoading(true);

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) {
        throw error;
      }

      setSent(true);
      toast.success(t("auth.forgot.success"));
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        toast.error(t("auth.forgot.error"));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-blue-900/30 p-4"
      dir={language}
    >
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center gap-3 mb-4 overflow-hidden h-24">
            <img 
              src="/murshid-logo.png" 
              alt="Murshid Logo" 
              className="h-36 object-contain dark:brightness-0 dark:invert dark:opacity-90"
            />
          </div>
          <p className="text-muted-foreground">{t("auth.tagline")}</p>
        </div>
        
        <Card className="w-full border-border/50 shadow-[var(--shadow-soft)]">
          <CardHeader className="space-y-1">
            <div className="flex items-center gap-2 mb-2">
              <Link to="/login" id="forgot-password-back-to-login-link">
                <Button variant="ghost" size="sm" id="forgot-password-back-to-login-button">
                  <ArrowLeft className={`w-4 h-4 ${language === "ar" ? "ml-2 rotate-180" : "mr-2"}`} />
                  {t("auth.actions.backToLogin")}
                </Button>
              </Link>
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {t("auth.forgot.title")}
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-300">
              {sent 
                ? t("auth.forgot.sentDescription")
                : t("auth.forgot.description")
              }
            </CardDescription>
          </CardHeader>
        <CardContent>
          {!sent ? (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="forgot-password-email">{t("auth.fields.email")}</Label>
                <div className="relative">
                  <Mail
                    className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground ${
                      language === "ar" ? "right-3" : "left-3"
                    }`}
                  />
                  <Input
                    id="forgot-password-email"
                    type="email"
                    placeholder={t("auth.placeholders.email")}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={language === "ar" ? "pr-10" : "pl-10"}
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                id="forgot-password-submit-button"
                className="w-full bg-gradient-to-r from-blue-400 to-blue-500 hover:from-blue-500 hover:to-blue-600 text-white rounded-2xl px-8 py-6 shadow-lg"
                disabled={loading}
              >
                {loading ? t("auth.forgot.sending") : t("auth.forgot.send")}
              </Button>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-primary/10 rounded-lg text-center">
                <p className="text-sm text-muted-foreground">
                  {t("auth.forgot.sentInfo", { email })}
                </p>
              </div>
              <Button
                variant="outline"
                id="forgot-password-try-another-button"
                className="w-full rounded-2xl px-8 py-6 border-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400"
                onClick={() => setSent(false)}
              >
                {t("auth.forgot.tryAnother")}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      </div>
    </div>
  );
};

export default ForgotPassword;
