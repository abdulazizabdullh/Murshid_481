import { supabase } from "./supabase";
import type {
  Post,
  Answer,
  Comment,
  CreatePostRequest,
  CreateAnswerRequest,
  CreateCommentRequest,
  UpdatePostRequest,
  UpdateAnswerRequest,
  UpdateCommentRequest,
  Report,
  CreateReportRequest,
  UpdateReportRequest,
  ReportWithContent,
  ReportStatus,
  ReportContentType
} from "@/types/community";

type CommunityAuthor = {
  id: string;
  name?: string;
  role?: string;
  establishment_name?: string;
  track?: string;
  level?: string;
  university_id?: string;
  avatar_url?: string;
  is_admin?: boolean;
};

const mapPost = (row: any): Post => ({
  id: row.id,
  title: row.title,
  content: row.content,
  author_id: row.author_id,
  author_name: row.author_name ?? "Anonymous",
  author_avatar: row.author_avatar,
  author_role: (row.author_role ?? "student") as Post["author_role"],
  author_university: row.author_university ?? undefined,
  author_major: row.author_major ?? undefined,
  author_academic_level: row.author_academic_level ?? undefined,
  post_type: row.post_type,
  tags: row.tags ?? [],
  major_tags: row.major_tags ?? [],
  university_tags: row.university_tags ?? [],
  likes_count: row.likes_count ?? 0,
  answers_count: row.answers_count ?? 0,
  // views_count: row.views_count ?? 0, // VIEWS FEATURE DISABLED
  views_count: 0, // VIEWS FEATURE DISABLED - keeping for type compatibility
  is_solved: row.is_solved ?? false,
  created_at: row.created_at,
  updated_at: row.updated_at,
  is_deleted: row.is_deleted ?? false,
  deleted_at: row.deleted_at ?? undefined,
  deleted_by: row.deleted_by ?? undefined,
  deletion_reason: row.deletion_reason ?? undefined,
});

const mapAnswer = (row: any): Answer => ({
  id: row.id,
  post_id: row.post_id,
  content: row.content,
  author_id: row.author_id,
  author_name: row.author_name ?? "Anonymous",
  author_avatar: row.author_avatar,
  author_role: (row.author_role ?? "student") as Answer["author_role"],
  author_university: row.author_university ?? undefined,
  author_major: row.author_major ?? undefined,
  author_academic_level: row.author_academic_level ?? undefined,
  likes_count: row.likes_count ?? 0,
  is_accepted: row.is_accepted ?? false,
  created_at: row.created_at,
  updated_at: row.updated_at,
  is_deleted: row.is_deleted ?? false,
  deleted_at: row.deleted_at ?? undefined,
  deleted_by: row.deleted_by ?? undefined,
  deletion_reason: row.deletion_reason ?? undefined,
});

const getNormalizedRole = (author: CommunityAuthor): Post["author_role"] => {
  if (author.is_admin) return "admin";
  const role = author.role?.toLowerCase();
  if (role === "specialist") return "specialist";
  return "student";
};

