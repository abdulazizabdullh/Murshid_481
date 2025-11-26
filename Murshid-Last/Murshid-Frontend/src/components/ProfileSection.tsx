import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { User, Mail, Edit2, Save, X, BookOpen, Users, UserCheck, Sparkles, Building2, Award, LogOut } from "lucide-react";
import { z } from "zod";
import ImageUpload from "@/components/ImageUpload";
import { supabase } from "@/lib/supabase";
import { useI18n } from "@/contexts/I18nContext";
import { useNavigate } from "react-router-dom";
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
import { UserActivityRadarChart } from "@/components/UserActivityRadarChart";

interface ProfileSectionProps {
  onClose?: () => void;
}

const ProfileSection = ({ onClose }: ProfileSectionProps = {}) => {
  const { user, updateProfile, logout } = useAuth();
  const { t, language } = useI18n();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || "");
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    establishment_name: user?.establishment_name || "",
    level: user?.level || "",
    gender: user?.gender || "",
    role: user?.role || "",
    student_type: user?.student_type || "",
    track: user?.track || "",
  });

  const profileSchema = useMemo(
    () =>
      z.object({
        name: z
          .string()
          .min(2, t("auth.errors.nameMin", { count: 2 }))
          .max(100, t("profile.validation.nameMax")),
        email: z
          .string()
          .email(t("auth.errors.validEmail"))
          .max(255, t("profile.validation.emailMax")),
        establishment_name: z.string().optional(),
        level: z.string().optional(),
        gender: z.string().optional(),
        role: z.string().optional(),
        student_type: z.string().optional(),
        track: z.string().optional(),
      }),
    [language, t],
  );

  // Update form data when user data changes
  useEffect(() => {
    setFormData({
      name: user?.name || "",
      email: user?.email || "",
      establishment_name: user?.establishment_name || "",
      level: user?.level || "",
      gender: user?.gender || "",
      role: user?.role || "",
      student_type: user?.student_type || "",
      track: user?.track || "",
    });
    if (user?.avatar_url) {
      setAvatarUrl(user.avatar_url);
    }
  }, [user]);

  const handleAvatarUpload = async (url: string) => {
    try {
      setAvatarUrl(url);
      
      // Update avatar_url in database
      const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: url })
        .eq('id', user?.id);

      if (error) throw error;

      toast.success(t("profile.toast.avatarSuccess"));
    } catch (error: any) {
      console.error('Error updating avatar:', error);
      toast.error(t("profile.toast.avatarError"));
    }
  };

  const handleSave = async () => {
    try {
      profileSchema.parse(formData);
      setLoading(true);

      await updateProfile(
        formData.name, 
        formData.email, 
        formData.establishment_name, 
        formData.level, 
        formData.gender, 
        formData.role, 
        formData.student_type, 
        formData.track
      );
      
      setIsEditing(false);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      }
      // Error toast is already shown by updateProfile function
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: user?.name || "",
      email: user?.email || "",
      establishment_name: user?.establishment_name || "",
      level: user?.level || "",
      gender: user?.gender || "",
      role: user?.role || "",
      student_type: user?.student_type || "",
      track: user?.track || "",
    });
    setIsEditing(false);
  };

  const getInitials = (name?: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (!user) return null;

  const isGuest = user.id === "guest";

  const iconDirectionClass = language === "ar" ? "right-3" : "left-3";
  const inputPaddingClass = language === "ar" ? "pr-10" : "pl-10";
  const translateRole = (role?: string | null) => {
    if (!role) return t("profile.display.notSet");
    return role === "Student" ? t("auth.role.student") : role === "Specialist" ? t("auth.role.specialist") : role;
  };

  const translateGender = (gender?: string | null) => {
    if (!gender) return t("profile.display.notSet");
    if (gender === "Male") return t("auth.gender.male");
    if (gender === "Female") return t("auth.gender.female");
    return gender;
  };

  const translateStudentType = (type?: string | null) => {
    if (!type) return t("profile.display.notSet");
    if (type === "High School") return t("auth.studentType.highSchool");
    if (type === "University") return t("auth.studentType.university");
    return type;
  };

  const translateAcademicLevel = (level?: string | null) => {
    switch (level) {
      case "1st Year":
        return t("auth.academicLevel.year1");
      case "2nd Year":
        return t("auth.academicLevel.year2");
      case "3rd Year":
        return t("auth.academicLevel.year3");
      case "4th Year":
        return t("auth.academicLevel.year4");
      case "Graduate":
        return t("auth.academicLevel.graduate");
      default:
        return level || t("profile.display.notSet");
    }
  };

  const translateTrack = (track?: string | null) => {
    switch (track) {
      case "Science":
        return t("auth.track.science");
      case "Medicine":
        return t("auth.track.medicine");
      case "Literature":
        return t("auth.track.literature");
      case "Business":
        return t("auth.track.business");
      default:
        return track || t("profile.display.notSet");
    }
  };

  const translateInstitution = (institution?: string | null) =>
    institution && institution.trim().length > 0 ? institution : t("profile.display.notSet");

  return (
    <section className="min-h-screen py-12 bg-gradient-to-br from-primary/5 via-background to-accent/5" dir={language}>
      <div className="container mx-auto px-4">
        <Card className="max-w-4xl mx-auto overflow-hidden border-border/50 shadow-2xl">
          {/* Header with gradient background */}
          <div className="relative h-32 bg-gradient-to-r from-primary via-primary/90 to-accent overflow-hidden">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yLjIxIDEuNzktNCA0LTRzNCAxLjc5IDQgNC0xLjc5IDQtNCA0LTQtMS43OS00LTR6bTAgMTBjMC0yLjIxIDEuNzktNCA0LTRzNCAxLjc5IDQgNC0xLjc5IDQtNCA0LTQtMS43OS00LTR6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-20"></div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose || (() => navigate(-1))}
              className={`absolute top-4 w-8 h-8 text-white/80 hover:text-white hover:bg-white/20 ${language === "ar" ? "left-4" : "right-4"}`}
            >
              <X className="w-5 h-5" />
            </Button>
            <Sparkles className={`absolute top-4 w-6 h-6 text-white/40 ${language === "ar" ? "right-4" : "left-4"}`} />
          </div>

          <CardHeader className="relative -mt-16 pb-2">
            <div className={`flex flex-col sm:flex-row items-center sm:items-end gap-4 sm:gap-6 ${language === "ar" ? "sm:flex-row-reverse" : ""}`}>
              {/* Avatar with fancy border */}
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent rounded-full blur-md opacity-75 group-hover:opacity-100 transition-opacity"></div>
                <Avatar className="relative w-28 h-28 border-4 border-background shadow-xl">
                  {avatarUrl && <AvatarImage src={avatarUrl} alt={user.name} />}
                  <AvatarFallback className="text-3xl font-bold bg-gradient-to-br from-primary to-accent text-primary-foreground">
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
              </div>
              
              {/* User info */}
              <div className={`flex-1 text-center ${language === "ar" ? "sm:text-right" : "sm:text-left"}`}>
                <div className="inline-block bg-gradient-to-br from-background via-background to-primary/5 backdrop-blur-md border-2 border-primary/30 rounded-2xl px-5 py-3 shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.16)] transition-shadow">
                  <div className={`flex items-center gap-2.5 flex-wrap mb-1.5 ${language === "ar" ? "justify-center sm:justify-end" : "justify-center sm:justify-start"}`}>
                    <CardTitle className="text-3xl font-extrabold tracking-tight text-foreground" style={{ fontFamily: '"Poppins", "Inter", system-ui, sans-serif' }}>
                      {user.name || t("profile.display.userFallback")}
                    </CardTitle>
                    {user.role && (
                      <Badge variant="secondary" className="bg-gradient-to-r from-primary/10 to-accent/10 text-primary border-primary/20">
                        <Award className={`w-3 h-3 ${language === "ar" ? "ml-1" : "mr-1"}`} />
                        {translateRole(user.role)}
                      </Badge>
                    )}
                  </div>
                  <CardDescription className={`flex items-center gap-2 text-sm ${language === "ar" ? "justify-center sm:justify-end" : "justify-center sm:justify-start"}`}>
                    <Mail className="w-3.5 h-3.5" />
                    {user.email}
                  </CardDescription>
                  {user.establishment_name && (
                    <p className={`flex items-center gap-2 text-xs text-muted-foreground mt-1 ${language === "ar" ? "justify-center sm:justify-end" : "justify-center sm:justify-start"}`}>
                      <Building2 className="w-3.5 h-3.5" />
                      {user.establishment_name}
                    </p>
                  )}
                </div>
              </div>

              {/* Edit and Logout buttons */}
              {!isEditing && (
                <div className={`flex items-center gap-2 ${language === "ar" ? "flex-row-reverse" : ""}`}>
                  <Button 
                    onClick={() => {
                      if (isGuest) {
                        toast.error(language === 'ar' ? 'لا يمكنك تعديل المعلومات. يرجى تسجيل الدخول للتحرير.' : 'You cannot edit information. Please login to edit.');
                      } else {
                        setIsEditing(true);
                      }
                    }} 
                    id="profile-edit-button"
                    className="bg-blue-500 hover:bg-blue-600 text-white rounded-2xl px-6 py-3 transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
                    size="sm"
                  >
                    <Edit2 className={`w-4 h-4 ${language === "ar" ? "ml-2" : "mr-2"}`} />
                    {t("profile.buttons.edit")}
                  </Button>
                  <Button 
                    onClick={() => setShowLogoutDialog(true)}
                    id="profile-logout-button"
                    variant="outline"
                    size="sm"
                    className="rounded-2xl px-6 py-3 border-2 border-red-300 dark:border-red-500 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-700 dark:hover:text-red-300 transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                  >
                    <LogOut className={`w-4 h-4 ${language === "ar" ? "ml-2" : "mr-2"}`} />
                    {t('navbar.logout')}
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6 pt-6">
            {/* Activity Radar Chart - Only show for non-admin users */}
            {!isEditing && user && !user.is_admin && (
              <UserActivityRadarChart userId={user.id} />
            )}

            {isEditing ? (
              <div className="space-y-4">
                {/* Profile Picture Upload */}
                <div className="space-y-2">
                  <Label>{t("profile.labels.profilePicture")}</Label>
                  <ImageUpload
                    currentImage={avatarUrl}
                    onImageUpload={handleAvatarUpload}
                    bucket="avatars"
                    path={user?.id || 'default'}
                    label={t("profile.labels.profilePictureHint")}
                    maxSizeMB={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="profile-name">{t("auth.fields.name")}</Label>
                  <div className="relative">
                    <User className={`absolute ${iconDirectionClass} top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground`} />
                    <Input
                      id="profile-name"
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className={inputPaddingClass}
                      placeholder={t("auth.placeholders.name")}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="profile-email">{t("auth.fields.email")}</Label>
                  <div className="relative">
                    <Mail className={`absolute ${iconDirectionClass} top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground`} />
                    <Input
                      id="profile-email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className={inputPaddingClass}
                      placeholder={t("auth.placeholders.email")}
                    />
                  </div>
                </div>

                {!user.is_admin && (formData.role === "Specialist" || (formData.role === "Student" && formData.student_type === "University")) && (
                  <div className="space-y-2">
                    <Label htmlFor="profile-establishment-name">{t("auth.fields.institution")}</Label>
                    <Input
                      id="profile-establishment-name"
                      type="text"
                      value={formData.establishment_name}
                      onChange={(e) => setFormData({ ...formData, establishment_name: e.target.value })}
                      placeholder={t("auth.placeholders.institution")}
                    />
                  </div>
                )}


                <div className="space-y-2">
                  <Label htmlFor="profile-gender">{t("auth.fields.gender")}</Label>
                  <Select 
                    value={formData.gender} 
                    onValueChange={(value) => setFormData({ ...formData, gender: value })}
                    disabled={loading}
                  >
                    <SelectTrigger id="profile-gender">
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

                {/* Hide role selector for admins - they cannot change their role */}
                {!user.is_admin && (
                  <div className="space-y-2">
                    <Label htmlFor="profile-role">{t("auth.fields.role")}</Label>
                    <Select 
                      value={formData.role} 
                      onValueChange={(value) => setFormData({ ...formData, role: value })}
                      disabled={loading}
                    >
                      <SelectTrigger id="profile-role">
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
                )}

                {/* Conditional fields based on role - hide for admins */}
                {!user.is_admin && formData.role === "Student" && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="profile-student-type">{t("auth.fields.studentType")}</Label>
                      <Select 
                        value={formData.student_type} 
                        onValueChange={(value) => setFormData({ ...formData, student_type: value })}
                        disabled={loading}
                      >
                        <SelectTrigger id="profile-student-type">
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

                    {formData.student_type === "High School" && (
                      <div className="space-y-2">
                        <Label htmlFor="profile-level-high-school">{t("auth.fields.academicLevel")}</Label>
                        <Select 
                          value={formData.level} 
                          onValueChange={(value) => setFormData({ ...formData, level: value })}
                          disabled={loading}
                        >
                          <SelectTrigger id="profile-level-high-school">
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

                    {formData.student_type === "University" && (
                      <div className="space-y-2">
                        <Label htmlFor="profile-track">{t("auth.fields.academicTrack")}</Label>
                        <Select 
                          value={formData.track} 
                          onValueChange={(value) => setFormData({ ...formData, track: value })}
                          disabled={loading}
                        >
                          <SelectTrigger id="profile-track">
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
                  </>
                )}

                {!user.is_admin && formData.role === "Specialist" && (
                  <div className="space-y-2">
                    <Label htmlFor="profile-level-specialist">{t("auth.fields.academicLevel")}</Label>
                    <Select 
                      value={formData.level} 
                      onValueChange={(value) => setFormData({ ...formData, level: value })}
                      disabled={loading}
                    >
                      <SelectTrigger id="profile-level-specialist">
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

                <div className="flex gap-3 pt-4">
                  <Button 
                    onClick={handleSave} 
                    id="profile-save-button"
                    disabled={loading} 
                    className="flex-1 bg-blue-500 hover:bg-blue-600 text-white rounded-2xl px-6 py-3 transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
                  >
                    <Save className={`w-4 h-4 ${language === "ar" ? "ml-2" : "mr-2"}`} />
                    {loading ? t("profile.buttons.saving") : t("profile.buttons.save")}
                  </Button>
                  <Button 
                    onClick={handleCancel} 
                    id="profile-cancel-button"
                    variant="outline" 
                    disabled={loading}
                    className="rounded-2xl px-6 py-3 border-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                  >
                    <X className={`w-4 h-4 ${language === "ar" ? "ml-2" : "mr-2"}`} />
                    {t("profile.buttons.cancel")}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Personal Information Section */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <User className="w-5 h-5 text-accent" />
                    {t("profile.sections.personal")}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="group p-4 rounded-lg border border-border/50 bg-gradient-to-br from-primary/5 to-transparent hover:border-primary/30 transition-all duration-200">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-accent/10">
                          <User className="w-4 h-4 text-accent" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">{t("profile.details.fullName")}</p>
                          <p className="font-semibold text-foreground">{user.name || t("profile.display.notSet")}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="group p-4 rounded-lg border border-border/50 bg-gradient-to-br from-accent/5 to-transparent hover:border-accent/30 transition-all duration-200">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-accent/10">
                          <Mail className="w-4 h-4 text-accent" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">{t("profile.details.email")}</p>
                          <p className="font-semibold text-foreground break-all">{user.email}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="group p-4 rounded-lg border border-border/50 bg-gradient-to-br from-primary/5 to-transparent hover:border-primary/30 transition-all duration-200">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-accent/10">
                          <Users className="w-4 h-4 text-accent" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">{t("profile.details.gender")}</p>
                          <p className="font-semibold text-foreground">{translateGender(user.gender)}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="group p-4 rounded-lg border border-border/50 bg-gradient-to-br from-accent/5 to-transparent hover:border-accent/30 transition-all duration-200">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-accent/10">
                          <UserCheck className="w-4 h-4 text-accent" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">{t("profile.details.role")}</p>
                          <p className="font-semibold text-foreground">{translateRole(user.role)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Academic Information Section - Hidden for admins */}
                {!user.is_admin && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-accent" />
                      {t("profile.sections.academic")}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {!(user.role === "Student" && user.student_type === "High School") && (
                        <div className="group p-4 rounded-lg border border-border/50 bg-gradient-to-br from-primary/5 to-transparent hover:border-primary/30 transition-all duration-200">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-accent/10">
                              <Building2 className="w-4 h-4 text-accent" />
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">{t("profile.details.institution")}</p>
                              <p className="font-semibold text-foreground">{translateInstitution(user.establishment_name)}</p>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <div className="group p-4 rounded-lg border border-border/50 bg-gradient-to-br from-accent/5 to-transparent hover:border-accent/30 transition-all duration-200">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-accent/10">
                            <BookOpen className="w-4 h-4 text-accent" />
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">{t("profile.details.level")}</p>
                            <p className="font-semibold text-foreground">{translateAcademicLevel(user.level)}</p>
                          </div>
                        </div>
                      </div>
                      
                      {user.role === "Student" && user.student_type && (
                        <div className="group p-4 rounded-lg border border-border/50 bg-gradient-to-br from-primary/5 to-transparent hover:border-primary/30 transition-all duration-200">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-primary/10">
                              <BookOpen className="w-4 h-4 text-primary" />
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">{t("profile.details.studentType")}</p>
                              <p className="font-semibold text-foreground">{translateStudentType(user.student_type)}</p>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {user.role === "Student" && user.student_type === "University" && user.track && (
                        <div className="group p-4 rounded-lg border border-border/50 bg-gradient-to-br from-accent/5 to-transparent hover:border-accent/30 transition-all duration-200">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-accent/10">
                              <Award className="w-4 h-4 text-accent" />
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">{t("profile.details.track")}</p>
                              <p className="font-semibold text-foreground">{translateTrack(user.track)}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Logout Confirmation Dialog */}
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent className="bg-white dark:bg-gray-900" dir={language}>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-gray-900 dark:text-gray-100">
              {t('navbar.logout.confirmTitle')}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600 dark:text-gray-300">
              {t('navbar.logout.confirmDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel id="profile-logout-cancel-button" className="rounded-xl">
              {t('navbar.logout.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                logout();
                navigate('/', { replace: true });
                setShowLogoutDialog(false);
              }}
              id="profile-logout-confirm-button"
              className="rounded-xl bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700"
            >
              {t('navbar.logout')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
};

export default ProfileSection;
