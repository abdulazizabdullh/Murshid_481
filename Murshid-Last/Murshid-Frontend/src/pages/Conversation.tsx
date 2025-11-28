import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { Card } from '@/components/ui/card';
import { PageAnimation } from '@/components/animations/PageAnimation';
import { useAuth } from '@/contexts/AuthContext';
import ChatWindow from '@/components/messaging/ChatWindow';

export default function Conversation() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  // Redirect if no conversation ID
  useEffect(() => {
    if (!conversationId) {
      navigate('/messages');
    }
  }, [conversationId, navigate]);

  if (!conversationId) {
    return null;
  }

  return (
    <PageAnimation>
      <div className="min-h-screen bg-gradient-to-br from-[#e3e8ff] via-[#f5f7ff] to-[#cbd4ff] dark:from-[#0f172a] dark:via-[#1e2a4a] dark:to-[#2a3b6b]">
        <Navbar />

        <div className="py-6 px-4 sm:px-6 lg:px-10">
          <div className="max-w-4xl mx-auto">
            <Card className="overflow-hidden h-[calc(100vh-180px)] min-h-[500px]">
              <ChatWindow
                conversationId={conversationId}
                onBack={() => navigate('/messages')}
              />
            </Card>
          </div>
        </div>
      </div>
    </PageAnimation>
  );
}

