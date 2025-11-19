import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the hash fragment from the URL
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');

        if (accessToken) {
          // Set the session using the tokens from the URL
          const { data: { session }, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || '',
          });

          if (sessionError) {
            throw sessionError;
          }

          if (session?.user) {
            // Check if profile exists
            const { data: profileData, error: profileError } = await supabase
              .from("profiles")
              .select("*")
              .eq("id", session.user.id)
              .single();

            let isNewUser = false;

            // If profile doesn't exist, create one with basic info from Google
            if (profileError && profileError.code === 'PGRST116') {
              const name = session.user.user_metadata?.full_name ||
                           session.user.user_metadata?.name ||
                           session.user.email?.split('@')[0] ||
                           'User';

              const { error: insertError } = await supabase
                .from("profiles")
                .insert({
                  id: session.user.id,
                  name: name,
                  avatar_url: session.user.user_metadata?.avatar_url ||
                             session.user.user_metadata?.picture || null,
                });

              if (insertError) {
                console.error("Error creating profile:", insertError);
              } else {
                isNewUser = true;
              }
            }

            localStorage.setItem("murshid_token", accessToken);

            const language = localStorage.getItem('language') || 'en';

            // Check if profile is incomplete (missing required fields)
            const hasRequiredFields = profileData?.role && profileData?.gender;

            // Redirect new users or users with incomplete profiles to profile setup
            if (isNewUser || !hasRequiredFields) {
              toast.success(language === 'ar' ? 'مرحباً! الرجاء إكمال ملفك الشخصي' : 'Welcome! Please complete your profile');
              navigate("/profile-setup");
              return;
            }

            // Check if user is suspended
            if (profileData?.is_suspended) {
              toast.error(language === 'ar' ? 'حسابك معلق' : 'Your account is suspended');
              navigate("/suspended");
              return;
            }

            toast.success(language === 'ar' ? 'تم تسجيل الدخول بنجاح!' : 'Successfully logged in!');

            // Check if user is admin and redirect accordingly
            if (profileData?.is_admin) {
              navigate("/admin");
            } else {
              navigate("/");
            }
          }
        } else {
          // No tokens in URL, redirect to login
          navigate("/login");
        }
      } catch (error) {
        console.error("Auth callback error:", error);
        const language = localStorage.getItem('language') || 'en';
        toast.error(language === 'ar' ? 'فشل تسجيل الدخول' : 'Login failed');
        navigate("/login");
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-blue-900/30">
      <div className="text-center">
        <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto mb-4" />
        <p className="text-lg text-gray-700 dark:text-gray-300">
          {localStorage.getItem('language') === 'ar' ? 'جاري تسجيل الدخول...' : 'Signing you in...'}
        </p>
      </div>
    </div>
  );
};

export default AuthCallback;
