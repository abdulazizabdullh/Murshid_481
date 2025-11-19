import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { 
  getUserBookmarks, 
  isBookmarked, 
  toggleBookmark as toggleBookmarkApi,
  getBookmarkedUniversities,
  getBookmarkedMajors
} from '@/lib/bookmarksApi';
import type { BookmarkType, University, Major } from '@/types/database';
import { toast } from 'sonner';

export function useBookmarks() {
  const { user } = useAuth();
  const { language } = useI18n();
  const [bookmarkedUniversities, setBookmarkedUniversities] = useState<University[]>([]);
  const [bookmarkedMajors, setBookmarkedMajors] = useState<Major[]>([]);
  const [loading, setLoading] = useState(true);
  const [animateBookmark, setAnimateBookmark] = useState(false);

  // Fetch all bookmarks
  const fetchBookmarks = async () => {
    if (!user || user.id === 'guest') {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const [universities, majors] = await Promise.all([
        getBookmarkedUniversities(user.id),
        getBookmarkedMajors(user.id)
      ]);
      setBookmarkedUniversities(universities);
      setBookmarkedMajors(majors);
    } catch (error) {
      console.error('Error fetching bookmarks:', error);
      toast.error(language === 'ar' ? 'فشل تحميل المفضلة' : 'Failed to load bookmarks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookmarks();
  }, [user]);

  // Toggle bookmark
  const toggleBookmark = async (itemType: BookmarkType, itemId: string) => {
    if (!user || user.id === 'guest') {
      toast.error(language === 'ar' ? 'يرجى تسجيل الدخول لإضافة العناصر إلى المفضلة' : 'Please log in to bookmark items');
      return false;
    }

    try {
      const newState = await toggleBookmarkApi(user.id, itemType, itemId);
      
      // Fetch fresh data immediately after toggle
      await fetchBookmarks();
      
      if (newState) {
        setAnimateBookmark(true);
        setTimeout(() => setAnimateBookmark(false), 600);
        toast.success(language === 'ar' ? 
          (itemType === 'university' ? 'تم إضافة الجامعة إلى المفضلة!' : 'تم إضافة التخصص إلى المفضلة!') :
          (itemType === 'university' ? 'University bookmarked!' : 'Major bookmarked!')
        );
      } else {
        toast.success(language === 'ar' ? 
          (itemType === 'university' ? 'تم إزالة الجامعة من المفضلة' : 'تم إزالة التخصص من المفضلة') :
          (itemType === 'university' ? 'University removed from bookmarks' : 'Major removed from bookmarks')
        );
      }
      return newState;
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      toast.error(language === 'ar' ? 'فشل تحديث المفضلة' : 'Failed to update bookmark');
      return false;
    }
  };

  // Check if item is bookmarked
  const checkIsBookmarked = (itemType: BookmarkType, itemId: string): boolean => {
    if (itemType === 'university') {
      return bookmarkedUniversities.some(u => u.id === itemId);
    } else {
      return bookmarkedMajors.some(m => m.id === itemId);
    }
  };

  const totalBookmarks = bookmarkedUniversities.length + bookmarkedMajors.length;

  return {
    bookmarkedUniversities,
    bookmarkedMajors,
    totalBookmarks,
    loading,
    toggleBookmark,
    isBookmarked: checkIsBookmarked,
    refreshBookmarks: fetchBookmarks,
    animateBookmark
  };
}

// Hook for checking if a single item is bookmarked
export function useIsBookmarked(itemType: BookmarkType, itemId: string) {
  const { user } = useAuth();
  const [bookmarked, setBookmarked] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkBookmark = async () => {
      if (!user || user.id === 'guest') {
        setBookmarked(false);
        setLoading(false);
        return;
      }

      try {
        const result = await isBookmarked(user.id, itemType, itemId);
        setBookmarked(result);
      } catch (error) {
        console.error('Error checking bookmark:', error);
      } finally {
        setLoading(false);
      }
    };

    checkBookmark();
  }, [user, itemType, itemId]);

  return { bookmarked, loading };
}

