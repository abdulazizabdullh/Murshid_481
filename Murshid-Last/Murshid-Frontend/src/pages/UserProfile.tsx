import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PageAnimation } from "@/components/animations/PageAnimation";
import { ArrowLeft, Mail, MapPin, GraduationCap, Building2, User, BookOpen } from 'lucide-react';
import { useI18n } from '@/contexts/I18nContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
  role?: string;
  gender?: string;
  level?: string;
  track?: string;
  student_type?: string;
  establishment_name?: string;
  university_id?: string;
  is_admin?: boolean;
}

interface University {
  id: string;
  name: string;
}

export default function UserProfile() {
  const { userId } = useParams<{ userId: string }>();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [university, setUniversity] = useState<University | null>(null);
  const [loading, setLoading] = useState(true);
  const { language } = useI18n();
  const { user } = useAuth();
  const navigate = useNavigate();

  const isOwnProfile = user && userId === user.id;

  useEffect(() => {
    fetchUserProfile();
  }, [userId]);

  const fetchUserProfile = async () => {
    if (!userId) {
      navigate('/community');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;

      if (!data) {
        toast.error(language === 'ar' ? 'المستخدم غير موجود' : 'User not found');
        navigate('/community');
        return;
      }

      setProfile(data);

      // Fetch university name if university_id exists
      if (data.university_id) {
        const { data: uniData, error: uniError } = await supabase
          .from('universities')
          .select('id, name')
          .eq('id', data.university_id)
          .single();

        if (!uniError && uniData) {
          setUniversity(uniData);
        }
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      toast.error(language === 'ar' ? 'فشل تحميل الملف الشخصي' : 'Failed to load profile');
      navigate('/community');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <PageAnimation>
        <div className="min-h-screen bg-gradient-to-br from-[#e3e8ff] via-[#f5f7ff] to-[#cbd4ff] dark:from-[#0f172a] dark:via-[#1e2a4a] dark:to-[#2a3b6b]">
          <Navbar />
          <div className="py-20 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-300">
                {language === 'ar' ? 'جاري التحميل...' : 'Loading...'}
              </p>
            </div>
          </div>
        </div>
      </PageAnimation>
    );
  }

  if (!profile) return null;

  const getRoleBadge = () => {
    const role = profile.role?.toLowerCase();
    if (profile.is_admin) {
      return (
        <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
          {language === 'ar' ? 'مشرف' : 'Admin'}
        </Badge>
      );
    }
    if (role === 'specialist') {
      return (
        <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
          {language === 'ar' ? 'متخصص' : 'Specialist'}
        </Badge>
      );
    }
    return (
      <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
        {language === 'ar' ? 'طالب' : 'Student'}
      </Badge>
    );
  };

  return (
    <PageAnimation>
      <div className="min-h-screen bg-gradient-to-br from-[#e3e8ff] via-[#f5f7ff] to-[#cbd4ff] dark:from-[#0f172a] dark:via-[#1e2a4a] dark:to-[#2a3b6b]">
        <Navbar />
        
        <div className="py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-10">
            {/* Back Button */}
            <Button
              onClick={() => navigate(-1)}
              variant="ghost"
              className="mb-6"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {language === 'ar' ? 'رجوع' : 'Back'}
            </Button>

            {/* Profile Header */}
            <Card className="p-8 mb-6">
              <div className="flex flex-col md:flex-row items-start gap-6">
                <Avatar className="w-32 h-32">
                  <AvatarImage src={profile.avatar_url} alt={profile.name} />
                  <AvatarFallback className="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 text-4xl font-semibold">
                    {profile.name?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                      {profile.name}
                    </h1>
                    {getRoleBadge()}
                  </div>

                  <div className="flex flex-col gap-2 mt-4">
                    {profile.gender && (
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                        <User className="w-4 h-4" />
                        <span className="text-sm">
                          {language === 'ar' ? 'الجنس: ' : 'Gender: '}
                          {profile.gender === 'Male' 
                            ? (language === 'ar' ? 'ذكر' : 'Male')
                            : (language === 'ar' ? 'أنثى' : 'Female')}
                        </span>
                      </div>
                    )}

                    {profile.student_type && (
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                        <BookOpen className="w-4 h-4" />
                        <span className="text-sm">
                          {language === 'ar' ? 'نوع الطالب: ' : 'Student Type: '}
                          {profile.student_type === 'High School'
                            ? (language === 'ar' ? 'طالب ثانوي' : 'High School')
                            : (language === 'ar' ? 'طالب جامعي' : 'University')}
                        </span>
                      </div>
                    )}

                    {(university || profile.establishment_name) && (
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                        <Building2 className="w-4 h-4" />
                        <span className="text-sm">
                          {university ? university.name : profile.establishment_name}
                        </span>
                      </div>
                    )}

                    {profile.level && (
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                        <GraduationCap className="w-4 h-4" />
                        <span className="text-sm">
                          {language === 'ar' ? 'المستوى: ' : 'Level: '}{profile.level}
                        </span>
                      </div>
                    )}

                    {profile.track && (
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                        <MapPin className="w-4 h-4" />
                        <span className="text-sm">
                          {language === 'ar' ? 'المسار: ' : 'Track: '}{profile.track}
                        </span>
                      </div>
                    )}
                  </div>

                  {isOwnProfile && (
                    <div className="mt-6">
                      <Button
                        onClick={() => navigate('/profile')}
                        className="bg-blue-500 hover:bg-blue-600 text-white rounded-2xl"
                      >
                        {language === 'ar' ? 'تعديل الملف الشخصي' : 'Edit Profile'}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </Card>

            {/* Additional Info */}
            {!isOwnProfile && (
              <Card className="p-6">
                <p className="text-center text-gray-600 dark:text-gray-300" dir={language}>
                  {language === 'ar' 
                    ? 'هذا الملف الشخصي للعرض فقط' 
                    : 'This profile is view-only'}
                </p>
              </Card>
            )}
          </div>
        </div>
      </div>
    </PageAnimation>
  );
}
