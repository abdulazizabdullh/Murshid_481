import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, X, Loader2, Image as ImageIcon } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface ImageUploadProps {
  currentImage?: string;
  onImageUpload: (url: string) => void;
  bucket: 'avatars' | 'university-logos' | 'major-icons' | 'specialist-proofs';
  path: string;
  label?: string;
  accept?: string;
  maxSizeMB?: number;
  className?: string;
}

export default function ImageUpload({
  currentImage,
  onImageUpload,
  bucket,
  path,
  label = 'Upload Image',
  accept = 'image/*',
  maxSizeMB = 2,
  className = ''
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentImage || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSizeMB) {
      toast.error(`File size must be less than ${maxSizeMB}MB`);
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    try {
      setUploading(true);

      // Create a preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Generate path in a user-specific folder to satisfy RLS
      // storage policy expects first folder to be auth.uid()
      const fileExt = (file.name.split('.').pop() || 'jpg').toLowerCase();
      const baseName = `avatar_${Date.now()}`;
      const filePath = `${path}/${baseName}.${fileExt}`;

      // Delete old image if exists
      if (currentImage) {
        const relPath = (() => {
          try {
            const url = new URL(currentImage);
            const marker = `/object/public/${bucket}/`;
            const idx = url.pathname.indexOf(marker);
            if (idx !== -1) return url.pathname.substring(idx + marker.length);
            const parts = url.pathname.split('/');
            const bIdx = parts.indexOf(bucket);
            if (bIdx >= 0) return parts.slice(bIdx + 1).join('/');
            return parts.slice(-2).join('/');
          } catch {
            const parts = currentImage.split('/');
            return parts.slice(-2).join('/');
          }
        })();
        if (relPath) {
          await supabase.storage.from(bucket).remove([relPath]);
        }
      }

      // Upload new image
      const { error: uploadError, data } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          upsert: true,
          contentType: file.type
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      // Save clean URL to database (without timestamp)
      onImageUpload(publicUrl);
      toast.success('Image uploaded successfully!');
    } catch (error: any) {
      console.error('Error uploading image:', error);
      toast.error(error.message || 'Failed to upload image');
      setPreview(currentImage || null);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemove = async () => {
    if (!currentImage) return;

    try {
      setUploading(true);

      // Extract filename from URL
      // Compute relative path within bucket (folder/filename)
      const relPath = (() => {
        try {
          const url = new URL(currentImage);
          const marker = `/object/public/${bucket}/`;
          const idx = url.pathname.indexOf(marker);
          if (idx !== -1) return url.pathname.substring(idx + marker.length);
          const parts = url.pathname.split('/');
          const bIdx = parts.indexOf(bucket);
          if (bIdx >= 0) return parts.slice(bIdx + 1).join('/');
          return parts.slice(-2).join('/');
        } catch {
          const parts = currentImage.split('/');
          return parts.slice(-2).join('/');
        }
      })();

      // Delete from storage
      const { error } = await supabase.storage
        .from(bucket)
        .remove([relPath]);

      if (error) throw error;

      setPreview(null);
      onImageUpload('');
      toast.success('Image removed successfully');
    } catch (error: any) {
      console.error('Error removing image:', error);
      toast.error('Failed to remove image');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center gap-4">
        {/* Preview */}
        <div className="relative">
          {preview ? (
            <div className="relative w-32 h-32 rounded-lg overflow-hidden border-2 border-gray-200 dark:border-gray-700">
              <img
                src={preview}
                alt="Preview"
                className="w-full h-full object-cover"
              />
              {!uploading && (
                <button
                  onClick={handleRemove}
                  className="absolute top-1 right-1 p-1 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors"
                  title="Remove image"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          ) : (
            <div className="w-32 h-32 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center bg-gray-50 dark:bg-gray-800">
              <ImageIcon className="w-12 h-12 text-gray-400" />
            </div>
          )}
        </div>

        {/* Upload Button */}
        <div className="flex-1">
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            onChange={handleFileSelect}
            className="hidden"
            disabled={uploading}
          />
          <Button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            variant="outline"
            className="w-full"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                {label}
              </>
            )}
          </Button>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Max size: {maxSizeMB}MB. Supported: JPG, PNG, GIF, WebP
          </p>
        </div>
      </div>
    </div>
  );
}