export async function getCommunityPosts(params?: { search?: string; type?: "all" | "questions" | "discussions" | "announcements" }): Promise<Post[]> {
  let query = supabase
    .from("community_posts")
    .select("*")
    .eq("is_deleted", false)
    .order("created_at", { ascending: false });

  if (params?.type && params.type !== "all") {
    const typeMap: Record<string, string> = {
      questions: "question",
      discussions: "discussion",
      announcements: "announcement",
    };
    query = query.eq("post_type", typeMap[params.type]);
  }

  if (params?.search) {
    const search = params.search.trim();
    query = query.or(
      `title.ilike.%${search}%,content.ilike.%${search}%`
    );
  }

  const { data, error } = await query;
  if (error) {
    console.error("Error fetching community posts:", error);
    throw error;
  }

  if (!data || data.length === 0) {
    return [];
  }

  // Calculate counts dynamically
  const postIds = data.map(p => p.id);
  
  // Get actual likes counts
  const { data: likesData } = await supabase
    .from("community_post_likes")
    .select("post_id")
    .in("post_id", postIds);
  
  const likesCountMap = new Map<string, number>();
  if (likesData) {
    likesData.forEach(like => {
      likesCountMap.set(like.post_id, (likesCountMap.get(like.post_id) || 0) + 1);
    });
  }

  // Get actual answers counts (excluding deleted)
  const { data: answersData } = await supabase
    .from("community_answers")
    .select("post_id")
    .in("post_id", postIds)
    .eq("is_deleted", false);
  
  const answersCountMap = new Map<string, number>();
  if (answersData) {
    answersData.forEach(answer => {
      answersCountMap.set(answer.post_id, (answersCountMap.get(answer.post_id) || 0) + 1);
    });
  }

  // Map posts with dynamic counts
  return data.map(row => {
    const post = mapPost(row);
    post.likes_count = likesCountMap.get(post.id) || 0;
    post.answers_count = answersCountMap.get(post.id) || 0;
    // views_count stays as stored (updated by increment function) - VIEWS FEATURE DISABLED
    post.views_count = 0; // VIEWS FEATURE DISABLED
    return post;
  });
}

export async function getCommunityPostById(id: string): Promise<Post | null> {
  const { data, error } = await supabase
    .from("community_posts")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching post:", error);
    throw error;
  }

  if (!data) {
    return null;
  }

  // Calculate counts dynamically for consistency
  // Get actual likes count
  const { count: likesCount } = await supabase
    .from("community_post_likes")
    .select("*", { count: "exact", head: true })
    .eq("post_id", id);

  // Get actual answers count (excluding deleted)
  const { count: answersCount } = await supabase
    .from("community_answers")
    .select("*", { count: "exact", head: true })
    .eq("post_id", id)
    .eq("is_deleted", false);

  const post = mapPost(data);
  post.likes_count = likesCount || 0;
  post.answers_count = answersCount || 0;
  // views_count stays as stored (updated by increment function) - VIEWS FEATURE DISABLED
  post.views_count = 0; // VIEWS FEATURE DISABLED

  return post;
}

export async function createCommunityPost(payload: CreatePostRequest, author: CommunityAuthor): Promise<Post> {
  const normalizedRole = getNormalizedRole(author);
  const safePostType = normalizedRole === "student" ? "question" : payload.post_type;

  const { data, error } = await supabase
    .from("community_posts")
    .insert([
      {
        title: payload.title,
        content: payload.content,
        post_type: safePostType,
        tags: payload.tags ?? [],
        major_tags: payload.major_tags ?? [],
        university_tags: payload.university_tags ?? [],
        author_id: author.id,
        author_name: author.name ?? "Anonymous",
        author_role: normalizedRole,
        author_university: author.establishment_name ?? author.university_id,
        author_major: author.track,
        author_academic_level: author.level,
        author_avatar: author.avatar_url,
      },
    ])
    .select()
    .single();

  if (error) {
    console.error("Error creating community post:", error);
    throw new Error(error.message || "Failed to create community post");
  }

  return mapPost(data);
}

export async function getPostAnswers(postId: string): Promise<Answer[]> {
  const { data, error } = await supabase
    .from("community_answers")
    .select("*")
    .eq("post_id", postId)
    .eq("is_deleted", false)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching answers:", error);
    throw error;
  }

  console.log(`Fetched answers for post ${postId}:`, data?.length || 0, data);
  return (data ?? []).map(mapAnswer);
}

export async function createCommunityAnswer(payload: CreateAnswerRequest, author: CommunityAuthor): Promise<Answer> {
  const normalizedRole = getNormalizedRole(author);

  const { data, error } = await supabase
    .from("community_answers")
    .insert([
      {
        post_id: payload.post_id,
        content: payload.content,
        author_id: author.id,
        author_name: author.name ?? "Anonymous",
        author_role: normalizedRole,
        author_university: author.establishment_name ?? author.university_id,
        author_major: author.track,
        author_academic_level: author.level,
        author_avatar: author.avatar_url,
        is_deleted: false,
      },
    ])
    .select()
    .single();

  if (error) {
    console.error("Error creating answer:", error);
    throw new Error(error.message || "Failed to create answer");
  }

  console.log("Created answer data:", data);
  return mapAnswer(data);
}

