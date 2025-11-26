import { useMemo, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, BookOpen, Users, UserCheck, ArrowLeft, Languages } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { z } from "zod";
import { toast } from "sonner";
import PasswordValidationPopup from "@/components/PasswordValidationPopup";
import PasswordInput from "@/components/PasswordInput";
import { useI18n } from "@/contexts/I18nContext";
import { getUniversities } from "@/lib/universitiesApi";
import type { University } from "@/types/database";
import { PageAnimation } from "@/components/animations/PageAnimation";
import { ScrollAnimation } from "@/components/animations/ScrollAnimation";

const Signup = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [establishment_name, setEstablishmentName] = useState("");
  const [selectedUniversityId, setSelectedUniversityId] = useState<string>("");
  const [level, setLevel] = useState("");
  const [gender, setGender] = useState("");
  const [role, setRole] = useState("");
  const [student_type, setStudentType] = useState("");
  const [track, setTrack] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPasswordValidation, setShowPasswordValidation] = useState(false);
  const [specialistProofFile, setSpecialistProofFile] = useState<File | null>(null);
  const [universities, setUniversities] = useState<University[]>([]);
  const [loadingUniversities, setLoadingUniversities] = useState(false);

  const { user, signup, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const { t, language, setLanguage } = useI18n();

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'ar' : 'en');
  };

  const signupSchema = useMemo(
    () =>
      z
        .object({
          email: z.string().trim().email({ message: t("auth.errors.invalidEmail") }).max(255),
          password: z
            .string()
            .min(8, { message: t("auth.errors.passwordMin", { count: 8 }) })
            .max(100)
            .regex(/[A-Z]/, { message: t("auth.errors.passwordUppercase") })
            .regex(/[a-z]/, { message: t("auth.errors.passwordLowercase") }),
          name: z
            .string()
            .trim()
            .min(2, { message: t("auth.errors.nameMin", { count: 2 }) })
            .max(100),
          confirmPassword: z.string(),
          establishment_name: z.string().optional(),
          level: z.string().optional(),
          gender: z.string().optional(),
          role: z.string().optional(),
          student_type: z.string().optional(),
          track: z.string().optional(),
        })
        .refine((data) => data.password === data.confirmPassword, {
          message: t("auth.errors.passwordsMismatch"),
          path: ["confirmPassword"],
        }),
    [language, t],
  );

  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  // Load universities list (for Specialists)
  useEffect(() => {
    const load = async () => {
      try {
        setLoadingUniversities(true);
        const data = await getUniversities();
        setUniversities(data || []);
      } catch (e) {
        console.error('Failed to load universities', e);
      } finally {
        setLoadingUniversities(false);
      }
    };
    // Load once; list is reused when role toggles to Specialist
    load();
  }, []);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      signupSchema.parse({
        email,
        password,
        confirmPassword,
        name,
        establishment_name,
        level,
        gender,
        role,
        student_type,
        track,
      });
      setIsLoading(true);
      if (role === 'Specialist' && !specialistProofFile) {
        toast.error(language === 'ar' ? 'الرجاء رفع صورة إثبات قبل التسجيل' : 'Please upload a proof image before signing up');
        return;
      }
      if (role === 'Specialist' && !selectedUniversityId) {
        toast.error(language === 'ar' ? 'يرجى اختيار الجامعة' : 'Please select your university');
        return;
      }
      await signup(
        email,
        password,
        name,
        establishment_name,
        level,
        gender,
        role,
        student_type,
        track,
        specialistProofFile,
        role === 'Specialist' ? selectedUniversityId : null
      );
    } catch (error) {
      if (error instanceof z.ZodError) {
        error.errors.forEach((err) => toast.error(err.message));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    try {
      await loginWithGoogle();
    } catch (error) {
      console.error("Google signup error:", error);
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
              <Link to="/" id="signup-back-to-home-link">
                <Button 
                  variant="outline"
                  className="rounded-2xl px-3 py-6 border-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400"
                  id="signup-back-to-home-button"
                >
                  <ArrowLeft className={`w-4 h-4 ${language === "ar" ? "ml-2 rotate-180" : "mr-2"}`} />
                  {t("auth.actions.backToHome")}
                </Button>
              </Link>
            </div>
            <CardTitle className="text-gray-900 dark:text-gray-100">{t("auth.signup.title")}</CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-300">
              {t("auth.signup.subtitle")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignup} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signup-name" className="text-gray-900 dark:text-gray-200">
                  {t("auth.fields.name")}
                </Label>
                <Input
                  id="signup-name"
                  type="text"
                  placeholder={t("auth.placeholders.name")}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
              {/* Proof upload moved to the end of the form */}
              <div className="space-y-2">
                <Label htmlFor="signup-email" className="text-gray-900 dark:text-gray-200">
                  {t("auth.fields.email")}
                </Label>
                <Input
                  id="signup-email"
                  type="email"
                  placeholder={t("auth.placeholders.email")}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2 relative">
                <Label htmlFor="signup-password" className="text-gray-900 dark:text-gray-200">
                  {t("auth.fields.password")}
                </Label>
                <PasswordInput
                  id="signup-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setShowPasswordValidation(true)}
                  onBlur={() => setShowPasswordValidation(false)}
                  required
                  disabled={isLoading}
                />
                <PasswordValidationPopup 
                  password={password} 
                  isVisible={showPasswordValidation} 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-confirm-password" className="text-gray-900 dark:text-gray-200">
                  {t("auth.fields.confirmPassword")}
                </Label>
                <PasswordInput
                  id="signup-confirm-password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
              
              {/* Gender just after Confirm Password */}
              

              {/* Role selection just after Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="signup-role" className="text-gray-900 dark:text-gray-200">
                  {t("auth.fields.role")}
                </Label>
                <Select value={role} onValueChange={setRole} disabled={isLoading}>
                  <SelectTrigger id="signup-role">
                    <div className="flex items-center">
                      <UserCheck className="w-4 h-4 mr-2 text-muted-foreground" />
                      <SelectValue placeholder={t("auth.placeholders.role")} />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Student" id="signup-role-student">{t("auth.role.student")}</SelectItem>
                    <SelectItem value="Specialist" id="signup-role-specialist">{t("auth.role.specialist")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {role && (
                <>
                  {/* Student Type immediately after Role */}
                  {role === "Student" && (
                    <div className="space-y-2">
                      <Label htmlFor="signup-student-type" className="text-gray-900 dark:text-gray-200">
                        {t("auth.fields.studentType")}
                      </Label>
                      <Select value={student_type} onValueChange={setStudentType} disabled={isLoading}>
                        <SelectTrigger id="signup-student-type">
                          <div className="flex items-center">
                            <BookOpen className="w-4 h-4 mr-2 text-muted-foreground" />
                            <SelectValue placeholder={t("auth.placeholders.studentType")} />
                          </div>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="High School" id="signup-student-type-high-school">{t("auth.studentType.highSchool")}</SelectItem>
                          <SelectItem value="University" id="signup-student-type-university">{t("auth.studentType.university")}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
              {role === 'Specialist' ? (
                <div className="space-y-2">
                  <Label htmlFor="signup-university" className="text-gray-900 dark:text-gray-200">
                    {language === 'ar' ? 'الجامعة' : 'University'}
                  </Label>
                  <Select
                    value={selectedUniversityId}
                    onValueChange={(val) => {
                      setSelectedUniversityId(val);
                      const u = universities.find((x) => x.id === val);
                      setEstablishmentName(
                        u ? (language === 'ar' && u.name_ar ? u.name_ar : u.name) : ''
                      );
                    }}
                    disabled={isLoading || loadingUniversities}
                  >
                    <SelectTrigger id="signup-university">
                      <div className="flex items-center">
                        <BookOpen className="w-4 h-4 mr-2 text-muted-foreground" />
                        <SelectValue placeholder={language === 'ar' ? 'اختر الجامعة' : 'Select a university'} />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      {universities.length > 0 ? (
                        universities.map((u) => (
                          <SelectItem key={u.id} value={u.id} id={`signup-university-${u.id}`}>
                            {language === 'ar' && u.name_ar ? `${u.name_ar} (${u.name})` : u.name}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="" disabled>
                          {language === 'ar' ? 'لا توجد جامعات' : 'No universities available'}
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              ) : role === 'Student' && student_type === 'University' ? (
                <div className="space-y-2">
                  <Label htmlFor="signup-university" className="text-gray-900 dark:text-gray-200">
                    {language === 'ar' ? 'الجامعة' : 'University'}
                  </Label>
                  <Select
                    value={selectedUniversityId}
                    onValueChange={(val) => {
                      setSelectedUniversityId(val);
                      const u = universities.find((x) => x.id === val);
                      setEstablishmentName(
                        u ? (language === 'ar' && u.name_ar ? u.name_ar : u.name) : ''
                      );
                    }}
                    disabled={isLoading || loadingUniversities}
                  >
                    <SelectTrigger id="signup-university">
                      <div className="flex items-center">
                        <BookOpen className="w-4 h-4 mr-2 text-muted-foreground" />
                        <SelectValue placeholder={language === 'ar' ? 'اختر الجامعة' : 'Select a university'} />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      {universities.length > 0 ? (
                        universities.map((u) => (
                          <SelectItem key={u.id} value={u.id} id={`signup-university-${u.id}`}>
                            {language === 'ar' && u.name_ar ? `${u.name_ar} (${u.name})` : u.name}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="" disabled>
                          {language === 'ar' ? 'لا توجد جامعات' : 'No universities available'}
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              ) : null}


              <div className="space-y-2">
                <Label htmlFor="signup-gender" className="text-gray-900 dark:text-gray-200">
                  {t("auth.fields.gender")}
                </Label>
                <Select value={gender} onValueChange={setGender} disabled={isLoading}>
                  <SelectTrigger id="signup-gender">
                    <div className="flex items-center">
                      <Users className="w-4 h-4 mr-2 text-muted-foreground" />
                      <SelectValue placeholder={t("auth.placeholders.gender")} />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male" id="signup-gender-male">{t("auth.gender.male")}</SelectItem>
                    <SelectItem value="Female" id="signup-gender-female">{t("auth.gender.female")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Role moved above; removed here */}

              {/* Conditional fields based on role */}
              {role === "Student" && (
                <>
                  {student_type === "High School" && (
                    <div className="space-y-2">
                      <Label htmlFor="signup-level-high-school" className="text-gray-900 dark:text-gray-200">
                        {t("auth.fields.academicLevel")}
                      </Label>
                      <Select value={level} onValueChange={setLevel} disabled={isLoading}>
                        <SelectTrigger id="signup-level-high-school">
                          <div className="flex items-center">
                            <BookOpen className="w-4 h-4 mr-2 text-muted-foreground" />
                            <SelectValue placeholder={t("auth.placeholders.academicLevel")} />
                          </div>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1st Year" id="signup-level-high-school-1">{t("auth.academicLevel.year1")}</SelectItem>
                          <SelectItem value="2nd Year" id="signup-level-high-school-2">{t("auth.academicLevel.year2")}</SelectItem>
                          <SelectItem value="3rd Year" id="signup-level-high-school-3">{t("auth.academicLevel.year3")}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {student_type === "University" && (
                    <div className="space-y-2">
                      <Label htmlFor="signup-track" className="text-gray-900 dark:text-gray-200">
                        {t("auth.fields.academicTrack")}
                      </Label>
                      <Select value={track} onValueChange={setTrack} disabled={isLoading}>
                        <SelectTrigger id="signup-track">
                          <div className="flex items-center">
                            <BookOpen className="w-4 h-4 mr-2 text-muted-foreground" />
                            <SelectValue placeholder={t("auth.placeholders.academicTrack")} />
                          </div>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Science" id="signup-track-science">{t("auth.track.science")}</SelectItem>
                          <SelectItem value="Medicine" id="signup-track-medicine">{t("auth.track.medicine")}</SelectItem>
                          <SelectItem value="Literature" id="signup-track-literature">{t("auth.track.literature")}</SelectItem>
                          <SelectItem value="Business" id="signup-track-business">{t("auth.track.business")}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </>
              )}

              {role === "Specialist" && (
                <div className="space-y-2">
                  <Label htmlFor="signup-level-specialist" className="text-gray-900 dark:text-gray-200">
                    {t("auth.fields.academicLevel")}
                  </Label>
                  <Select value={level} onValueChange={setLevel} disabled={isLoading}>
                    <SelectTrigger id="signup-level-specialist">
                      <div className="flex items-center">
                        <BookOpen className="w-4 h-4 mr-2 text-muted-foreground" />
                        <SelectValue placeholder={t("auth.placeholders.academicLevel")} />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3rd Year" id="signup-level-specialist-3">{t("auth.academicLevel.year3")}</SelectItem>
                      <SelectItem value="4th Year" id="signup-level-specialist-4">{t("auth.academicLevel.year4")}</SelectItem>
                      <SelectItem value="Graduate" id="signup-level-specialist-graduate">{t("auth.academicLevel.graduate")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              {role === "Specialist" && (
                <div className="space-y-2">
                  <Label htmlFor="signup-specialist-proof" className="text-gray-900 dark:text-gray-200">
                    {language === 'ar' ? 'إثبات الحالة (صورة)' : 'Proof of status (image)'}
                  </Label>
                  <input
                    id="signup-specialist-proof"
                    type="file"
                    accept="image/*"
                    onChange={(e) => setSpecialistProofFile(e.target.files?.[0] || null)}
                    disabled={isLoading}
                    className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 dark:text-gray-300 dark:bg-gray-800 dark:border-gray-700"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {language === 'ar' ? 'يرجى رفع بطاقة الطالب/الخريج أو أي إثبات مناسب' : 'Please upload a student/graduate card or any valid proof'}
                  </p>
                </div>
              )}

              <Button
                type="submit"
                id="signup-submit-button"
                className="w-full bg-gradient-to-r from-blue-400 to-blue-500 hover:from-blue-500 hover:to-blue-600 text-white rounded-2xl px-8 py-6 shadow-lg"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2
                      className={`${language === "ar" ? "ml-2" : "mr-2"} h-4 w-4 animate-spin`}
                    />
                    {t("auth.signup.loading")}
                  </>
                ) : (
                  t("auth.signup.submit")
                )}
              </Button>
              </>
              )}
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
              onClick={handleGoogleSignup}
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
              {language === "ar" ? "التسجيل باستخدام Google" : "Sign up with Google"}
            </Button>

            <p className="text-center text-sm text-muted-foreground mt-4">
              {t("auth.signup.haveAccount") + " "}
              <Link to="/login" id="signup-login-link" className="text-primary hover:underline">
                {t("auth.signup.login")}
              </Link>
            </p>
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

export default Signup;
