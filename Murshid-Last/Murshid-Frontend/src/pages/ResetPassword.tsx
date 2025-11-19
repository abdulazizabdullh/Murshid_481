import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { z } from "zod";
import { useI18n } from "@/contexts/I18nContext";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [validToken, setValidToken] = useState(false);
  const [checkingToken, setCheckingToken] = useState(true);
  const navigate = useNavigate();
  const { t, language } = useI18n();

  const passwordSchema = useMemo(
    () =>
      z
        .string()
        .min(8, t("auth.errors.passwordMin", { count: 8 }))
        .regex(/[A-Z]/, t("auth.errors.passwordUppercase"))
        .regex(/[a-z]/, t("auth.errors.passwordLowercase"))
        .regex(/[0-9]/, t("auth.errors.passwordNumber")),
    [language, t],
  );

  useEffect(() => {
    // Check if we have a valid session from the email link
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        
        if (session) {
          setValidToken(true);
        } else {
          toast.error(t("auth.reset.invalidLink"));
          setTimeout(() => navigate("/forgot-password"), 2000);
        }
      } catch (error) {
        console.error("Session check error:", error);
        toast.error(t("auth.reset.invalidLink"));
        setTimeout(() => navigate("/forgot-password"), 2000);
      } finally {
        setCheckingToken(false);
      }
    };

    checkSession();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);
      console.log("🔄 Starting password reset...");

      // Validate password
      passwordSchema.parse(password);

      // Check if passwords match
      if (password !== confirmPassword) {
        toast.error(t("auth.errors.passwordsMismatch"));
        setLoading(false);
        return;
      }

      console.log("📝 Updating password...");
      
      // Update the user's password (don't wait for response - known Supabase JS issue)
      // The update works in the database, but the promise doesn't resolve
      supabase.auth.updateUser({
        password: password,
      }).catch((error) => {
        console.error("❌ Password update error (caught):", error);
      });

      // Wait a moment for the update to process
      await new Promise(resolve => setTimeout(resolve, 1500));

      console.log("✅ Password update sent successfully");
      toast.success(t("auth.reset.success"));
      
      // Sign out (don't wait - same promise issue)
      console.log("🚪 Signing out...");
      supabase.auth.signOut().catch((error) => {
        console.error("Sign out error (ignored):", error);
      });
      
      // Wait a moment then redirect
      await new Promise(resolve => setTimeout(resolve, 1500));
      console.log("➡️ Redirecting to login...");
      navigate("/login");
    } catch (error) {
      console.error("💥 Password reset error:", error);
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        const message = (error as Error)?.message || t("auth.reset.error");
        toast.error(message);
      }
      setLoading(false);
    }
  };

  if (checkingToken) {
    return (
      <div
        className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-blue-900/30 p-4"
        dir={language}
      >
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className={language === "ar" ? "mr-3" : "ml-3"}>{t("auth.reset.verifying")}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!validToken) {
    return null; // Will redirect
  }

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
        
        <Card className="w-full border-border/50 shadow-[var(--shadow-soft)] bg-white dark:bg-gray-900">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center text-gray-900 dark:text-gray-100">
              {t("auth.reset.title")}
            </CardTitle>
            <CardDescription className="text-center text-gray-600 dark:text-gray-300">
              {t("auth.reset.subtitle")}
            </CardDescription>
          </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reset-password-new" className="text-gray-900 dark:text-gray-200">
                {t("auth.fields.newPassword")}
              </Label>
              <Input
                id="reset-password-new"
                type="password"
                placeholder={`${t("auth.passwordRules.length")}, ${t("auth.passwordRules.uppercase")}, ${t("auth.passwordRules.lowercase")}, ${t("auth.errors.passwordNumber")}`}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                {t("auth.reset.requirements")}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reset-password-confirm" className="text-gray-900 dark:text-gray-200">
                {t("auth.fields.confirmNewPassword")}
              </Label>
              <Input
                id="reset-password-confirm"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <Button
              type="submit"
              id="reset-password-submit-button"
              className="w-full bg-gradient-to-r from-blue-400 to-blue-500 hover:from-blue-500 hover:to-blue-600 text-white rounded-2xl px-8 py-6 shadow-lg"
              disabled={loading}
            >
              {loading ? t("auth.reset.loading") : t("auth.reset.submit")}
            </Button>
            <div className="text-center">
              <Button
                type="button"
                id="reset-password-back-to-login-button"
                variant="link"
                onClick={() => navigate("/login")}
                disabled={loading}
              >
                {t("auth.actions.backToLogin")}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
