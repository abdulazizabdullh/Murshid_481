export const formatTimeAgo = (dateString: string, language: 'en' | 'ar') => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInMinutes < 1) return language === 'ar' ? 'الآن' : 'Just now';
  if (diffInMinutes < 60) return language === 'ar' ? `منذ ${diffInMinutes} دقيقة` : `${diffInMinutes}m ago`;
  if (diffInHours < 24) return language === 'ar' ? `منذ ${diffInHours} ساعة` : `${diffInHours}h ago`;
  if (diffInDays < 7) return language === 'ar' ? `منذ ${diffInDays} يوم` : `${diffInDays}d ago`;
  
  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) return language === 'ar' ? `منذ ${diffInWeeks} أسبوع` : `${diffInWeeks}w ago`;
  
  const diffInMonths = Math.floor(diffInDays / 30);
  return language === 'ar' ? `منذ ${diffInMonths} شهر` : `${diffInMonths}mo ago`;
};

export const formatFullDate = (dateString: string, language: 'en' | 'ar') => {
  const date = new Date(dateString);
  
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  };
  
  if (language === 'ar') {
    return date.toLocaleDateString('ar-EG', options);
  }
  
  return date.toLocaleDateString('en-US', options);
};