export async function getCommunityPostsByAuthor(authorId: string): Promise<Post[]> {
  const { data, error } = await supabase
    .from("community_posts")
    .select("*")
    .eq("author_id", authorId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching author posts:", error);
    throw error;
  }

  return (data ?? []).map(mapPost);
}

// Admin function to get ALL posts including deleted ones
export async function getAllCommunityPostsForAdmin(): Promise<Post[]> {
  const { data, error } = await supabase
    .from("community_posts")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching all posts:", error);
    throw error;
  }

  return (data ?? []).map(mapPost);
}

export async function getCommunityAnswersByAuthor(authorId: string): Promise<Answer[]> {
  const { data, error } = await supabase
    .from("community_answers")
    .select("*")
    .eq("author_id", authorId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching author answers:", error);
    throw error;
  }

  return (data ?? []).map(mapAnswer);
}

export async function deleteCommunityPost(postId: string, deletedBy: string, deletionReason: string): Promise<void> {
  const now = new Date().toISOString();

  // First, soft-delete all comments on all answers of this post
  const { data: answers } = await supabase
    .from("community_answers")
    .select("id")
    .eq("post_id", postId);

  if (answers && answers.length > 0) {
    const answerIds = answers.map(a => a.id);
    
    // Soft-delete all comments for these answers with "Post deleted" reason
    await supabase
      .from("community_comments")
      .update({
        is_deleted: true,
        deleted_at: now,
        deleted_by: deletedBy,
        deletion_reason: "Post deleted"
      })
      .in("answer_id", answerIds);

    // Soft-delete all answers with "Post deleted" reason
    await supabase
      .from("community_answers")
      .update({
        is_deleted: true,
        deleted_at: now,
        deleted_by: deletedBy,
        deletion_reason: "Post deleted"
      })
      .in("id", answerIds);
  }

  // Soft-delete the post with the admin's specified reason
  const { error } = await supabase
    .from("community_posts")
    .update({
      is_deleted: true,
      deleted_at: now,
      deleted_by: deletedBy,
      deletion_reason: deletionReason
    })
    .eq("id", postId);

  if (error) {
    console.error("Error deleting post:", error);
    throw error;
  }
}

// ============================================================================
// LIKES SYSTEM
// ============================================================================

export async function likePost(postId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from("community_post_likes")
    .insert([{ post_id: postId, user_id: userId }]);

  if (error) {
    // Ignore duplicate key errors (user already liked)
    if (error.code !== "23505") {
      console.error("Error liking post:", error);
      throw error;
    }
  }
}

export async function unlikePost(postId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from("community_post_likes")
    .delete()
    .eq("post_id", postId)
    .eq("user_id", userId);

  if (error) {
    console.error("Error unliking post:", error);
    throw error;
  }
}

export async function getUserPostLike(postId: string, userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("community_post_likes")
    .select("id")
    .eq("post_id", postId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("Error checking post like:", error);
    return false;
  }

  return !!data;
}

export async function likeAnswer(answerId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from("community_answer_likes")
    .insert([{ answer_id: answerId, user_id: userId }]);

  if (error) {
    // Ignore duplicate key errors (user already liked)
    if (error.code !== "23505") {
      console.error("Error liking answer:", error);
      throw error;
    }
  }
}

export async function unlikeAnswer(answerId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from("community_answer_likes")
    .delete()
    .eq("answer_id", answerId)
    .eq("user_id", userId);

  if (error) {
    console.error("Error unliking answer:", error);
    throw error;
  }
}

export async function getUserAnswerLike(answerId: string, userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("community_answer_likes")
    .select("id")
    .eq("answer_id", answerId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("Error checking answer like:", error);
    return false;
  }

  return !!data;
}

