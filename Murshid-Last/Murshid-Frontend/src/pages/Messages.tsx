import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { Card } from '@/components/ui/card';
import { PageAnimation } from '@/components/animations/PageAnimation';
import { MessageSquare } from 'lucide-react';
import { useI18n } from '@/contexts/I18nContext';
import { useAuth } from '@/contexts/AuthContext';
import ConversationList from '@/components/messaging/ConversationList';
import ChatWindow from '@/components/messaging/ChatWindow';

export default function Messages() {
  const { conversationId } = useParams<{ conversationId?: string }>();
  const navigate = useNavigate();
  const { language } = useI18n();
  const { user } = useAuth();
  const [isMobileView, setIsMobileView] = useState(false);

  // Detect mobile view
  useEffect(() => {
    const checkMobile = () => {
      setIsMobileView(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  const showConversationList = !isMobileView || !conversationId;
  const showChatWindow = !isMobileView || conversationId;

  return (
    <PageAnimation>
      <div className="min-h-screen bg-gradient-to-br from-[#e3e8ff] via-[#f5f7ff] to-[#cbd4ff] dark:from-[#0f172a] dark:via-[#1e2a4a] dark:to-[#2a3b6b]">
        <Navbar />

        <div className="py-6 px-4 sm:px-6 lg:px-10">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-6">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
                <MessageSquare className="w-7 h-7 text-blue-500" />
                {language === 'ar' ? 'الرسائل' : 'Messages'}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {language === 'ar'
                  ? 'تواصل مع المستخدمين الآخرين مباشرة'
                  : 'Communicate directly with other users'}
              </p>
            </div>

            {/* Main Content */}
            <Card className="overflow-hidden h-[calc(100vh-220px)] min-h-[500px]">
              <div className="flex h-full">
                {/* Conversation List - Hidden on mobile when viewing a conversation */}
                {showConversationList && (
                  <div className={`${
                    isMobileView ? 'w-full' : 'w-80 lg:w-96 border-r border-gray-200 dark:border-gray-700'
                  } bg-white dark:bg-gray-900`}>
                    <div className="border-b border-gray-200 dark:border-gray-700 px-4 py-3">
                      <h2 className="font-semibold text-gray-900 dark:text-gray-100">
                        {language === 'ar' ? 'المحادثات' : 'Conversations'}
                      </h2>
                    </div>
                    <div className="h-[calc(100%-53px)]">
                      <ConversationList activeConversationId={conversationId} />
                    </div>
                  </div>
                )}

                {/* Chat Window or Empty State */}
                {showChatWindow && (
                  <div className="flex-1 flex flex-col">
                    {conversationId ? (
                      <ChatWindow
                        conversationId={conversationId}
                        onBack={() => navigate('/messages')}
                      />
                    ) : (
                      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-gray-50 dark:bg-gray-800/50">
                        <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-6">
                          <MessageSquare className="w-10 h-10 text-gray-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                          {language === 'ar'
                            ? 'اختر محادثة'
                            : 'Select a conversation'}
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400 max-w-sm">
                          {language === 'ar'
                            ? 'اختر محادثة من القائمة أو ابدأ محادثة جديدة من صفحة الملف الشخصي لأي مستخدم'
                            : 'Choose a conversation from the list or start a new one from any user\'s profile page'}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </PageAnimation>
  );
}

