import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { MessageSquare, Loader2 } from 'lucide-react';
import { useI18n } from '@/contexts/I18nContext';
import { useAuth } from '@/contexts/AuthContext';
import { useMessaging } from '@/contexts/MessagingContext';
import { toast } from 'sonner';

interface StartConversationButtonProps {
  userId: string;
  userName?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

export function StartConversationButton({
  userId,
  userName,
  variant = 'default',
  size = 'default',
  className = '',
}: StartConversationButtonProps) {
  const navigate = useNavigate();
  const { language } = useI18n();
  const { user } = useAuth();
  const { startConversation } = useMessaging();
  const [loading, setLoading] = useState(false);

  // Don't show button if not logged in or viewing own profile
  if (!user || user.id === userId) {
    return null;
  }

  const handleClick = async () => {
    setLoading(true);
    
    try {
      console.log('Starting conversation with userId:', userId);
      const conversation = await startConversation(userId);
      console.log('Conversation result:', conversation);
      
      if (conversation) {
        navigate(`/messages/${conversation.id}`);
        toast.success(
          language === 'ar'
            ? `بدء محادثة مع ${userName || 'المستخدم'}`
            : `Started conversation with ${userName || 'user'}`
        );
      } else {
        console.error('startConversation returned null');
        toast.error(
          language === 'ar'
            ? 'فشل في بدء المحادثة'
            : 'Failed to start conversation'
        );
      }
    } catch (error: unknown) {
      console.error('Error starting conversation:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(
        language === 'ar'
          ? `فشل في بدء المحادثة: ${errorMessage}`
          : `Failed to start conversation: ${errorMessage}`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleClick}
      variant={variant}
      size={size}
      disabled={loading}
      className={`${className}`}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : (
        <MessageSquare className="w-4 h-4 mr-2" />
      )}
      {language === 'ar' ? 'إرسال رسالة' : 'Send Message'}
    </Button>
  );
}

export default StartConversationButton;

