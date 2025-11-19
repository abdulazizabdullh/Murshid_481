import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { MessageCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { useI18n } from '@/contexts/I18nContext';
import { Comment } from '@/types/community';
import { getAnswerComments } from '@/lib/communityApi';
import CommentForm from './CommentForm';
import CommentCard from './CommentCard';

interface CommentSectionProps {
  answerId: string;
  initialCommentsCount?: number;
}

export default function CommentSection({
  answerId,
  initialCommentsCount = 0,
}: CommentSectionProps) {
  const { language } = useI18n();
  const [comments, setComments] = useState<Comment[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [commentsCount, setCommentsCount] = useState(initialCommentsCount);

  useEffect(() => {
    if (isExpanded) {
      loadComments();
    }
  }, [isExpanded]);

  const loadComments = async () => {
    setIsLoading(true);
    try {
      const fetchedComments = await getAnswerComments(answerId);
      setComments(fetchedComments);
      setCommentsCount(countTotalComments(fetchedComments));
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const countTotalComments = (commentList: Comment[]): number => {
    let count = commentList.length;
    commentList.forEach((comment) => {
      if (comment.replies && comment.replies.length > 0) {
        count += countTotalComments(comment.replies);
      }
    });
    return count;
  };

  const handleCommentUpdate = () => {
    loadComments();
  };

  return (
    <Card className="mt-4">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            <span>
              {language === 'ar' ? 'التعليقات' : 'Comments'} ({commentsCount})
            </span>
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <>
                <ChevronUp className="h-4 w-4 mr-2" />
                {language === 'ar' ? 'إخفاء' : 'Hide'}
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4 mr-2" />
                {language === 'ar' ? 'عرض' : 'Show'}
              </>
            )}
          </Button>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-4">
          <CommentForm
            answerId={answerId}
            onCommentCreated={handleCommentUpdate}
            placeholder={
              language === 'ar'
                ? 'أضف تعليقاً على هذه الإجابة...'
                : 'Add a comment on this answer...'
            }
          />

          {isLoading ? (
            <div className="text-center py-4 text-muted-foreground">
              {language === 'ar' ? 'جاري التحميل...' : 'Loading...'}
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              {language === 'ar'
                ? 'لا توجد تعليقات بعد. كن أول من يعلق!'
                : 'No comments yet. Be the first to comment!'}
            </div>
          ) : (
            <div className="space-y-3">
              {comments.map((comment) => (
                <CommentCard
                  key={comment.id}
                  comment={comment}
                  depth={0}
                  maxDepth={2}
                  onCommentUpdate={handleCommentUpdate}
                />
              ))}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
