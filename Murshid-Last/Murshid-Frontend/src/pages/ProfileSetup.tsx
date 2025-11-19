import { useMemo, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, BookOpen, Users, UserCheck, CheckCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { toast } from "sonner";
import { useI18n } from "@/contexts/I18nContext";
import { getUniversities } from "@/lib/universitiesApi";
import { supabase } from "@/lib/supabase";
import type { University } from "@/types/database";
import { PageAnimation } from "@/components/animations/PageAnimation";
import { ScrollAnimation } from "@/components/animations/ScrollAnimation";

const ProfileSetup = () => {
  const [establishment_name, setEstablishmentName] = useState("");
  const [selectedUniversityId, setSelectedUniversityId] = useState<string>("");
  const [level, setLevel] = useState("");
  const [gender, setGender] = useState("");
  const [role, setRole] = useState("");
  const [student_type, setStudentType] = useState("");
  const [track, setTrack] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [specialistProofFile, setSpecialistProofFile] = useState<File | null>(null);
  const [universities, setUniversities] = useState<University[]>([]);
  const [loadingUniversities, setLoadingUniversities] = useState(false);

  const { user, updateProfile, refreshUser } = useAuth();
  const navigate = useNavigate();
  const { t, language } = useI18n();

  const profileSetupSchema = useMemo(
    () =>
      z.object({
        establishment_name: z.string().optional(),
        level: z.string().optional(),
        gender: z.string().min(1, { message: language === 'ar' ? 'النوع مطلوب' : 'Gender is required' }),
        role: z.string().min(1, { message: language === 'ar' ? 'الدور مطلوب' : 'Role is required' }),
        student_type: z.string().optional(),
        track: z.string().optional(),
      }),
    [language],
  );

  useEffect(() => {
    // Redirect if user already has profile completed
    if (user && user.role && user.gender) {
      navigate("/");
    }
  }, [user, navigate]);

  // Load universities list
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
    load();
  }, []);

  const handleCompleteLater = () => {
    // Allow user to skip profile completion and go to home
    navigate("/");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      profileSetupSchema.parse({
        establishment_name,
        level,
        gender,
        role,
        student_type,
        track,
      });

      setIsLoading(true);

      if (role === 'Specialist' && !specialistProofFile) {
        toast.error(language === 'ar' ? 'الرجاء رفع صورة إثبات قبل المتابعة' : 'Please upload a proof image before continuing');
        return;
      }

      if (role === 'Specialist' && !selectedUniversityId) {
        toast.error(language === 'ar' ? 'يرجى اختيار الجامعة' : 'Please select your university');
        return;
      }

      // Validate student type for students
      if (role === 'Student' && !student_type) {
        toast.error(language === 'ar' ? 'نوع الطالب مطلوب' : 'Student type is required');
        return;
      }

      // Update profile with all fields
      if (!user?.id || !user?.email || !user?.name) {
        toast.error(language === 'ar' ? 'معلومات المستخدم غير كاملة' : 'User information incomplete');
        return;
      }

      await updateProfile(
        user.name,
        user.email,
        establishment_name,
        level,
        gender,
        role,
        student_type,
        track
      );

      // Update university_id if applicable
      if (selectedUniversityId) {
        await supabase
          .from('profiles')
          .update({ university_id: selectedUniversityId })
          .eq('id', user.id);
      }

      // If Specialist, upload proof and mark as suspended pending verification
      if (role === 'Specialist' && specialistProofFile) {
        try {
          const file = specialistProofFile;
          const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
          const path = `${user.id}/proof_${Date.now()}.${ext}`;
          const { error: uploadErr } = await supabase.storage
            .from('specialist-proofs')
            .upload(path, file, { upsert: true, contentType: file.type });
          if (uploadErr) throw uploadErr;

          const { data: pub } = supabase.storage
            .from('specialist-proofs')
            .getPublicUrl(path);
          const proofUrl = pub.publicUrl;

          // Mark account as suspended pending verification
          await supabase.from('profiles')
            .update({
              is_suspended: true,
              suspended_reason: 'Pending specialist verification',
              specialist_proof_url: proofUrl
            } as any)
            .eq('id', user.id);

          // Refresh user data to ensure Suspended page shows correct message
          await refreshUser();

          toast.success(language === 'ar' ? 'تم إرسال طلبك للمراجعة' : 'Your application has been submitted for review');
          navigate('/suspended');
          return;
        } catch (e) {
          console.error('Specialist proof upload error:', e);
          toast.error(language === 'ar' ? 'فشل رفع الإثبات' : 'Failed to upload proof');
          return;
        }
      }

      toast.success(language === 'ar' ? 'تم إكمال الملف الشخصي بنجاح!' : 'Profile completed successfully!');
      navigate("/");
    } catch (error) {
      if (error instanceof z.ZodError) {
        error.errors.forEach((err) => toast.error(err.message));
      } else {
        console.error("Profile setup error:", error);
        toast.error(language === 'ar' ? 'فشل إكمال الملف الشخصي' : 'Failed to complete profile');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <PageAnimation>
      <div
        className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-blue-900/30 p-4"
        dir={language}
      >
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
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                {language === 'ar' ? 'أكمل ملفك الشخصي' : 'Complete Your Profile'}
              </h1>
              <p className="text-muted-foreground">
                {language === 'ar' ? 'نحتاج بعض المعلومات الإضافية لإكمال حسابك' : 'We need some additional information to complete your account'}
              </p>
            </div>

            <Card className="border-border/50 shadow-[var(--shadow-soft)]">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-gray-900 dark:text-gray-100">
                      {language === 'ar' ? 'معلومات الملف الشخصي' : 'Profile Information'}
                    </CardTitle>
                    <CardDescription className="text-gray-600 dark:text-gray-300">
                      {language === 'ar' ? 'املأ المعلومات المطلوبة أدناه' : 'Fill in the required information below'}
                    </CardDescription>
                  </div>
                  <CheckCircle className="w-8 h-8 text-muted-foreground/30" />
                </div>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Display user's name and email (from Google) */}
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      <strong>{language === 'ar' ? 'الاسم:' : 'Name:'}</strong> {user.name}
                      <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                        ({language === 'ar' ? 'يمكنك تغييره لاحقاً' : 'You can change it later'})
                      </span>
                    </p>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      <strong>{language === 'ar' ? 'البريد الإلكتروني:' : 'Email:'}</strong> {user.email}
                    </p>
                  </div>

                  {/* Role selection */}
                  <div className="space-y-2">
                    <Label htmlFor="profile-setup-role" className="text-gray-900 dark:text-gray-200">
                      {t("auth.fields.role")} <span className="text-red-500">*</span>
                    </Label>
                    <Select value={role} onValueChange={setRole} disabled={isLoading}>
                      <SelectTrigger id="profile-setup-role">
                        <div className="flex items-center">
                          <UserCheck className="w-4 h-4 mr-2 text-muted-foreground" />
                          <SelectValue placeholder={t("auth.placeholders.role")} />
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Student">{t("auth.role.student")}</SelectItem>
                        <SelectItem value="Specialist">{t("auth.role.specialist")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {role && (
                    <>
                      {/* Student Type for Students */}
                      {role === "Student" && (
                        <div className="space-y-2">
                          <Label htmlFor="profile-setup-student-type" className="text-gray-900 dark:text-gray-200">
                            {t("auth.fields.studentType")} <span className="text-red-500">*</span>
                          </Label>
                          <Select value={student_type} onValueChange={setStudentType} disabled={isLoading}>
                            <SelectTrigger id="profile-setup-student-type">
                              <div className="flex items-center">
                                <BookOpen className="w-4 h-4 mr-2 text-muted-foreground" />
                                <SelectValue placeholder={t("auth.placeholders.studentType")} />
                              </div>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="High School">{t("auth.studentType.highSchool")}</SelectItem>
                              <SelectItem value="University">{t("auth.studentType.university")}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {/* University selection for Specialists or University students */}
                      {(role === 'Specialist' || (role === 'Student' && student_type === 'University')) && (
                        <div className="space-y-2">
                          <Label htmlFor="profile-setup-university" className="text-gray-900 dark:text-gray-200">
                            {language === 'ar' ? 'الجامعة' : 'University'} {role === 'Specialist' && <span className="text-red-500">*</span>}
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
                            <SelectTrigger id="profile-setup-university">
                              <div className="flex items-center">
                                <BookOpen className="w-4 h-4 mr-2 text-muted-foreground" />
                                <SelectValue placeholder={language === 'ar' ? 'اختر الجامعة' : 'Select a university'} />
                              </div>
                            </SelectTrigger>
                            <SelectContent>
                              {universities.length > 0 ? (
                                universities.map((u) => (
                                  <SelectItem key={u.id} value={u.id}>
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
                      )}

                      {/* Gender */}
                      <div className="space-y-2">
                        <Label htmlFor="profile-setup-gender" className="text-gray-900 dark:text-gray-200">
                          {t("auth.fields.gender")} <span className="text-red-500">*</span>
                        </Label>
                        <Select value={gender} onValueChange={setGender} disabled={isLoading}>
                          <SelectTrigger id="profile-setup-gender">
                            <div className="flex items-center">
                              <Users className="w-4 h-4 mr-2 text-muted-foreground" />
                              <SelectValue placeholder={t("auth.placeholders.gender")} />
                            </div>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Male">{t("auth.gender.male")}</SelectItem>
                            <SelectItem value="Female">{t("auth.gender.female")}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Academic Level for High School Students */}
                      {role === "Student" && student_type === "High School" && (
                        <div className="space-y-2">
                          <Label htmlFor="profile-setup-level-high-school" className="text-gray-900 dark:text-gray-200">
                            {t("auth.fields.academicLevel")}
                          </Label>
                          <Select value={level} onValueChange={setLevel} disabled={isLoading}>
                            <SelectTrigger id="profile-setup-level-high-school">
                              <div className="flex items-center">
                                <BookOpen className="w-4 h-4 mr-2 text-muted-foreground" />
                                <SelectValue placeholder={t("auth.placeholders.academicLevel")} />
                              </div>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1st Year">{t("auth.academicLevel.year1")}</SelectItem>
                              <SelectItem value="2nd Year">{t("auth.academicLevel.year2")}</SelectItem>
                              <SelectItem value="3rd Year">{t("auth.academicLevel.year3")}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {/* Track for University Students */}
                      {role === "Student" && student_type === "University" && (
                        <div className="space-y-2">
                          <Label htmlFor="profile-setup-track" className="text-gray-900 dark:text-gray-200">
                            {t("auth.fields.academicTrack")}
                          </Label>
                          <Select value={track} onValueChange={setTrack} disabled={isLoading}>
                            <SelectTrigger id="profile-setup-track">
                              <div className="flex items-center">
                                <BookOpen className="w-4 h-4 mr-2 text-muted-foreground" />
                                <SelectValue placeholder={t("auth.placeholders.academicTrack")} />
                              </div>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Science">{t("auth.track.science")}</SelectItem>
                              <SelectItem value="Medicine">{t("auth.track.medicine")}</SelectItem>
                              <SelectItem value="Literature">{t("auth.track.literature")}</SelectItem>
                              <SelectItem value="Business">{t("auth.track.business")}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {/* Academic Level for Specialists */}
                      {role === "Specialist" && (
                        <div className="space-y-2">
                          <Label htmlFor="profile-setup-level-specialist" className="text-gray-900 dark:text-gray-200">
                            {t("auth.fields.academicLevel")}
                          </Label>
                          <Select value={level} onValueChange={setLevel} disabled={isLoading}>
                            <SelectTrigger id="profile-setup-level-specialist">
                              <div className="flex items-center">
                                <BookOpen className="w-4 h-4 mr-2 text-muted-foreground" />
                                <SelectValue placeholder={t("auth.placeholders.academicLevel")} />
                              </div>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="3rd Year">{t("auth.academicLevel.year3")}</SelectItem>
                              <SelectItem value="4th Year">{t("auth.academicLevel.year4")}</SelectItem>
                              <SelectItem value="Graduate">{t("auth.academicLevel.graduate")}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {/* Proof upload for Specialists */}
                      {role === "Specialist" && (
                        <div className="space-y-2">
                          <Label htmlFor="profile-setup-specialist-proof" className="text-gray-900 dark:text-gray-200">
                            {language === 'ar' ? 'إثبات الحالة (صورة)' : 'Proof of status (image)'} <span className="text-red-500">*</span>
                          </Label>
                          <input
                            id="profile-setup-specialist-proof"
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
                    </>
                  )}

                  <div className="space-y-3">
                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-blue-400 to-blue-500 hover:from-blue-500 hover:to-blue-600 text-white rounded-2xl px-8 py-6 shadow-lg"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2
                            className={`${language === "ar" ? "ml-2" : "mr-2"} h-4 w-4 animate-spin`}
                          />
                          {language === 'ar' ? 'جاري الحفظ...' : 'Saving...'}
                        </>
                      ) : (
                        language === 'ar' ? 'إكمال الملف الشخصي' : 'Complete Profile'
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            <p className="text-center text-sm text-muted-foreground mt-6">
              {language === 'ar' ? 'جميع الحقول المطلوبة محددة بـ' : 'All required fields are marked with'} <span className="text-red-500">*</span>
            </p>
          </div>
        </ScrollAnimation>
      </div>
    </PageAnimation>
  );
};

export default ProfileSetup;
