import { useState, useEffect, useRef } from "react";
import { Loader2, X, Plus, Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/contexts/I18nContext";
import { toast } from "sonner";
import { updateCommunityPost } from "@/lib/communityApi";
import { getUniversities } from "@/lib/universitiesApi";
import { getMajors } from "@/lib/majorsApi";
import type { Post, UpdatePostRequest } from "@/types/community";
import type { University, Major } from "@/types/database";

interface EditPostModalProps {
  post: Post;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (updatedPost: Post) => void;
  editorId?: string;
  editorName?: string;
}

export const EditPostModal = ({
  post,
  isOpen,
  onClose,
  onSuccess,
  editorId,
  editorName,
}: EditPostModalProps) => {
  const [title, setTitle] = useState(post.title);
  const [content, setContent] = useState(post.content);
  const [tags, setTags] = useState(post.tags.join(", "));
  const [universityTags, setUniversityTags] = useState<string[]>(post.university_tags || []);
  const [majorTags, setMajorTags] = useState<string[]>(post.major_tags || []);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [universities, setUniversities] = useState<University[]>([]);
  const [majors, setMajors] = useState<Major[]>([]);
  const [universitySearch, setUniversitySearch] = useState('');
  const [majorSearch, setMajorSearch] = useState('');
  const [showUniversityDropdown, setShowUniversityDropdown] = useState(false);
  const [showMajorDropdown, setShowMajorDropdown] = useState(false);
  
  const universityDropdownRef = useRef<HTMLDivElement>(null);
  const majorDropdownRef = useRef<HTMLDivElement>(null);

  const { language } = useI18n();

  // Fetch universities and majors
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [universitiesData, majorsData] = await Promise.all([
          getUniversities({}),
          getMajors({})
        ]);
        setUniversities(universitiesData);
        setMajors(majorsData);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    fetchData();
  }, []);

  // Reset form when modal opens with new post
  useEffect(() => {
    if (isOpen) {
      setTitle(post.title);
      setContent(post.content);
      setTags(post.tags.join(", "));
      setUniversityTags(post.university_tags || []);
      setMajorTags(post.major_tags || []);
    }
  }, [isOpen, post]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (universityDropdownRef.current && !universityDropdownRef.current.contains(event.target as Node)) {
        setShowUniversityDropdown(false);
      }
    };
    if (showUniversityDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showUniversityDropdown]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (majorDropdownRef.current && !majorDropdownRef.current.contains(event.target as Node)) {
        setShowMajorDropdown(false);
      }
    };
    if (showMajorDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMajorDropdown]);

  const addUniversity = (university: University) => {
    const universityName = language === 'ar' && university.name_ar ? university.name_ar : university.name;
    
    if (universityTags.length >= 3) {
      toast.error(language === 'ar' ? 'يمكنك إضافة 3 جامعات كحد أقصى' : 'You can add maximum 3 universities');
      return;
    }
    
    if (!universityTags.includes(universityName)) {
      setUniversityTags(prev => [...prev, universityName]);
    }
    setUniversitySearch('');
    setShowUniversityDropdown(false);
  };

  const addMajor = (major: Major) => {
    const majorName = language === 'ar' && major.name_ar ? major.name_ar : major.name;
    
    if (majorTags.length >= 5) {
      toast.error(language === 'ar' ? 'يمكنك إضافة 5 تخصصات كحد أقصى' : 'You can add maximum 5 majors');
      return;
    }
    
    if (!majorTags.includes(majorName)) {
      setMajorTags(prev => [...prev, majorName]);
    }
    setMajorSearch('');
    setShowMajorDropdown(false);
  };

  const removeUniversityTag = (index: number) => {
    setUniversityTags(prev => prev.filter((_, i) => i !== index));
  };

  const removeMajorTag = (index: number) => {
    setMajorTags(prev => prev.filter((_, i) => i !== index));
  };

  const filteredUniversities = universities.filter((uni) => {
    const name = language === 'ar' && uni.name_ar ? uni.name_ar : uni.name;
    return name.toLowerCase().includes(universitySearch.toLowerCase());
  });

  const filteredMajors = majors.filter((major) => {
    const name = language === 'ar' && major.name_ar ? major.name_ar : major.name;
    return name.toLowerCase().includes(majorSearch.toLowerCase());
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedTitle = title.trim();
    const trimmedContent = content.trim();

    if (!trimmedTitle) {
      toast.error(language === "ar" ? "العنوان مطلوب" : "Title is required");
      return;
    }

    if (!trimmedContent) {
      toast.error(language === "ar" ? "المحتوى مطلوب" : "Content is required");
      return;
    }

    if (trimmedTitle.length < 10) {
      toast.error(
        language === "ar"
          ? "العنوان قصير جداً (10 أحرف على الأقل)"
          : "Title is too short (minimum 10 characters)"
      );
      return;
    }

    if (trimmedContent.length < 20) {
      toast.error(
        language === "ar"
          ? "المحتوى قصير جداً (20 حرف على الأقل)"
          : "Content is too short (minimum 20 characters)"
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const parsedTags = tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean);

      const payload: UpdatePostRequest = {
        title: trimmedTitle,
        content: trimmedContent,
        tags: parsedTags,
        major_tags: majorTags,
        university_tags: universityTags,
      };

      const updatedPost = await updateCommunityPost(post.id, payload, editorId, editorName);

      toast.success(
        language === "ar"
          ? "تم تحديث المنشور بنجاح"
          : "Post updated successfully"
      );

      onSuccess?.(updatedPost);
      onClose();
    } catch (error) {
      console.error("Error updating post:", error);
      toast.error(
        language === "ar"
          ? "فشل في تحديث المنشور"
          : "Failed to update post"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {language === "ar" ? "تعديل المنشور" : "Edit Post"}
          </DialogTitle>
          <DialogDescription>
            {language === "ar"
              ? "عدل عنوان ومحتوى منشورك"
              : "Edit your post title and content"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="edit-post-title">
              {language === "ar" ? "العنوان" : "Title"} <span className="text-red-500">*</span>
            </Label>
            <Input
              id="edit-post-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={language === "ar" ? "عنوان المنشور..." : "Post title..."}
              disabled={isSubmitting}
              dir={language === "ar" ? "rtl" : "ltr"}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {title.length}/200
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-post-content">
              {language === "ar" ? "المحتوى" : "Content"} <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="edit-post-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={
                language === "ar"
                  ? "اكتب محتوى منشورك هنا..."
                  : "Write your post content here..."
              }
              className="min-h-[200px] resize-none"
              disabled={isSubmitting}
              dir={language === "ar" ? "rtl" : "ltr"}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {content.length}/5000
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-post-tags">
              {language === "ar" ? "الوسوم" : "Tags"}
            </Label>
            <Input
              id="edit-post-tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder={
                language === "ar"
                  ? "وسم1, وسم2, وسم3"
                  : "tag1, tag2, tag3"
              }
              disabled={isSubmitting}
              dir={language === "ar" ? "rtl" : "ltr"}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {language === "ar"
                ? "افصل الوسوم بفاصلة"
                : "Separate tags with commas"}
            </p>
          </div>

          {/* University Tags */}
          <div className="space-y-2">
            <Label>
              {language === 'ar' ? 'الجامعات' : 'Universities'}
            </Label>
            <div ref={universityDropdownRef} className="relative">
              <div className="relative">
                <Search className={`absolute ${language === 'ar' ? 'right-3' : 'left-3'} top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4`} />
                <Input
                  value={universitySearch}
                  onChange={(e) => {
                    setUniversitySearch(e.target.value);
                    setShowUniversityDropdown(true);
                  }}
                  onFocus={() => setShowUniversityDropdown(true)}
                  placeholder={language === 'ar' ? 'ابحث عن جامعة...' : 'Search for a university...'}
                  className={language === 'ar' ? 'pr-10' : 'pl-10'}
                  dir={language}
                  disabled={isSubmitting}
                />
              </div>
              {showUniversityDropdown && filteredUniversities.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {filteredUniversities.map((university) => (
                    <button
                      key={university.id}
                      type="button"
                      onClick={() => addUniversity(university)}
                      className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      dir={language}
                    >
                      {language === 'ar' && university.name_ar ? university.name_ar : university.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {universityTags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {universityTags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="gap-1">
                    🏛️ {tag}
                    <button
                      type="button"
                      onClick={() => removeUniversityTag(index)}
                      className="ml-1 hover:text-red-500"
                      disabled={isSubmitting}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {language === 'ar' ? `${universityTags.length}/3 جامعات` : `${universityTags.length}/3 universities`}
            </p>
          </div>

          {/* Major Tags */}
          <div className="space-y-2">
            <Label>
              {language === 'ar' ? 'التخصصات' : 'Majors'}
            </Label>
            <div ref={majorDropdownRef} className="relative">
              <div className="relative">
                <Search className={`absolute ${language === 'ar' ? 'right-3' : 'left-3'} top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4`} />
                <Input
                  value={majorSearch}
                  onChange={(e) => {
                    setMajorSearch(e.target.value);
                    setShowMajorDropdown(true);
                  }}
                  onFocus={() => setShowMajorDropdown(true)}
                  placeholder={language === 'ar' ? 'ابحث عن تخصص...' : 'Search for a major...'}
                  className={language === 'ar' ? 'pr-10' : 'pl-10'}
                  dir={language}
                  disabled={isSubmitting}
                />
              </div>
              {showMajorDropdown && filteredMajors.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {filteredMajors.map((major) => (
                    <button
                      key={major.id}
                      type="button"
                      onClick={() => addMajor(major)}
                      className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      dir={language}
                    >
                      {language === 'ar' && major.name_ar ? major.name_ar : major.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {majorTags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {majorTags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="gap-1">
                    📚 {tag}
                    <button
                      type="button"
                      onClick={() => removeMajorTag(index)}
                      className="ml-1 hover:text-red-500"
                      disabled={isSubmitting}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {language === 'ar' ? `${majorTags.length}/5 تخصصات` : `${majorTags.length}/5 majors`}
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              {language === "ar" ? "إلغاء" : "Cancel"}
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !title.trim() || !content.trim()}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {language === "ar" ? "جاري الحفظ..." : "Saving..."}
                </>
              ) : (
                language === "ar" ? "حفظ التغييرات" : "Save Changes"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
