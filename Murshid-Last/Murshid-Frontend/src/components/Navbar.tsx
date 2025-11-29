import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, LogIn, User, Bookmark, MessageSquare } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useI18n } from "@/contexts/I18nContext";
import { useBookmarks } from "@/hooks/useBookmarks";
import { useMessaging } from "@/contexts/MessagingContext";
import { ThemeToggle } from "./ThemeToggle";
import { LanguageToggle } from "./LanguageToggle";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface NavbarProps {
  currentPage?: string;
  onNavigate?: (page: string) => void;
}

const Navbar = ({ currentPage, onNavigate }: NavbarProps = {}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { t, language } = useI18n();
  const { totalBookmarks, animateBookmark } = useBookmarks();
  const { totalUnreadCount } = useMessaging();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const getCurrentPage = () => {
    if (currentPage) return currentPage;

    if (user?.is_admin) {
      if (location.pathname === '/admin') return 'dashboard';
      if (location.pathname.startsWith('/admin/majors')) return 'admin-majors';
      if (location.pathname.startsWith('/admin/universities')) return 'admin-universities';
      if (location.pathname.startsWith('/admin/university-majors')) return 'admin-universities';
    }

    if (location.pathname === '/') return 'home';
    if (location.pathname === '/majors' || location.pathname.startsWith('/majors/')) return 'majors';
    if (location.pathname === '/universities' || location.pathname.startsWith('/universities/')) return 'universities';
    if (location.pathname === '/community' || location.pathname.startsWith('/community/')) return 'community';
    if (location.pathname === '/profile') return 'profile';
    return 'home';
  };

  const handleNavigate = (page: string) => {
    if (onNavigate) {
      onNavigate(page);
    } else {
      switch (page) {
        case 'home':
          navigate('/');
          break;
        case 'dashboard':
          navigate('/admin');
          break;
        case 'majors':
          if (user?.is_admin) {
            navigate('/admin/majors');
          } else {
            navigate('/majors');
          }
          break;
        case 'universities':
          if (user?.is_admin) {
            navigate('/admin/universities');
          } else {
            navigate('/universities');
          }
          break;
        case 'community':
          if (user) {
            navigate('/community');
          } else {
            toast.error(language === 'ar' ? 'الرجاء تسجيل الدخول للانضمام إلى المجتمع' : 'Please login to join the community');
            navigate('/login');
          }
          break;
        case 'admin-majors':
          navigate('/admin/majors');
          break;
        case 'admin-universities':
          navigate('/admin/universities');
          break;
        default:
          navigate('/');
      }
    }
  };

  const isActive = (page: string) => getCurrentPage() === page;

  // Dynamic nav items based on user role
  const navItems = user?.is_admin
    ? [
        { id: "dashboard", label: language === "ar" ? "لوحة التحكم" : "Dashboard" },
        { id: "admin-majors", label: t("navbar.majors") },
        { id: "admin-universities", label: t("navbar.universities") },
      ]
    : [
        { id: 'home', label: t('navbar.home') },
        { id: 'majors', label: t('navbar.majors') },
        { id: 'universities', label: t('navbar.universities') },
        { id: 'community', label: language === 'ar' ? 'المجتمع' : 'Community' },
      ];

  return (
    <nav className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 shadow-sm" dir="ltr">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-10" dir="ltr">
        <div className="flex justify-between items-center h-20">
          <button
            onClick={() => handleNavigate(user?.is_admin ? 'dashboard' : 'home')}
            id="navbar-logo-button"
            className="flex items-center group rounded-xl hover:shadow-lg hover:-translate-y-1 transition-all duration-300 hover:bg-white-100 dark:hover:bg-white-800 p-3"
          >
             <img 
              src="/logo4.png" 
              alt="Murshid Logo" 
              className="h-14 object-contain transition-transform group-hover:scale-105"
            />
            <h1 className={`text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent dark:from-blue-400 dark:to-indigo-400 ${language === "ar" ? "leading-normal pb-1.5" : ""}`}>
              {language === "ar" ? "مرشــــد" : "Murshid"}
            </h1>          
          </button>

          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavigate(item.id)}
                id={`navbar-nav-${item.id}`}
                className={`px-4 py-2 rounded-xl transition-all ${
                  isActive(item.id)
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50 hover:!text-blue-700 dark:hover:!text-blue-300'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <div className="flex items-center gap-2">
              <LanguageToggle />
              <ThemeToggle />
            </div>
            
            {loading ? (
              <div className="w-32 h-10 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-xl"></div>
            ) : user ? (
              <div className="flex items-center gap-3">
                {!user.is_admin && (
                  <>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Link to="/messages" id="navbar-messages-link" className="relative">
                            <Button
                              variant="outline"
                              size="icon"
                              id="navbar-messages-button"
                              className="relative"
                            >
                              <MessageSquare className="h-[1.2rem] w-[1.2rem]" />
                              {totalUnreadCount > 0 && (
                                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium animate-pulse">
                                  {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
                                </span>
                              )}
                              <span className="sr-only">Messages</span>
                            </Button>
                          </Link>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{language === 'ar' ? 'الرسائل' : 'Messages'}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Link to="/bookmarks" id="navbar-bookmarks-link" className="relative">
                            <Button
                              variant="outline"
                              size="icon"
                              id="navbar-bookmarks-button"
                              className={`relative transition-transform duration-300 ${
                                animateBookmark ? 'animate-pulse scale-110' : ''
                              }`}
                            >
                              <Bookmark className="h-[1.2rem] w-[1.2rem]" />
                              {totalBookmarks > 0 && (
                                <span className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                                  {totalBookmarks > 99 ? '99+' : totalBookmarks}
                                </span>
                              )}
                              <span className="sr-only">Bookmarks</span>
                            </Button>
                          </Link>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{language === 'ar' ? 'المحفوظات' : 'Bookmarks'}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </>
                )}
                <Link to="/profile" id="navbar-profile-link">
                  <Button
                    variant="ghost"
                    className="rounded-xl"
                    id="navbar-profile-button"
                  >
                    <User className="w-4 h-4 mr-2" />
                    {t('navbar.profile')}
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link to="/login" id="navbar-login-link">
                  <Button
                    variant="ghost"
                    className="rounded-xl"
                    id="navbar-login-button"
                  >
                    {t('navbar.login')}
                  </Button>
                </Link>
                <Link to="/signup" id="navbar-signup-link">
                  <Button className="bg-gradient-to-r from-blue-400 to-blue-500 hover:from-blue-500 hover:to-blue-600 text-white rounded-xl px-6 shadow-md" id="navbar-signup-button">
                    {t('navbar.signUp')}
                  </Button>
                </Link>
              </div>
            )}
          </div>

          <div className="md:hidden flex items-center gap-2">
            <LanguageToggle />
            <ThemeToggle />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              id="navbar-mobile-menu-toggle"
              className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6 text-gray-600 dark:text-gray-300" />
              ) : (
                <Menu className="w-6 h-6 text-gray-600 dark:text-gray-300" />
              )}
            </button>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 shadow-lg">
          <div className="px-4 py-4 space-y-2">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  handleNavigate(item.id);
                  setMobileMenuOpen(false);
                }}
                id={`navbar-mobile-nav-${item.id}`}
                className={`w-full text-left px-4 py-3 rounded-xl transition-all ${
                  isActive(item.id)
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50 hover:!text-blue-700 dark:hover:!text-blue-300'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                {item.label}
              </button>
            ))}
            <div className="pt-4 space-y-3 border-t border-gray-100 dark:border-gray-800">
              {loading ? (
                <div className="space-y-3">
                  <div className="h-12 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-xl"></div>
                  <div className="h-12 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-xl"></div>
                </div>
              ) : user ? (
                <div className="space-y-3">
                  {!user.is_admin && (
                    <>
                      <Link to="/messages" onClick={() => setMobileMenuOpen(false)} id="navbar-mobile-messages-link" className="block">
                        <Button
                          variant="outline"
                          className="w-full justify-start rounded-xl"
                          id="navbar-mobile-messages-button"
                        >
                          <div className="relative flex items-center">
                            <MessageSquare className="w-4 h-4 mr-2" />
                            {language === 'ar' ? 'الرسائل' : 'Messages'}
                            {totalUnreadCount > 0 && (
                              <span className="ml-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                                {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
                              </span>
                            )}
                          </div>
                        </Button>
                      </Link>
                      <Link to="/bookmarks" onClick={() => setMobileMenuOpen(false)} id="navbar-mobile-bookmarks-link" className="block">
                        <Button
                          variant="outline"
                          className={`w-full justify-start rounded-xl transition-transform duration-300 ${
                            animateBookmark ? 'animate-pulse scale-105' : ''
                          }`}
                          id="navbar-mobile-bookmarks-button"
                        >
                          <div className="relative flex items-center">
                            <Bookmark className="w-4 h-4 mr-2" />
                            {language === 'ar' ? 'المحفوظات' : 'Bookmarks'}
                            {totalBookmarks > 0 && (
                              <span className="ml-2 bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                                {totalBookmarks > 99 ? '99+' : totalBookmarks}
                              </span>
                            )}
                          </div>
                        </Button>
                      </Link>
                    </>
                  )}
                  <Link to="/profile" onClick={() => setMobileMenuOpen(false)} id="navbar-mobile-profile-link" className="block">
                    <Button
                      variant="outline"
                      className="w-full justify-start rounded-xl"
                      id="navbar-mobile-profile-button"
                    >
                      <User className="w-4 h-4 mr-2" />
                      {t('navbar.profile')}
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  <Link to="/login" onClick={() => setMobileMenuOpen(false)} id="navbar-mobile-login-link" className="block">
                    <Button
                      variant="outline"
                      className="w-full justify-start rounded-xl"
                      id="navbar-mobile-login-button"
                    >
                      <LogIn className="w-4 h-4 mr-2" />
                      {t('navbar.login')}
                    </Button>
                  </Link>
                  <Link to="/signup" onClick={() => setMobileMenuOpen(false)} id="navbar-mobile-signup-link" className="block">
                    <Button className="w-full justify-start bg-gradient-to-r from-blue-400 to-blue-500 hover:from-blue-500 hover:to-blue-600 text-white rounded-xl" id="navbar-mobile-signup-button">
                      {t('navbar.signUp')}
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </nav>
  );
};

export default Navbar;