export async function likeComment(commentId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from("community_comment_likes")
    .insert([{ comment_id: commentId, user_id: userId }]);

  if (error) {
    // Ignore duplicate key errors (user already liked)
    if (error.code !== "23505") {
      console.error("Error liking comment:", error);
      throw error;
    }
  }
}

export async function unlikeComment(commentId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from("community_comment_likes")
    .delete()
    .eq("comment_id", commentId)
    .eq("user_id", userId);

  if (error) {
    console.error("Error unliking comment:", error);
    throw error;
  }
}

export async function getUserCommentLike(commentId: string, userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("community_comment_likes")
    .select("id")
    .eq("comment_id", commentId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("Error checking comment like:", error);
    return false;
  }

  return !!data;
}

// ============================================================================
// VIEWS SYSTEM - DISABLED
// ============================================================================

/* VIEWS FEATURE DISABLED
export async function incrementPostViews(postId: string): Promise<void> {
  const { error } = await supabase.rpc("increment_post_views", { p_post_id: postId });

  if (error) {
    // Fallback to manual increment if RPC doesn't exist
    const { data: post } = await supabase
      .from("community_posts")
      .select("views_count")
      .eq("id", postId)
      .single();

    if (post) {
      await supabase
        .from("community_posts")
        .update({ views_count: (post.views_count ?? 0) + 1 })
        .eq("id", postId);
    }
  }
}
*/

// ============================================================================
// COMMENTS SYSTEM
// ============================================================================

const mapComment = (row: any): Comment => ({
  id: row.id,
  answer_id: row.answer_id,
  parent_comment_id: row.parent_comment_id ?? undefined,
  content: row.content,
  author_id: row.author_id,
  author_name: row.author_name ?? "Anonymous",
  author_avatar: row.author_avatar,
  author_role: (row.author_role ?? "student") as Comment["author_role"],
  author_university: row.author_university ?? undefined,
  author_major: row.author_major ?? undefined,
  author_academic_level: row.author_academic_level ?? undefined,
  likes_count: row.likes_count ?? 0,
  created_at: row.created_at,
  updated_at: row.updated_at,
  is_deleted: row.is_deleted ?? false,
  deleted_at: row.deleted_at ?? undefined,
  deleted_by: row.deleted_by ?? undefined,
  deletion_reason: row.deletion_reason ?? undefined,
  replies: [],
});

export async function getAnswerComments(answerId: string): Promise<Comment[]> {
  const { data, error } = await supabase
    .from("community_comments")
    .select("*")
    .eq("answer_id", answerId)
    .eq("is_deleted", false)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching comments:", error);
    throw error;
  }

  const comments = (data ?? []).map(mapComment);

  // Build threaded structure
  const commentMap = new Map<string, Comment>();
  const rootComments: Comment[] = [];

  comments.forEach((comment) => {
    commentMap.set(comment.id, comment);
  });

  comments.forEach((comment) => {
    if (comment.parent_comment_id) {
      const parent = commentMap.get(comment.parent_comment_id);
      if (parent) {
        parent.replies = parent.replies || [];
        parent.replies.push(comment);
      }
    } else {
      rootComments.push(comment);
    }
  });

  return rootComments;
}

export async function createComment(payload: CreateCommentRequest, author: CommunityAuthor): Promise<Comment> {
  const normalizedRole = getNormalizedRole(author);

  const { data, error } = await supabase
    .from("community_comments")
    .insert([
      {
        answer_id: payload.answer_id,
        parent_comment_id: payload.parent_comment_id ?? null,
        content: payload.content,
        author_id: author.id,
        author_name: author.name ?? "Anonymous",
        author_role: normalizedRole,
        author_university: author.establishment_name ?? author.university_id,
        author_major: author.track,
        author_academic_level: author.level,
        author_avatar: author.avatar_url,
      },
    ])
    .select()
    .single();

  if (error) {
    console.error("Error creating comment:", error);
    throw new Error(error.message || "Failed to create comment");
  }

  return mapComment(data);
}

