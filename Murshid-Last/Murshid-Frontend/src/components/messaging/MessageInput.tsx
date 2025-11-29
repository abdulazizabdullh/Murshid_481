import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Loader2 } from 'lucide-react';
import { useI18n } from '@/contexts/I18nContext';
import { useMessaging } from '@/contexts/MessagingContext';

interface MessageInputProps {
  conversationId: string;
  onSend: (content: string) => Promise<void>;
  disabled?: boolean;
}

export function MessageInput({ conversationId, onSend, disabled }: MessageInputProps) {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const { language } = useI18n();
  const { setTyping } = useMessaging();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Handle typing indicator
  const handleTyping = useCallback(() => {
    setTyping(conversationId, true);
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Stop typing after 2 seconds of no input
    typingTimeoutRef.current = setTimeout(() => {
      setTyping(conversationId, false);
    }, 2000);
  }, [conversationId, setTyping]);

  // Cleanup typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      setTyping(conversationId, false);
    };
  }, [conversationId, setTyping]);

  const handleSubmit = async () => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage || sending) return;

    setSending(true);
    setTyping(conversationId, false);
    
    try {
      await onSend(trimmedMessage);
      setMessage('');
      
      // Focus back on textarea
      textareaRef.current?.focus();
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Send on Enter (without Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    handleTyping();
  };

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-900">
      <div className="flex gap-3 items-end">
        <Textarea
          ref={textareaRef}
          value={message}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={language === 'ar' ? 'اكتب رسالة...' : 'Type a message...'}
          className="min-h-[44px] max-h-[120px] resize-none rounded-xl bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:ring-blue-500"
          disabled={disabled || sending}
          dir={language}
          rows={1}
        />
        <Button
          onClick={handleSubmit}
          disabled={!message.trim() || sending || disabled}
          size="icon"
          className="h-11 w-11 rounded-xl bg-blue-500 hover:bg-blue-600 shrink-0"
        >
          {sending ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </Button>
      </div>
      <p className="text-xs text-gray-400 mt-2 text-center">
        {language === 'ar' 
          ? 'اضغط Enter للإرسال، Shift+Enter لسطر جديد'
          : 'Press Enter to send, Shift+Enter for new line'}
      </p>
    </div>
  );
}

export default MessageInput;

