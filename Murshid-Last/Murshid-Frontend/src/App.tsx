import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import "./animations.css";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { I18nProvider } from "@/contexts/I18nContext";
import { Analytics } from "@vercel/analytics/react";
import { useEffect } from "react";
import { initializeCache } from "@/lib/tagTranslation";
import ScrollToTop from "./components/ScrollToTop";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";
import Profile from "./pages/Profile";
import Majors from "./pages/Majors";
import Universities from "./pages/Universities";
import MajorDetail from "./pages/MajorDetail";
import UniversityDetail from "./pages/UniversityDetail";
import Bookmarks from "./pages/Bookmarks";
import AdminDashboard from "./pages/AdminDashboard";
import AdminUniversities from "./pages/AdminUniversities";
import AdminMajors from "./pages/AdminMajors";
import AdminUniversityMajors from "./pages/AdminUniversityMajors";
import AdminCommunity from "./pages/AdminCommunity";
import Suspended from "./pages/Suspended";
import Community from "./pages/Community";
import CreatePost from "./pages/CreatePost";
import PostDetail from "./pages/PostDetail";
import MyPosts from "./pages/MyPosts";
import MyAnswers from "./pages/MyAnswers";
import MyLikes from "./pages/MyLikes";
import UserProfile from "./pages/UserProfile";
import AuthCallback from "./pages/AuthCallback";
import ProfileSetup from "./pages/ProfileSetup";

const queryClient = new QueryClient();

const LoadingOverlay = () => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-[#e3e8ff]/95 via-[#f5f7ff]/95 to-[#cbd4ff]/95 dark:from-[#0f172a]/95 dark:via-[#1e2a4a]/95 dark:to-[#2a3b6b]/95 backdrop-blur-md">
    <div className="flex flex-col items-center gap-8 p-10 rounded-3xl bg-white/90 dark:bg-gray-900/90 shadow-2xl backdrop-blur-sm border border-blue-200/50 dark:border-blue-700/50">
      {/* Animated Logo/Icon */}
      <div className="relative w-24 h-24">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl animate-pulse"></div>
        <div className="absolute inset-0 bg-gradient-to-tr from-blue-600 to-blue-700 rounded-2xl animate-ping opacity-20"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <svg className="w-12 h-12 text-white animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
      </div>
      
      {/* Loading Text with Animation */}
      <div className="text-center space-y-3">
        <h2 className="text-2xl font-bold text-blue-600 dark:text-blue-400 animate-pulse">
          Loading
        </h2>
        
        {/* Progress Bar */}
        <div className="w-48 h-2 bg-blue-100 dark:bg-blue-900/30 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full animate-[shimmer_2s_ease-in-out_infinite]" 
               style={{ width: '100%', animation: 'shimmer 2s ease-in-out infinite' }}>
          </div>
        </div>
        
        <p className="text-sm text-gray-600 dark:text-gray-400 animate-pulse">
          Please wait...
        </p>
      </div>
    </div>
    
    <style>{`
      @keyframes shimmer {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(100%); }
      }
    `}</style>
  </div>
);

const AppContent = () => {
  const { loading } = useAuth();

  if (loading) {
    return <LoadingOverlay />;
  }

  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/user/:userId" element={<UserProfile />} />
      <Route path="/bookmarks" element={<ProtectedRoute><Bookmarks /></ProtectedRoute>} />
      <Route path="/majors" element={<Majors />} />
      <Route path="/majors/:id" element={<MajorDetail />} />
      <Route path="/universities" element={<Universities />} />
      <Route path="/universities/:id" element={<UniversityDetail />} />
      <Route path="/community" element={<Community />} />
      <Route path="/community/create" element={<ProtectedRoute><CreatePost /></ProtectedRoute>} />
      <Route path="/community/post/:id" element={<PostDetail />} />
      <Route path="/community/my-posts" element={<ProtectedRoute><MyPosts /></ProtectedRoute>} />
      <Route path="/community/my-answers" element={<ProtectedRoute><MyAnswers /></ProtectedRoute>} />
      <Route path="/community/my-likes" element={<ProtectedRoute><MyLikes /></ProtectedRoute>} />
      <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/universities" element={<ProtectedRoute><AdminUniversities /></ProtectedRoute>} />
      <Route path="/admin/majors" element={<ProtectedRoute><AdminMajors /></ProtectedRoute>} />
      <Route path="/admin/university-majors" element={<ProtectedRoute><AdminUniversityMajors /></ProtectedRoute>} />
      <Route path="/admin/community" element={<ProtectedRoute><AdminCommunity /></ProtectedRoute>} />
      <Route path="/suspended" element={<Suspended />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/profile-setup" element={<ProtectedRoute><ProfileSetup /></ProtectedRoute>} />
      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => {
  // Initialize tag translation cache on app load
  useEffect(() => {
    initializeCache();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ThemeProvider>
          <I18nProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
          <ScrollToTop />
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        </BrowserRouter>
        <Analytics />
      </I18nProvider>
      </ThemeProvider>
    </TooltipProvider>
  </QueryClientProvider>
  );
};

export default App;