export async function updateComment(commentId: string, payload: UpdateCommentRequest): Promise<Comment> {
  const { data, error } = await supabase
    .from("community_comments")
    .update({ content: payload.content })
    .eq("id", commentId)
    .select()
    .single();

  if (error) {
    console.error("Error updating comment:", error);
    throw new Error(error.message || "Failed to update comment");
  }

  return mapComment(data);
}

export async function deleteComment(commentId: string, deletedBy: string, deletionReason: string): Promise<void> {
  const now = new Date().toISOString();

  // Soft-delete the comment (replies will be handled by parent-child relationship)
  const { error } = await supabase
    .from("community_comments")
    .update({
      is_deleted: true,
      deleted_at: now,
      deleted_by: deletedBy,
      deletion_reason: deletionReason
    })
    .eq("id", commentId);

  if (error) {
    console.error("Error deleting comment:", error);
    throw error;
  }
}

export async function getCommentsByAuthor(authorId: string): Promise<Comment[]> {
  const { data, error } = await supabase
    .from("community_comments")
    .select(`
      *,
      community_answers!inner(post_id)
    `)
    .eq("author_id", authorId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching author comments:", error);
    throw error;
  }

  return (data ?? []).map((row: any) => {
    const comment = mapComment(row);
    // Add post_id from the joined answer
    (comment as any).post_id = row.community_answers?.post_id;
    return comment;
  });
}

// ============================================================================
// EDIT / UPDATE SYSTEM
// ============================================================================

export async function updateCommunityPost(postId: string, payload: UpdatePostRequest): Promise<Post> {
  const { data, error } = await supabase
    .from("community_posts")
    .update({
      title: payload.title,
      content: payload.content,
      tags: payload.tags,
      major_tags: payload.major_tags ?? [],
      university_tags: payload.university_tags ?? [],
    })
    .eq("id", postId)
    .select()
    .single();

  if (error) {
    console.error("Error updating post:", error);
    throw new Error(error.message || "Failed to update post");
  }

  return mapPost(data);
}

export async function updateCommunityAnswer(answerId: string, payload: UpdateAnswerRequest): Promise<Answer> {
  const { data, error } = await supabase
    .from("community_answers")
    .update({ content: payload.content })
    .eq("id", answerId)
    .select()
    .single();

  if (error) {
    console.error("Error updating answer:", error);
    throw new Error(error.message || "Failed to update answer");
  }

  return mapAnswer(data);
}

export async function deleteCommunityAnswer(answerId: string, deletedBy: string, deletionReason: string): Promise<void> {
  const now = new Date().toISOString();

  // First, soft-delete all comments on this answer with "Answer deleted" reason
  await supabase
    .from("community_comments")
    .update({
      is_deleted: true,
      deleted_at: now,
      deleted_by: deletedBy,
      deletion_reason: "Answer deleted"
    })
    .eq("answer_id", answerId);

  // Soft-delete the answer with the admin's specified reason
  const { error } = await supabase
    .from("community_answers")
    .update({
      is_deleted: true,
      deleted_at: now,
      deleted_by: deletedBy,
      deletion_reason: deletionReason
    })
    .eq("id", answerId);

  if (error) {
    console.error("Error deleting answer:", error);
    throw error;
  }
}

// ============================================================================
// ACCEPT ANSWER SYSTEM
// ============================================================================

export async function acceptAnswer(postId: string, answerId: string): Promise<void> {
  // First, unaccept any previously accepted answers for this post
  await supabase
    .from("community_answers")
    .update({ is_accepted: false })
    .eq("post_id", postId)
    .eq("is_accepted", true);

  // Accept the selected answer
  const { error: acceptError } = await supabase
    .from("community_answers")
    .update({ is_accepted: true })
    .eq("id", answerId);

  if (acceptError) {
    console.error("Error accepting answer:", acceptError);
    throw acceptError;
  }

  // Mark the post as solved
  const { error: solveError } = await supabase
    .from("community_posts")
    .update({ is_solved: true })
    .eq("id", postId);

  if (solveError) {
    console.error("Error marking post as solved:", solveError);
    throw solveError;
  }
}

