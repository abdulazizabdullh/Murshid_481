import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageSquare, Loader2 } from 'lucide-react';
import { useI18n } from '@/contexts/I18nContext';
import { useMessaging } from '@/contexts/MessagingContext';
import { formatTimeAgo } from '@/lib/timeUtils';
import OnlineStatus from './OnlineStatus';

interface ConversationListProps {
  activeConversationId?: string;
}

export function ConversationList({ activeConversationId }: ConversationListProps) {
  const navigate = useNavigate();
  const { language } = useI18n();
  const { conversations, loadingConversations, fetchConversations } = useMessaging();

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  if (loadingConversations && conversations.length === 0) {
    return (
      <div className="flex items-center justify-center h-full py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-12 px-4 text-center">
        <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
          <MessageSquare className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
          {language === 'ar' ? 'لا توجد محادثات' : 'No conversations yet'}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {language === 'ar'
            ? 'ابدأ محادثة من صفحة الملف الشخصي لأي مستخدم'
            : 'Start a conversation from any user\'s profile page'}
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="divide-y divide-gray-100 dark:divide-gray-800">
        {conversations.map((conversation) => {
          const otherUser = conversation.other_user;
          const isActive = conversation.id === activeConversationId;
          // Don't show unread badge if this is the active conversation
          const hasUnread = !isActive && (conversation.unread_count || 0) > 0;

          return (
            <button
              key={conversation.id}
              onClick={() => navigate(`/messages/${conversation.id}`)}
              className={`w-full flex items-start gap-3 p-4 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50 ${
                isActive ? 'bg-blue-50 dark:bg-blue-900/20' : ''
              }`}
            >
              <div className="relative shrink-0">
                <Avatar className="w-12 h-12">
                  <AvatarImage src={otherUser?.avatar_url} alt={otherUser?.name} />
                  <AvatarFallback className="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400">
                    {otherUser?.name?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                {otherUser && (
                  <div className="absolute -bottom-0.5 -right-0.5">
                    <OnlineStatus userId={otherUser.id} size="sm" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className={`font-medium truncate ${
                    hasUnread 
                      ? 'text-gray-900 dark:text-gray-100' 
                      : 'text-gray-700 dark:text-gray-300'
                  }`}>
                    {otherUser?.name || (language === 'ar' ? 'مستخدم' : 'User')}
                  </h4>
                  <span className="text-xs text-gray-500 dark:text-gray-400 shrink-0">
                    {conversation.last_message
                      ? formatTimeAgo(conversation.last_message.created_at, language)
                      : formatTimeAgo(conversation.created_at, language)}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2 mt-1">
                  <p className={`text-sm truncate ${
                    hasUnread
                      ? 'text-gray-900 dark:text-gray-100 font-medium'
                      : 'text-gray-500 dark:text-gray-400'
                  }`}>
                    {conversation.last_message?.content || (
                      language === 'ar' ? 'لا توجد رسائل بعد' : 'No messages yet'
                    )}
                  </p>
                  {hasUnread && (
                    <Badge className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full shrink-0">
                      {conversation.unread_count}
                    </Badge>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </ScrollArea>
  );
}

export default ConversationList;

