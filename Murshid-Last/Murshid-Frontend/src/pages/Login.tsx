import { useMemo, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Shield, ArrowLeft, Languages } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { z } from "zod";
import { toast } from "sonner";
import PasswordInput from "@/components/PasswordInput";
import { useI18n } from "@/contexts/I18nContext";
import { PageAnimation } from "@/components/animations/PageAnimation";
import { ScrollAnimation } from "@/components/animations/ScrollAnimation";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { user, login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const { t, language, setLanguage } = useI18n();

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'ar' : 'en');
  };

  const loginSchema = useMemo(
    () =>
      z.object({
        email: z.string().trim().email({ message: t("auth.errors.invalidEmail") }).max(255),
        password: z
          .string()
          .min(6, { message: t("auth.errors.passwordMin", { count: 6 }) })
          .max(100),
      }),
    [language, t],
  );

  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      loginSchema.parse({ email, password });
      setIsLoading(true);
      await login(email, password);
    } catch (error) {
      if (error instanceof z.ZodError) {
        error.errors.forEach((err) => toast.error(err.message));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
    } catch (error) {
      console.error("Google login error:", error);
    }
  };

  return (
    <PageAnimation>
      <div
        className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-blue-900/30 p-4"
        dir={language}
      >
        {/* Language Toggle Button - Fixed Position */}
        <div className="fixed top-4 right-4 z-50">
          <Button
            variant="outline"
            size="sm"
            onClick={toggleLanguage}
            className="rounded-full px-4 py-2 border-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400"
          >
            <Languages className="w-4 h-4 mr-2" />
            {language === 'en' ? 'عربي' : 'English'}
          </Button>
        </div>

        <ScrollAnimation>
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

        <Card className="border-border/50 shadow-[var(--shadow-soft)]">
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <Link to="/" id="login-back-to-home-link">
                <Button 
                  variant="outline"
                  className="rounded-2xl px-3 py-6 border-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400"
                  id="login-back-to-home-button"
                >
                  <ArrowLeft className={`w-4 h-4 ${language === "ar" ? "ml-2 rotate-180" : "mr-2"}`} />
                  {t("auth.actions.backToHome")}
                </Button>
              </Link>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-gray-900 dark:text-gray-100">{t("auth.login.title")}</CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-300">
                  {t("auth.login.subtitle")}
                </CardDescription>
              </div>
              <Shield className="w-8 h-8 text-muted-foreground/30" />
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email" className="text-gray-900 dark:text-gray-200">
                  {t("auth.fields.email")}
                </Label>
                <Input
                  id="login-email"
                  type="email"
                  placeholder={t("auth.placeholders.email")}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-password" className="text-gray-900 dark:text-gray-200">
                  {t("auth.fields.password")}
                </Label>
                <PasswordInput
                  id="login-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
              <Button
                type="submit"
                id="login-submit-button"
                className="w-full bg-gradient-to-r from-blue-400 to-blue-500 hover:from-blue-500 hover:to-blue-600 text-white rounded-2xl px-8 py-6 shadow-lg"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2
                      className={`${language === "ar" ? "ml-2" : "mr-2"} h-4 w-4 animate-spin`}
                    />
                    {t("auth.login.loading")}
                  </>
                ) : (
                  t("auth.login.submit")
                )}
              </Button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  {language === "ar" ? "أو" : "Or"}
                </span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full rounded-2xl px-8 py-6 border-2"
              onClick={handleGoogleLogin}
              disabled={isLoading}
            >
              <svg className={`${language === "ar" ? "ml-2" : "mr-2"} h-5 w-5`} viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              {language === "ar" ? "تسجيل الدخول باستخدام Google" : "Continue with Google"}
            </Button>

            <div className="text-center mt-4 space-y-2">
              <p className="text-sm text-muted-foreground">
                {t("auth.login.noAccount") + " "}
                <Link to="/signup" id="login-signup-link" className="text-primary hover:underline font-semibold">
                  {t("auth.login.signUp")}
                </Link>
              </p>
              <p className="text-sm text-muted-foreground">
                <Link to="/forgot-password" id="login-forgot-password-link" className="text-primary hover:underline font-semibold">
                  {t("auth.login.forgot")}
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-6">
          {t("auth.common.agreement")}
        </p>
          </div>
        </ScrollAnimation>
      </div>
    </PageAnimation>
  );
};

export default Login;