export async function unacceptAnswer(postId: string, answerId: string): Promise<void> {
  // Unaccept the answer
  const { error: unacceptError } = await supabase
    .from("community_answers")
    .update({ is_accepted: false })
    .eq("id", answerId);

  if (unacceptError) {
    console.error("Error unaccepting answer:", unacceptError);
    throw unacceptError;
  }

  // Check if there are any other accepted answers
  const { data: acceptedAnswers } = await supabase
    .from("community_answers")
    .select("id")
    .eq("post_id", postId)
    .eq("is_accepted", true);

  // If no accepted answers remain, mark post as unsolved
  if (!acceptedAnswers || acceptedAnswers.length === 0) {
    const { error: unsolveError } = await supabase
      .from("community_posts")
      .update({ is_solved: false })
      .eq("id", postId);

    if (unsolveError) {
      console.error("Error marking post as unsolved:", unsolveError);
      throw unsolveError;
    }
  }
}

// ============================================================================
// HELPER FUNCTION FOR USER LIKES DASHBOARD
// ============================================================================

export async function getUserLikedPosts(userId: string): Promise<Post[]> {
  const { data, error } = await supabase
    .from("community_post_likes")
    .select(`
      post_id,
      community_posts (*)
    `)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching user liked posts:", error);
    throw error;
  }

  return (data ?? [])
    .map((item: any) => item.community_posts)
    .filter(Boolean)
    .map(mapPost);
}

export async function getUserLikedAnswers(userId: string): Promise<Answer[]> {
  const { data, error } = await supabase
    .from("community_answer_likes")
    .select(`
      answer_id,
      community_answers (*)
    `)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching user liked answers:", error);
    throw error;
  }

  return (data ?? [])
    .map((item: any) => item.community_answers)
    .filter(Boolean)
    .map(mapAnswer);
}

export async function getUserLikedComments(userId: string): Promise<Comment[]> {
  const { data, error } = await supabase
    .from("community_comment_likes")
    .select(`
      comment_id,
      community_comments (
        *,
        community_answers!inner (
          post_id
        )
      )
    `)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching user liked comments:", error);
    throw error;
  }

  return (data ?? [])
    .map((item: any) => {
      if (!item.community_comments) return null;
      const comment = mapComment(item.community_comments);
      // Add post_id from the nested answer data
      if (item.community_comments.community_answers) {
        (comment as any).post_id = item.community_comments.community_answers.post_id;
      }
      return comment;
    })
    .filter(Boolean) as Comment[];
}

// Admin functions to get all answers and comments
export async function getAnswers(): Promise<Answer[]> {
  const { data, error } = await supabase
    .from("community_answers")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching answers:", error);
    throw error;
  }

  return (data ?? []).map(mapAnswer);
}

