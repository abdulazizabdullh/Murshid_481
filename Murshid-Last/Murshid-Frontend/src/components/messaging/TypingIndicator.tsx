import { useMessaging } from '@/contexts/MessagingContext';
import { useI18n } from '@/contexts/I18nContext';
import { useAuth } from '@/contexts/AuthContext';

interface TypingIndicatorProps {
  conversationId: string;
}

export function TypingIndicator({ conversationId }: TypingIndicatorProps) {
  const { typingUsers } = useMessaging();
  const { language } = useI18n();
  const { user } = useAuth();
  
  // Filter out the current user - only show when OTHERS are typing
  const allTypingUsers = typingUsers[conversationId] || [];
  const usersTyping = allTypingUsers.filter(u => u.id !== user?.id);
  
  if (usersTyping.length === 0) return null;

  const getTypingText = () => {
    if (usersTyping.length === 1) {
      const name = usersTyping[0].name || 'Someone';
      return language === 'ar' 
        ? `${name} يكتب...` 
        : `${name} is typing...`;
    }
    return language === 'ar'
      ? 'عدة أشخاص يكتبون...'
      : 'Several people are typing...';
  };

  return (
    <div className="flex items-center gap-2 px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
      <div className="flex gap-1">
        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
      <span className="italic">{getTypingText()}</span>
    </div>
  );
}

export default TypingIndicator;

