import { useState, useEffect } from "react";
import { MessageSquare, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CommentCard } from "./CommentCard";
import { CommentForm } from "./CommentForm";
import { useI18n } from "@/contexts/I18nContext";
import { useAuth } from "@/contexts/AuthContext";
import { getAnswerComments } from "@/lib/communityApi";
import type { Comment } from "@/types/community";

interface CommentSectionProps {
  answerId: string;
}

export const CommentSection = ({ answerId }: CommentSectionProps) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showCommentForm, setShowCommentForm] = useState(false);

  const { language } = useI18n();
  const { user } = useAuth();

  const loadComments = async () => {
    setIsLoading(true);
    try {
      const data = await getAnswerComments(answerId);
      // Filter out deleted comments and their deleted replies
      const filterDeleted = (comments: Comment[]): Comment[] => {
        return comments
          .filter(comment => !comment.is_deleted)
          .map(comment => ({
            ...comment,
            replies: comment.replies ? filterDeleted(comment.replies) : []
          }));
      };
      setComments(filterDeleted(data));
    } catch (error) {
      console.error("Error loading comments:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Load comments on mount to get accurate count
  useEffect(() => {
    loadComments();
  }, [answerId]);

  const handleCommentAdded = () => {
    setShowCommentForm(false);
    loadComments();
  };

  const handleCommentDeleted = () => {
    loadComments();
  };

  const totalCommentsCount = (comments: Comment[]): number => {
    return comments.reduce((count, comment) => {
      return count + 1 + (comment.replies ? totalCommentsCount(comment.replies) : 0);
    }, 0);
  };

  const commentsCount = totalCommentsCount(comments);

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 mt-4 pt-4">
      <div className="flex items-center justify-between mb-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
        >
          <MessageSquare className="w-4 h-4 mr-2" />
          <span className="text-sm font-medium">
            {commentsCount > 0
              ? language === "ar"
                ? `${commentsCount} تعليق`
                : `${commentsCount} ${commentsCount === 1 ? "comment" : "comments"}`
              : language === "ar"
              ? "لا توجد تعليقات"
              : "No comments"}
          </span>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 ml-2" />
          ) : (
            <ChevronDown className="w-4 h-4 ml-2" />
          )}
        </Button>

        {isExpanded && user && user.role && user.gender && !user.is_admin && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowCommentForm(!showCommentForm)}
            className="text-blue-600 dark:text-blue-400"
          >
            {showCommentForm
              ? language === "ar"
                ? "إلغاء"
                : "Cancel"
              : language === "ar"
              ? "إضافة تعليق"
              : "Add Comment"}
          </Button>
        )}
      </div>

      {isExpanded && (
        <div className="space-y-2">
          {showCommentForm && (
            <div className="mb-4">
              <CommentForm
                answerId={answerId}
                onSuccess={handleCommentAdded}
                onCancel={() => setShowCommentForm(false)}
              />
            </div>
          )}

          {isLoading ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              {language === "ar" ? "جاري التحميل..." : "Loading..."}
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              {language === "ar"
                ? "لا توجد تعليقات بعد. كن أول من يعلق!"
                : "No comments yet. Be the first to comment!"}
            </div>
          ) : (
            <div className="space-y-1">
              {comments.map((comment) => (
                <CommentCard
                  key={comment.id}
                  comment={comment}
                  answerId={answerId}
                  onCommentAdded={loadComments}
                  onDelete={handleCommentDeleted}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
