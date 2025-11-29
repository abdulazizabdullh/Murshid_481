import { useMessaging } from '@/contexts/MessagingContext';

interface OnlineStatusProps {
  userId: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function OnlineStatus({ userId, showText = false, size = 'sm' }: OnlineStatusProps) {
  const { onlineUsers } = useMessaging();
  const isOnline = onlineUsers[userId] || false;

  const sizeClasses = {
    sm: 'w-2.5 h-2.5',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
  };

  return (
    <div className="flex items-center gap-1.5">
      <span
        className={`${sizeClasses[size]} rounded-full ${
          isOnline
            ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]'
            : 'bg-gray-400'
        }`}
      />
      {showText && (
        <span className={`text-xs ${isOnline ? 'text-green-600 dark:text-green-400' : 'text-gray-500'}`}>
          {isOnline ? 'Online' : 'Offline'}
        </span>
      )}
    </div>
  );
}

export default OnlineStatus;

