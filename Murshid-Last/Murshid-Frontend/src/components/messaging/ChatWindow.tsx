import { useEffect, useRef, useState, useCallback, useLayoutEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, MessageSquare } from 'lucide-react';
import { useI18n } from '@/contexts/I18nContext';
import { useMessaging } from '@/contexts/MessagingContext';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import TypingIndicator from './TypingIndicator';
import OnlineStatus from './OnlineStatus';
import type { Conversation } from '@/types/messaging';

interface ChatWindowProps {
  conversationId: string;
  onBack?: () => void;
}

export function ChatWindow({ conversationId, onBack }: ChatWindowProps) {
  const navigate = useNavigate();
  const { language } = useI18n();
  const {
    messages,
    loadingMessages,
    fetchMessages,
    sendMessage,
    conversations,
    markAsRead,
    typingUsers,
  } = useMessaging();
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  
  // Track if this is the initial load for this conversation
  const isInitialLoadRef = useRef(true);
  const previousConversationIdRef = useRef<string | null>(null);
  const previousMessageCountRef = useRef(0);
  const hasScrolledInitiallyRef = useRef(false);

  // Find the conversation from the list
  useEffect(() => {
    const conv = conversations.find(c => c.id === conversationId);
    setConversation(conv || null);
  }, [conversationId, conversations]);

  // Reset initial load flag when conversation changes
  useEffect(() => {
    if (previousConversationIdRef.current !== conversationId) {
      isInitialLoadRef.current = true;
      previousConversationIdRef.current = conversationId;
      previousMessageCountRef.current = 0;
      hasScrolledInitiallyRef.current = false;
    }
  }, [conversationId]);

  // Fetch messages when conversation changes
  useEffect(() => {
    if (conversationId) {
      fetchMessages(conversationId);
    }
  }, [conversationId]); // Remove fetchMessages from deps to avoid refetch loops

  // Scroll to bottom function
  const scrollToBottom = useCallback((instant = false) => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: instant ? 'instant' : 'smooth'
      });
    }
  }, []);

  // Instant scroll to bottom when messages first load - use useLayoutEffect for immediate DOM updates
  useLayoutEffect(() => {
    if (!loadingMessages && messages.length > 0 && !hasScrolledInitiallyRef.current) {
      // Use requestAnimationFrame to ensure DOM is painted
      requestAnimationFrame(() => {
        scrollToBottom(true);
        hasScrolledInitiallyRef.current = true;
        isInitialLoadRef.current = false;
        previousMessageCountRef.current = messages.length;
      });
    }
  }, [loadingMessages, messages.length, scrollToBottom]);

  // Handle scrolling for new messages (after initial load)
  useEffect(() => {
    if (hasScrolledInitiallyRef.current && messages.length > previousMessageCountRef.current) {
      // New message arrived: use smooth scroll
      scrollToBottom(false);
    }
    previousMessageCountRef.current = messages.length;
    
    // Mark as read when viewing messages
    if (conversationId && messages.length > 0) {
      markAsRead(conversationId);
    }
  }, [messages, conversationId, markAsRead, scrollToBottom]);

  // Auto-scroll when typing indicator appears
  const currentTypingUsers = typingUsers[conversationId] || [];
  useEffect(() => {
    if (currentTypingUsers.length > 0 && hasScrolledInitiallyRef.current) {
      scrollToBottom(false);
    }
  }, [currentTypingUsers.length, scrollToBottom]);

  const handleSend = async (content: string) => {
    await sendMessage(conversationId, content);
    // Scroll after sending
    setTimeout(scrollToBottom, 100);
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate('/messages');
    }
  };

  const otherUser = conversation?.other_user;

  // Group messages by date
  const groupedMessages = messages.reduce((groups, message) => {
    const date = new Date(message.created_at).toLocaleDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
    return groups;
  }, {} as Record<string, typeof messages>);

  // Check if we should show avatar (first message or different sender)
  const shouldShowAvatar = (index: number, messagesGroup: typeof messages) => {
    if (index === 0) return true;
    return messagesGroup[index].sender_id !== messagesGroup[index - 1].sender_id;
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center gap-3 bg-white dark:bg-gray-900">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleBack}
          className="shrink-0 md:hidden"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>

        {otherUser ? (
          <>
            <Avatar className="w-10 h-10">
              <AvatarImage src={otherUser.avatar_url} alt={otherUser.name} />
              <AvatarFallback className="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400">
                {otherUser.name?.charAt(0).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h2 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                {otherUser.name}
              </h2>
              <OnlineStatus userId={otherUser.id} showText size="sm" />
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(`/user/${otherUser.id}`)}
              className="shrink-0 text-sm text-blue-500 hover:text-blue-600"
            >
              {language === 'ar' ? 'عرض الملف' : 'View Profile'}
            </Button>
          </>
        ) : (
          <div className="flex-1">
            <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          </div>
        )}
      </div>

      {/* Messages Area */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-4">
        {loadingMessages ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
              <MessageSquare className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              {language === 'ar' ? 'ابدأ المحادثة' : 'Start the conversation'}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {language === 'ar'
                ? 'أرسل رسالة للبدء في التواصل'
                : 'Send a message to start chatting'}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedMessages).map(([date, msgs]) => (
              <div key={date}>
                <div className="flex items-center justify-center mb-4">
                  <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full">
                    {date}
                  </span>
                </div>
                <div className="space-y-3">
                  {msgs.map((message, index) => (
                    <MessageBubble
                      key={message.id}
                      message={message}
                      showAvatar={shouldShowAvatar(index, msgs)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Typing Indicator */}
        <TypingIndicator conversationId={conversationId} />
        
        {/* Scroll anchor */}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <MessageInput
        conversationId={conversationId}
        onSend={handleSend}
        disabled={!conversation}
      />
    </div>
  );
}

export default ChatWindow;

