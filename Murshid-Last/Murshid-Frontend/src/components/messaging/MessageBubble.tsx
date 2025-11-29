import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { formatTimeAgo } from '@/lib/timeUtils';
import type { Message } from '@/types/messaging';

interface MessageBubbleProps {
  message: Message;
  showAvatar?: boolean;
}

export function MessageBubble({ message, showAvatar = true }: MessageBubbleProps) {
  const { user } = useAuth();
  const { language } = useI18n();
  const isOwn = message.sender_id === user?.id;

  return (
    <div
      className={`flex gap-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {showAvatar && !isOwn && (
        <Avatar className="w-8 h-8 shrink-0">
          <AvatarImage src={message.sender?.avatar_url} alt={message.sender?.name} />
          <AvatarFallback className="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 text-xs">
            {message.sender?.name?.charAt(0).toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>
      )}
      
      {!showAvatar && !isOwn && <div className="w-8" />}
      
      <div
        className={`max-w-[70%] ${isOwn ? 'items-end' : 'items-start'}`}
      >
        <div
          className={`px-4 py-2.5 rounded-2xl ${
            isOwn
              ? 'bg-blue-500 text-white rounded-br-md'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-md'
          }`}
        >
          <p className="text-sm whitespace-pre-wrap break-words" dir={language}>
            {message.content}
          </p>
        </div>
        <p
          className={`text-xs text-gray-500 dark:text-gray-400 mt-1 ${
            isOwn ? 'text-right' : 'text-left'
          }`}
        >
          {formatTimeAgo(message.created_at, language)}
        </p>
      </div>
    </div>
  );
}

export default MessageBubble;

