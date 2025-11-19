import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { X } from 'lucide-react';
import { useI18n } from '@/contexts/I18nContext';
import { useToast } from '@/hooks/use-toast';
import { updateCommunityPost } from '@/lib/communityApi';
import { Post } from '@/types/community';

interface EditPostModalProps {
  post: Post;
  isOpen: boolean;
  onClose: () => void;
  onPostUpdated: () => void;
}

export default function EditPostModal({
  post,
  isOpen,
  onClose,
  onPostUpdated,
}: EditPostModalProps) {
  const { language } = useI18n();
  const { toast } = useToast();
  const [title, setTitle] = useState(post.title);
  const [content, setContent] = useState(post.content);
  const [tags, setTags] = useState<string[]>(post.tags || []);
  const [tagInput, setTagInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddTag = () => {
    const trimmedTag = tagInput.trim();
    if (trimmedTag && !tags.includes(trimmedTag) && tags.length < 5) {
      setTags([...tags, trimmedTag]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description:
          language === 'ar'
            ? 'العنوان مطلوب'
            : 'Title is required',
        variant: 'destructive',
      });
      return;
    }

    if (!content.trim()) {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description:
          language === 'ar'
            ? 'المحتوى مطلوب'
            : 'Content is required',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await updateCommunityPost(post.id, {
        title: title.trim(),
        content: content.trim(),
        tags: tags.length > 0 ? tags : undefined,
      });

      toast({
        title: language === 'ar' ? 'نجح' : 'Success',
        description:
          language === 'ar'
            ? 'تم تحديث المنشور بنجاح'
            : 'Post updated successfully',
      });

      onPostUpdated();
      onClose();
    } catch (error) {
      console.error('Error updating post:', error);
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description:
          language === 'ar'
            ? 'فشل في تحديث المنشور. حاول مرة أخرى.'
            : 'Failed to update post. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {language === 'ar' ? 'تعديل المنشور' : 'Edit Post'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">
              {language === 'ar' ? 'العنوان' : 'Title'} *
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={
                language === 'ar'
                  ? 'أدخل عنوان المنشور'
                  : 'Enter post title'
              }
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">
              {language === 'ar' ? 'المحتوى' : 'Content'} *
            </Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={
                language === 'ar'
                  ? 'اكتب محتوى المنشور...'
                  : 'Write your post content...'
              }
              rows={8}
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">
              {language === 'ar' ? 'الوسوم (اختياري)' : 'Tags (Optional)'}
            </Label>
            <div className="flex gap-2">
              <Input
                id="tags"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  language === 'ar'
                    ? 'أضف وسم واضغط Enter'
                    : 'Add tag and press Enter'
                }
                disabled={isSubmitting || tags.length >= 5}
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleAddTag}
                disabled={isSubmitting || tags.length >= 5 || !tagInput.trim()}
              >
                {language === 'ar' ? 'إضافة' : 'Add'}
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      disabled={isSubmitting}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              {language === 'ar'
                ? `${tags.length}/5 وسوم`
                : `${tags.length}/5 tags`}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            {language === 'ar' ? 'إلغاء' : 'Cancel'}
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting
              ? language === 'ar'
                ? 'جاري الحفظ...'
                : 'Saving...'
              : language === 'ar'
              ? 'حفظ التغييرات'
              : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
