import { useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import { enUS, ar as arLocale } from "date-fns/locale";
import { MessageCircle, Edit2, Trash2, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LikeButton } from "./LikeButton";
import { CommentForm } from "./CommentForm";
import type { Comment } from "@/types/community";
import { useI18n } from "@/contexts/I18nContext";
import { useAuth } from "@/contexts/AuthContext";
import {
  likeComment,
  unlikeComment,
  getUserCommentLike,
  deleteComment,
} from "@/lib/communityApi";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ConfirmDialog";

interface CommentCardProps {
  comment: Comment;
  answerId: string;
  onReply?: (parentId: string) => void;
  onEdit?: (commentId: string, content: string) => void;
  onDelete?: (commentId: string) => void;
  onCommentAdded?: () => void;
  level?: number;
}

export const CommentCard = ({
  comment,
  answerId,
  onEdit,
  onDelete,
  onCommentAdded,
  level = 0,
}: CommentCardProps) => {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const { user } = useAuth();
  const { language } = useI18n();

  const isAuthor = user?.id === comment.author_id;
  const isAdmin = user?.is_admin;
  const canModify = isAuthor || isAdmin;

  // Load like status
  useEffect(() => {
    if (user) {
      getUserCommentLike(comment.id, user.id).then(setIsLiked);
    }
  }, [user, comment.id]);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      if (!user) return;
      await deleteComment(comment.id, user.id, "User deleted");
      toast.success(language === "ar" ? "تم حذف التعليق" : "Comment deleted");
      onDelete?.(comment.id);
    } catch (error) {
      console.error("Error deleting comment:", error);
      toast.error(language === "ar" ? "فشل حذف التعليق" : "Failed to delete comment");
    } finally {
      setIsDeleting(false);
      setDeleteConfirmOpen(false);
    }
  };

  const handleReplySuccess = () => {
    setShowReplyForm(false);
    onCommentAdded?.();
  };

  const formattedDate = formatDistanceToNow(new Date(comment.created_at), {
    addSuffix: true,
    locale: language === "ar" ? arLocale : enUS,
  });

  const indentClass = level > 0 ? `ml-${Math.min(level * 8, 16)}` : "";
  const maxNestingLevel = 3;

  return (
    <div className={`${indentClass} ${level > 0 ? "border-l-2 border-gray-200 dark:border-gray-700 pl-4" : ""}`}>
      <div className="flex gap-3 py-3">
        <Avatar 
          className="w-8 h-8 cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all"
          onClick={() => window.location.href = `/user/${comment.author_id}`}
        >
          <AvatarImage src={comment.author_avatar} alt={comment.author_name} />
          <AvatarFallback className="text-xs">
            {comment.author_name?.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span 
                className="text-sm font-semibold text-gray-900 dark:text-gray-100 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                onClick={() => window.location.href = `/user/${comment.author_id}`}
              >
                {comment.author_name}
              </span>

              {comment.author_role && (
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    comment.author_role === "admin"
                      ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                      : comment.author_role === "specialist"
                      ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                      : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
                  }`}
                >
                  {comment.author_role === "admin"
                    ? language === "ar"
                      ? "مشرف"
                      : "Admin"
                    : comment.author_role === "specialist"
                    ? language === "ar"
                      ? "متخصص"
                      : "Specialist"
                    : language === "ar"
                    ? "طالب"
                    : "Student"}
                </span>
              )}

              <span className="text-xs text-gray-500 dark:text-gray-400">
                {formattedDate}
              </span>

              {comment.updated_at !== comment.created_at && (
                <span className="text-xs text-gray-400 dark:text-gray-500 italic">
                  ({language === "ar" ? "معدل" : "edited"})
                </span>
              )}
            </div>

            {canModify && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {isAuthor && (
                    <DropdownMenuItem onClick={() => onEdit?.(comment.id, comment.content)}>
                      <Edit2 className="w-4 h-4 mr-2" />
                      {language === "ar" ? "تعديل" : "Edit"}
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    onClick={() => setDeleteConfirmOpen(true)}
                    disabled={isDeleting}
                    className="text-red-600 dark:text-red-400"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    {language === "ar" ? "حذف" : "Delete"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          <p className="text-sm text-gray-700 dark:text-gray-300 mt-1 whitespace-pre-wrap break-words">
            {comment.content}
          </p>

          <div className="flex items-center gap-2 mt-2">
            <LikeButton
              itemId={comment.id}
              itemType="comment"
              initialLikesCount={comment.likes_count}
              initialIsLiked={isLiked}
              onLike={likeComment}
              onUnlike={unlikeComment}
              disabled={!user || !user.role || !user.gender}
            />

            {level < maxNestingLevel && user && !user.is_admin && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowReplyForm(!showReplyForm)}
                className="text-gray-500 hover:text-blue-500"
              >
                <MessageCircle className="w-4 h-4 mr-1" />
                <span className="text-sm">
                  {language === "ar" ? "رد" : "Reply"}
                </span>
              </Button>
            )}
          </div>

          {showReplyForm && (
            <div className="mt-3">
              <CommentForm
                answerId={answerId}
                parentCommentId={comment.id}
                onSuccess={handleReplySuccess}
                onCancel={() => setShowReplyForm(false)}
                placeholder={
                  language === "ar"
                    ? `الرد على ${comment.author_name}...`
                    : `Reply to ${comment.author_name}...`
                }
              />
            </div>
          )}

          {/* Render nested replies */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-2">
              {comment.replies.map((reply) => (
                <CommentCard
                  key={reply.id}
                  comment={reply}
                  answerId={answerId}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onCommentAdded={onCommentAdded}
                  level={level + 1}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        onConfirm={handleDelete}
        title={language === "ar" ? "حذف التعليق" : "Delete Comment"}
        description={language === "ar" ? "هل أنت متأكد من حذف هذا التعليق؟ لا يمكن التراجع عن هذا الإجراء." : "Are you sure you want to delete this comment? This action cannot be undone."}
        confirmText={language === "ar" ? "حذف" : "Delete"}
        destructive={true}
      />
    </div>
  );
};
