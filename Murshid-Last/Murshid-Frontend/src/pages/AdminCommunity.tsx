import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { formatTimeAgo } from '@/lib/timeUtils';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { MessageSquare, Loader2, Trash2, ArrowLeft, Eye, Heart, CheckCircle2, Flag, Ban, XCircle } from "lucide-react";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import { useI18n } from "@/contexts/I18nContext";
import { PageAnimation } from "@/components/animations/PageAnimation";
import { ScrollAnimation } from "@/components/animations/ScrollAnimation";
import { DeletionReasonDialog } from "@/components/DeletionReasonDialog";
import { getCommunityPosts, deleteCommunityPost, deleteCommunityAnswer, deleteComment, getAnswers, getComments, getReports, updateReportStatus, getCommunityPostById } from "@/lib/communityApi";
import type { Post, Answer, Comment, ReportWithContent, ReportStatus } from "@/types/community";
import { supabase } from "@/lib/supabase";

const AdminCommunity = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { language } = useI18n();

  const [posts, setPosts] = useState<Post[]>([]);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [reports, setReports] = useState<ReportWithContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"posts" | "answers" | "comments" | "reports">("posts");

  // Restore active tab from location state if available
  useEffect(() => {
    const locationState = location.state as { activeTab?: "posts" | "answers" | "comments" | "reports" } | null;
    if (locationState?.activeTab) {
      setActiveTab(locationState.activeTab);
    }
  }, [location.state]);
  const [reportFilter, setReportFilter] = useState<ReportStatus | "all">("pending");
  const [timeRefresh, setTimeRefresh] = useState(0);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: string; type: "post" | "answer" | "comment"; title?: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [reportToAction, setReportToAction] = useState<ReportWithContent | null>(null);
  const [actionType, setActionType] = useState<"dismiss" | "delete" | null>(null);
  const [actionNotes, setActionNotes] = useState("");
  const [actioning, setActioning] = useState(false);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      navigate("/login");
      return;
    }

    if (user.is_admin !== true) {
      toast.error(language === "ar" ? "الوصول مرفوض" : "Access denied");
      navigate("/");
      return;
    }

    fetchData();
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeRefresh(prev => prev + 1);
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const postsData = await getCommunityPosts();
      setPosts(postsData);

      // Fetch all answers and comments using the admin functions
      const allAnswers = await getAnswers();
      const allComments = await getComments();

      setAnswers(allAnswers);
      setComments(allComments);

      // Fetch reports with content
      await fetchReports();
    } catch (error) {
      console.error("Error fetching community data:", error);
      toast.error(language === "ar" ? "فشل تحميل البيانات" : "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const fetchReports = async () => {
    try {
      const reportsData = await getReports();

      // Fetch content for each report
      const reportsWithContent = await Promise.all(
        reportsData.map(async (report) => {
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
          } catch (err) {
            console.error("Error fetching content for report:", err);
          }

          return {
            ...report,
            content_preview: contentPreview,
            content_title: contentTitle,
            content_author_id: contentAuthorId,
            content_author_name: contentAuthorName,
          };
        })
      );

      setReports(reportsWithContent);
    } catch (error) {
      console.error("Error fetching reports:", error);
    }
  };

  const handleDeleteClick = (id: string, type: "post" | "answer" | "comment", title?: string) => {
    setItemToDelete({ id, type, title });
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async (reason: string) => {
    if (!itemToDelete || !user) return;

    try {
      setDeleting(true);

      if (itemToDelete.type === "post") {
        await deleteCommunityPost(itemToDelete.id, user.id, reason);
        toast.success(language === "ar" ? "تم حذف المنشور" : "Post deleted");
      } else if (itemToDelete.type === "answer") {
        await deleteCommunityAnswer(itemToDelete.id, user.id, reason);
        toast.success(language === "ar" ? "تم حذف الإجابة" : "Answer deleted");
      } else if (itemToDelete.type === "comment") {
        await deleteComment(itemToDelete.id, user.id, reason);
        toast.success(language === "ar" ? "تم حذف التعليق" : "Comment deleted");
      }

      // Refetch data to get updated state
      await fetchData();
      
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    } catch (error) {
      console.error("Error deleting item:", error);
      toast.error(language === "ar" ? "فشل الحذف" : "Failed to delete");
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setItemToDelete(null);
  };

  const handleReportAction = async (report: ReportWithContent, action: "dismiss" | "delete") => {
    setReportToAction(report);
    setActionType(action);
    setActionDialogOpen(true);
  };

  const handleReportActionConfirm = async () => {
    if (!reportToAction || !user || !actionType) return;

    try {
      setActioning(true);

      if (actionType === "dismiss") {
        // Simply mark as reviewed/dismissed
        await updateReportStatus(reportToAction.id, "dismissed", user.id, actionNotes || undefined);
        toast.success(language === "ar" ? "تم رفض البلاغ" : "Report dismissed");
      } else if (actionType === "delete") {
        // Delete the reported content and mark report as actioned
        const reason = actionNotes || "Content removed by admin due to report";
        
        if (reportToAction.reported_content_type === "post") {
          await deleteCommunityPost(reportToAction.reported_content_id, user.id, reason);
        } else if (reportToAction.reported_content_type === "answer") {
          await deleteCommunityAnswer(reportToAction.reported_content_id, user.id, reason);
        } else if (reportToAction.reported_content_type === "comment") {
          await deleteComment(reportToAction.reported_content_id, user.id, reason);
        }
        await updateReportStatus(reportToAction.id, "actioned", user.id, actionNotes || "Content deleted");
        toast.success(language === "ar" ? "تم حذف المحتوى وإغلاق البلاغ" : "Content deleted and report closed");
      }

      // Refresh data to get updated state
      await fetchData();
      // Refresh reports
      await fetchReports();
      setActionDialogOpen(false);
      setReportToAction(null);
      setActionType(null);
      setActionNotes("");
    } catch (error) {
      console.error("Error handling report action:", error);
      toast.error(language === "ar" ? "فشل تنفيذ الإجراء" : "Failed to execute action");
    } finally {
      setActioning(false);
    }
  };

  const handleReportActionCancel = () => {
    setActionDialogOpen(false);
    setReportToAction(null);
    setActionType(null);
    setActionNotes("");
  };

  const getReasonLabel = (reason: string) => {
    const labels: Record<string, { en: string; ar: string }> = {
      spam: { en: "Spam or advertising", ar: "رسائل غير مرغوب فيها أو إعلانات" },
      harassment: { en: "Harassment or hate speech", ar: "تحرش أو خطاب كراهية" },
      inappropriate: { en: "Inappropriate content", ar: "محتوى غير لائق" },
      misinformation: { en: "Misinformation", ar: "معلومات مضللة" },
    };
    return language === "ar" ? labels[reason]?.ar || reason : labels[reason]?.en || reason;
  };

  const filteredReports = reportFilter === "all" ? reports : reports.filter(r => r.status === reportFilter);
  const pendingReportsCount = reports.filter(r => r.status === "pending").length;

  if (!user || user.is_admin !== true) {
    return null;
  }

  return (
    <PageAnimation>
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5" dir={language}>
        <Navbar />

        <ScrollAnimation>
          <div className="container mx-auto px-4 py-8">
            {/* Header */}
            <div className="mb-8">
              <Button
                onClick={() => navigate("/admin")}
                variant="ghost"
                className="mb-4"
              >
                <ArrowLeft className={`w-4 h-4 ${language === "ar" ? "ml-2 rotate-180" : "mr-2"}`} />
                {language === "ar" ? "العودة إلى لوحة التحكم" : "Back to Dashboard"}
              </Button>

              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-4xl font-bold flex items-center gap-3">
                    <MessageSquare className="w-10 h-10 text-orange-600" />
                    {language === "ar" ? "إدارة المجتمع" : "Community Management"}
                  </h1>
                  <p className="text-muted-foreground mt-2">
                    {language === "ar"
                      ? "عرض وحذف المنشورات والإجابات والتعليقات"
                      : "View and delete posts, answers, and comments"}
                  </p>
                </div>
              </div>
            </div>

            {/* Stats - 2x2 grid on mobile, 4 columns on larger screens */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {language === "ar" ? "إجمالي المنشورات" : "Total Posts"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{posts.filter((p) => !p.is_deleted).length}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {language === "ar" ? "إجمالي الإجابات" : "Total Answers"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{answers.filter((a) => !a.is_deleted).length}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {language === "ar" ? "إجمالي التعليقات" : "Total Comments"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{comments.filter((c) => !c.is_deleted).length}</div>
                </CardContent>
              </Card>

              <Card className={pendingReportsCount > 0 ? "border-orange-200 dark:border-orange-800" : ""}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Flag className="w-4 h-4" />
                    {language === "ar" ? "البلاغات المعلقة" : "Pending Reports"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-3xl font-bold ${pendingReportsCount > 0 ? "text-orange-600" : ""}`}>
                    {pendingReportsCount}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Content Tabs */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "posts" | "answers" | "comments" | "reports")}>
                <TabsList className="mb-6 grid grid-cols-2 xl:inline-flex w-full xl:w-auto h-auto">
                  <TabsTrigger value="posts" className="whitespace-nowrap">
                    {language === "ar" ? `المنشورات (${posts.filter(p => !p.is_deleted).length})` : `Posts (${posts.filter(p => !p.is_deleted).length})`}
                  </TabsTrigger>
                  <TabsTrigger value="answers" className="whitespace-nowrap">
                    {language === "ar" ? `الإجابات (${answers.filter(a => !a.is_deleted).length})` : `Answers (${answers.filter(a => !a.is_deleted).length})`}
                  </TabsTrigger>
                  <TabsTrigger value="comments" className="whitespace-nowrap">
                    {language === "ar" ? `التعليقات (${comments.filter(c => !c.is_deleted).length})` : `Comments (${comments.filter(c => !c.is_deleted).length})`}
                  </TabsTrigger>
                  <TabsTrigger value="reports" className="relative whitespace-nowrap">
                    <Flag className="w-4 h-4 mr-2" />
                    {language === "ar" ? `البلاغات (${reports.length})` : `Reports (${reports.length})`}
                    {pendingReportsCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-orange-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                        {pendingReportsCount}
                      </span>
                    )}
                  </TabsTrigger>
                </TabsList>

                {/* Posts Tab */}
                <TabsContent value="posts">
                  {posts.filter(p => !p.is_deleted).length === 0 ? (
                    <Card className="p-12 text-center">
                      <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                        {language === "ar" ? "لا توجد منشورات" : "No Posts"}
                      </h3>
                    </Card>
                  ) : (
                    <div className="space-y-4">
                      {posts.filter(post => !post.is_deleted).map((post) => (
                        <Card 
                          key={post.id} 
                          className="p-6 cursor-pointer hover:shadow-lg transition-shadow"
                          onClick={() => navigate(`/community/post/${post.id}`, {
                            state: { from: 'admin-community', tab: activeTab }
                          })}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h3
                                  className="text-xl font-semibold text-gray-900 dark:text-gray-100"
                                  dir={language}
                                >
                                  {post.title}
                                </h3>
                                {post.is_solved && (
                                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                                )}
                              </div>

                              <p className="text-gray-600 dark:text-gray-400 mb-3 line-clamp-2" dir={language}>
                                {post.content}
                              </p>

                              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                                <Badge variant="outline">{post.author_name}</Badge>
                                <Badge variant="secondary">
                                  {post.author_role === "specialist"
                                    ? language === "ar" ? "متخصص" : "Specialist"
                                    : post.author_role === "student"
                                    ? language === "ar" ? "طالب" : "Student"
                                    : language === "ar" ? "مشرف" : "Admin"}
                                </Badge>
                                <div className="flex items-center gap-1">
                                  <Heart className="w-4 h-4" />
                                  <span>{post.likes_count || 0}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <MessageSquare className="w-4 h-4" />
                                  <span>{post.answers_count || 0}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Eye className="w-4 h-4" />
                                  <span>{post.views_count || 0}</span>
                                </div>
                                <span>{formatTimeAgo(post.created_at, language)}</span>
                              </div>
                            </div>

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteClick(post.id, "post", post.title);
                              }}
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>

                {/* Answers Tab */}
                <TabsContent value="answers">
                  {answers.filter(a => !a.is_deleted).length === 0 ? (
                    <Card className="p-12 text-center">
                      <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                        {language === "ar" ? "لا توجد إجابات" : "No Answers"}
                      </h3>
                    </Card>
                  ) : (
                    <div className="space-y-4">
                      {answers.filter(answer => !answer.is_deleted).map((answer) => (
                        <Card 
                          key={answer.id} 
                          className="p-6 cursor-pointer hover:shadow-lg transition-shadow"
                          onClick={() => navigate(`/community/post/${answer.post_id}`, {
                            state: { from: 'admin-community', tab: activeTab }
                          })}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-3">
                                <Badge variant="outline">{answer.author_name}</Badge>
                                <Badge variant="secondary">
                                  {answer.author_role === "specialist"
                                    ? language === "ar" ? "متخصص" : "Specialist"
                                    : answer.author_role === "student"
                                    ? language === "ar" ? "طالب" : "Student"
                                    : language === "ar" ? "مشرف" : "Admin"}
                                </Badge>
                                {answer.is_accepted && (
                                  <Badge className="bg-green-600">
                                    <CheckCircle2 className="w-3 h-3 mr-1" />
                                    {language === "ar" ? "مقبولة" : "Accepted"}
                                  </Badge>
                                )}
                              </div>

                              <p
                                className="text-gray-700 dark:text-gray-300 mb-3 line-clamp-3"
                                dir={language}
                              >
                                {answer.content}
                              </p>

                              <div className="flex items-center gap-4 text-sm text-gray-500">
                                <div className="flex items-center gap-1">
                                  <Heart className="w-4 h-4" />
                                  <span>{answer.likes_count || 0}</span>
                                </div>
                                <span>{formatTimeAgo(answer.created_at, language)}</span>
                              </div>
                            </div>

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteClick(answer.id, "answer");
                              }}
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>

                {/* Comments Tab */}
                <TabsContent value="comments">
                  {comments.filter(c => !c.is_deleted).length === 0 ? (
                    <Card className="p-12 text-center">
                      <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                        {language === "ar" ? "لا توجد تعليقات" : "No Comments"}
                      </h3>
                    </Card>
                  ) : (
                    <div className="space-y-4">
                      {comments.filter(comment => !comment.is_deleted).map((comment) => (
                        <Card 
                          key={comment.id} 
                          className="p-6 cursor-pointer hover:shadow-lg transition-shadow"
                          onClick={() => {
                            const postId = (comment as any).post_id;
                            if (postId) {
                              navigate(`/community/post/${postId}`, {
                                state: { from: 'admin-community', tab: activeTab }
                              });
                            }
                          }}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-3">
                                <Badge variant="outline">{comment.author_name}</Badge>
                                <Badge variant="secondary">
                                  {comment.author_role === "specialist"
                                    ? language === "ar" ? "متخصص" : "Specialist"
                                    : comment.author_role === "student"
                                    ? language === "ar" ? "طالب" : "Student"
                                    : language === "ar" ? "مشرف" : "Admin"}
                                </Badge>
                                {comment.parent_comment_id && (
                                  <Badge variant="outline" className="text-xs">
                                    {language === "ar" ? "رد" : "Reply"}
                                  </Badge>
                                )}
                              </div>

                              <p className="text-gray-700 dark:text-gray-300 mb-3" dir={language}>
                                {comment.content}
                              </p>

                              <div className="flex items-center gap-4 text-sm text-gray-500">
                                <div className="flex items-center gap-1">
                                  <Heart className="w-4 h-4" />
                                  <span>{comment.likes_count || 0}</span>
                                </div>
                                <span>{formatTimeAgo(comment.created_at, language)}</span>
                              </div>
                            </div>

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteClick(comment.id, "comment");
                              }}
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>

                {/* Reports Tab */}
                <TabsContent value="reports">
                  <div className="mb-4">
                    <Select value={reportFilter} onValueChange={(value) => setReportFilter(value as ReportStatus | "all")}>
                      <SelectTrigger className="w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{language === "ar" ? "جميع البلاغات" : "All Reports"}</SelectItem>
                        <SelectItem value="pending">{language === "ar" ? "قيد الانتظار" : "Pending"}</SelectItem>
                        <SelectItem value="reviewed">{language === "ar" ? "تمت المراجعة" : "Reviewed"}</SelectItem>
                        <SelectItem value="dismissed">{language === "ar" ? "مرفوضة" : "Dismissed"}</SelectItem>
                        <SelectItem value="actioned">{language === "ar" ? "تم اتخاذ إجراء" : "Actioned"}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {filteredReports.length === 0 ? (
                    <Card className="p-12 text-center">
                      <Flag className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                        {language === "ar" ? "لا توجد بلاغات" : "No Reports"}
                      </h3>
                    </Card>
                  ) : (
                    <div className="space-y-4">
                      {filteredReports.map((report) => (
                        <Card key={report.id} className={`p-6 ${report.status === "pending" ? "border-orange-200 dark:border-orange-800" : ""}`}>
                          <div className="space-y-4">
                            {/* Report Header */}
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge variant="outline" className="bg-orange-50 dark:bg-orange-950 text-orange-700 dark:text-orange-400">
                                    <Flag className="w-3 h-3 mr-1" />
                                    {getReasonLabel(report.reason)}
                                  </Badge>
                                  <Badge variant={
                                    report.status === "pending" ? "default" :
                                    report.status === "dismissed" ? "secondary" :
                                    report.status === "actioned" ? "destructive" : "outline"
                                  }>
                                    {report.status === "pending" ? (language === "ar" ? "قيد الانتظار" : "Pending") :
                                     report.status === "dismissed" ? (language === "ar" ? "مرفوضة" : "Dismissed") :
                                     report.status === "actioned" ? (language === "ar" ? "تم اتخاذ إجراء" : "Actioned") :
                                     (language === "ar" ? "تمت المراجعة" : "Reviewed")}
                                  </Badge>
                                  <Badge variant="secondary">
                                    {report.reported_content_type === "post" ? (language === "ar" ? "منشور" : "Post") :
                                     report.reported_content_type === "answer" ? (language === "ar" ? "إجابة" : "Answer") :
                                     (language === "ar" ? "تعليق" : "Comment")}
                                  </Badge>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                  {language === "ar" ? "بلاغ من: " : "Reported by: "}
                                  <span className="font-medium">{report.reporter_name || "Anonymous"}</span>
                                  {" • "}
                                  {formatTimeAgo(report.created_at, language)}
                                </p>
                                {report.description && (
                                  <p className="text-gray-700 dark:text-gray-300 text-sm mb-3 italic" dir={language}>
                                    "{report.description}"
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Reported Content */}
                            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                              {report.content_title && (
                                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2" dir={language}>
                                  {report.content_title}
                                </h4>
                              )}
                              <p className="text-gray-700 dark:text-gray-300 text-sm line-clamp-3" dir={language}>
                                {report.content_preview || (language === "ar" ? "المحتوى غير متوفر" : "Content not available")}
                              </p>
                              {report.content_author_name && (
                                <p className="text-sm text-gray-500 mt-2">
                                  {language === "ar" ? "المؤلف: " : "Author: "}
                                  <span className="font-medium">{report.content_author_name}</span>
                                </p>
                              )}
                            </div>

                            {/* Actions */}
                            {report.status === "pending" && (
                              <div className="flex items-center gap-2 pt-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => navigate(`/community/post/${report.reported_content_type === "post" ? report.reported_content_id : ""}`, {
                                    state: { from: 'admin-community', tab: activeTab }
                                  })}
                                  className="gap-1"
                                >
                                  <Eye className="w-4 h-4" />
                                  {language === "ar" ? "عرض المحتوى" : "View Content"}
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleReportAction(report, "dismiss")}
                                  className="gap-1"
                                >
                                  <XCircle className="w-4 h-4" />
                                  {language === "ar" ? "رفض" : "Dismiss"}
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleReportAction(report, "delete")}
                                  className="gap-1 text-red-600 dark:text-red-400"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  {language === "ar" ? "حذف المحتوى" : "Delete Content"}
                                </Button>
                              </div>
                            )}

                            {/* Resolution Notes */}
                            {report.resolution_notes && (
                              <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-3 text-sm">
                                <p className="text-blue-900 dark:text-blue-300">
                                  <span className="font-semibold">{language === "ar" ? "ملاحظات: " : "Notes: "}</span>
                                  {report.resolution_notes}
                                </p>
                              </div>
                            )}
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            )}
          </div>
        </ScrollAnimation>

        {/* Delete Confirmation Dialog */}
        <DeletionReasonDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          onConfirm={handleDeleteConfirm}
          itemType={itemToDelete?.type || "post"}
          itemTitle={itemToDelete?.title}
          deleting={deleting}
        />

        {/* Report Action Dialog */}
        <AlertDialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {actionType === "dismiss" && (language === "ar" ? "رفض البلاغ" : "Dismiss Report")}
                {actionType === "delete" && (language === "ar" ? "حذف المحتوى" : "Delete Content")}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {actionType === "dismiss" && (
                  language === "ar"
                    ? "هل أنت متأكد من رفض هذا البلاغ؟ سيتم وضع علامة عليه كمراجع."
                    : "Are you sure you want to dismiss this report? It will be marked as reviewed."
                )}
                {actionType === "delete" && (
                  language === "ar"
                    ? "هل أنت متأكد من حذف المحتوى المبلغ عنه؟ لا يمكن التراجع عن هذا الإجراء."
                    : "Are you sure you want to delete the reported content? This action cannot be undone."
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-4">
              <label className="block text-sm font-medium mb-2">
                {language === "ar" ? "ملاحظات (اختياري)" : "Notes (optional)"}
              </label>
              <Textarea
                value={actionNotes}
                onChange={(e) => setActionNotes(e.target.value)}
                placeholder={
                  language === "ar"
                    ? "أضف ملاحظات حول هذا الإجراء..."
                    : "Add notes about this action..."
                }
                rows={3}
                dir={language}
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={handleReportActionCancel} disabled={actioning}>
                {language === "ar" ? "إلغاء" : "Cancel"}
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleReportActionConfirm}
                disabled={actioning}
                className={
                  actionType === "delete"
                    ? "bg-destructive hover:bg-destructive/90"
                    : ""
                }
              >
                {actioning ? (
                  <>
                    <Loader2 className={`w-4 h-4 ${language === "ar" ? "ml-2" : "mr-2"} animate-spin`} />
                    {language === "ar" ? "جاري التنفيذ..." : "Processing..."}
                  </>
                ) : (
                  <>
                    {actionType === "dismiss" && (language === "ar" ? "رفض" : "Dismiss")}
                    {actionType === "delete" && (language === "ar" ? "حذف" : "Delete")}
                  </>
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </PageAnimation>
  );
};

export default AdminCommunity;