export async function getComments(): Promise<Comment[]> {
  const { data, error } = await supabase
    .from("community_comments")
    .select(`
      *,
      community_answers!inner(post_id)
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching comments:", error);
    throw error;
  }

  return (data ?? []).map((row: any) => ({
    ...mapComment(row),
    post_id: row.community_answers?.post_id
  }));
}

// ============================================================================
// REPORTING SYSTEM
// ============================================================================

const mapReport = (row: any): Report => ({
  id: row.id,
  reporter_id: row.reporter_id,
  reporter_name: row.reporter_name,
  reported_content_type: row.reported_content_type,
  reported_content_id: row.reported_content_id,
  reason: row.reason,
  description: row.description ?? undefined,
  status: row.status,
  reviewed_by: row.reviewed_by ?? undefined,
  reviewed_at: row.reviewed_at ?? undefined,
  resolution_notes: row.resolution_notes ?? undefined,
  created_at: row.created_at,
  updated_at: row.updated_at,
});

export async function createReport(
  payload: CreateReportRequest,
  reporterId: string,
  reporterName?: string
): Promise<Report> {
  const { data, error } = await supabase
    .from("community_reports")
    .insert([
      {
        reporter_id: reporterId,
        reporter_name: reporterName ?? "Anonymous",
        reported_content_type: payload.reported_content_type,
        reported_content_id: payload.reported_content_id,
        reason: payload.reason,
        description: payload.description ?? null,
      },
    ])
    .select()
    .single();

  if (error) {
    console.error("Error creating report:", error);
    if (error.code === "23505") {
      throw new Error("You have already reported this content");
    }
    throw new Error(error.message || "Failed to create report");
  }

  return mapReport(data);
}

export async function getReports(filters?: {
  status?: ReportStatus;
  contentType?: ReportContentType;
}): Promise<Report[]> {
  let query = supabase
    .from("community_reports")
    .select("*")
    .order("created_at", { ascending: false });

  if (filters?.status) {
    query = query.eq("status", filters.status);
  }

  if (filters?.contentType) {
    query = query.eq("reported_content_type", filters.contentType);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching reports:", error);
    throw error;
  }

  return (data ?? []).map(mapReport);
}

export async function getReportById(reportId: string): Promise<Report | null> {
  const { data, error } = await supabase
    .from("community_reports")
    .select("*")
    .eq("id", reportId)
    .single();

  if (error) {
    console.error("Error fetching report:", error);
    throw error;
  }

  return data ? mapReport(data) : null;
}

export async function updateReportStatus(
  reportId: string,
  status: ReportStatus,
  reviewerId: string,
  notes?: string
): Promise<Report> {
  const { data, error } = await supabase
    .from("community_reports")
    .update({
      status,
      reviewed_by: reviewerId,
      reviewed_at: new Date().toISOString(),
      resolution_notes: notes ?? null,
    })
    .eq("id", reportId)
    .select()
    .single();

  if (error) {
    console.error("Error updating report:", error);
    throw new Error(error.message || "Failed to update report");
  }

  return mapReport(data);
}

export async function checkExistingReport(
  userId: string,
  contentType: ReportContentType,
  contentId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from("community_reports")
    .select("id")
    .eq("reporter_id", userId)
    .eq("reported_content_type", contentType)
    .eq("reported_content_id", contentId)
    .eq("status", "pending")
    .maybeSingle();

  if (error) {
    console.error("Error checking existing report:", error);
    return false;
  }

  return !!data;
}

export async function getReportWithContent(reportId: string): Promise<ReportWithContent | null> {
  const report = await getReportById(reportId);
  if (!report) return null;

  let contentPreview = "";
  let contentTitle = "";
  let contentAuthorId = "";
  let contentAuthorName = "";

  try {
    if (report.reported_content_type === "post") {
      const post = await getCommunityPostById(report.reported_content_id);
      if (post) {
        contentPreview = post.content.substring(0, 200);
        contentTitle = post.title;
        contentAuthorId = post.author_id;
        contentAuthorName = post.author_name;
      }
    } else if (report.reported_content_type === "answer") {
      const { data } = await supabase
        .from("community_answers")
        .select("*")
        .eq("id", report.reported_content_id)
        .single();

      if (data) {
        contentPreview = data.content.substring(0, 200);
        contentAuthorId = data.author_id;
        contentAuthorName = data.author_name;
      }
    } else if (report.reported_content_type === "comment") {
      const { data } = await supabase
        .from("community_comments")
        .select("*")
        .eq("id", report.reported_content_id)
        .single();

      if (data) {
        contentPreview = data.content.substring(0, 200);
        contentAuthorId = data.author_id;
        contentAuthorName = data.author_name;
      }
    }
  } catch (error) {
    console.error("Error fetching reported content:", error);
  }

  return {
    ...report,
    content_preview: contentPreview,
    content_title: contentTitle,
    content_author_id: contentAuthorId,
    content_author_name: contentAuthorName,
  };
}

export async function deleteReport(reportId: string): Promise<void> {
  const { error } = await supabase
    .from("community_reports")
    .delete()
    .eq("id", reportId);

  if (error) {
    console.error("Error deleting report:", error);
    throw error;
  }
}
