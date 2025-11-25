import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Shield, Search, Users, Loader2, Trash2, RefreshCw, Building2, BookOpen, Link as LinkIcon, Ban, Undo2, MessageSquare, CheckCircle, XCircle, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import { Link } from "react-router-dom";
import { useI18n } from "@/contexts/I18nContext";
import { PageAnimation } from "@/components/animations/PageAnimation";
import { ScrollAnimation } from "@/components/animations/ScrollAnimation";
import { UserStatsChart } from "@/components/admin/UserStatsChart";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { MajorsCategoryChart } from "@/components/admin/MajorsCategoryChart";
import { CommunityStatsChart } from "@/components/admin/CommunityStatsChart";
import { getMajors } from "@/lib/majorsApi";
import { getAllCommunityPostsForAdmin, getAnswers, getComments, getReports } from "@/lib/communityApi";
import type { MajorCategory } from "@/types/database";

interface UserData {
  id: string;
  email: string;
  name: string | null;
  establishment_name: string | null;
  university_id?: string | null;
  level: string | null;
  gender: string | null;
  role: string | null;
  student_type: string | null;
  track: string | null;
  is_admin: boolean | null;
  is_suspended?: boolean | null;
  suspended_reason?: string | null;
  suspended_until?: string | null;
  specialist_proof_url?: string | null;
  created_at: string;
}

const AdminDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { t, language } = useI18n();
  const [users, setUsers] = useState<UserData[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [majors, setMajors] = useState<any[]>([]);
  const [communityPosts, setCommunityPosts] = useState<any[]>([]);
  const [communityAnswers, setCommunityAnswers] = useState<any[]>([]);
  const [communityComments, setCommunityComments] = useState<any[]>([]);
  const [pendingReports, setPendingReports] = useState<any[]>([]);
  const [chartsReady, setChartsReady] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserData | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false);
  const [userToSuspend, setUserToSuspend] = useState<UserData | null>(null);
  const [suspendReason, setSuspendReason] = useState("");
  const [suspendUntil, setSuspendUntil] = useState("");
  const [suspendDurationType, setSuspendDurationType] = useState<"date" | "period">("date");
  const [suspendPeriod, setSuspendPeriod] = useState<"week" | "month" | "permanent">("permanent");
  const [suspending, setSuspending] = useState(false);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [refuseDialogOpen, setRefuseDialogOpen] = useState(false);
  const [userToApprove, setUserToApprove] = useState<UserData | null>(null);
  const [refusalReason, setRefusalReason] = useState("");
  const [processing, setProcessing] = useState(false);

  // Open specialist proof with a signed URL (works even if bucket is private)
  const handleViewProof = async (userData: UserData) => {
    try {
      if (!userData.specialist_proof_url) return;
      const url = new URL(userData.specialist_proof_url);
      const marker = "/object/public/";
      let bucket = "";
      let relPath = "";
      const idx = url.pathname.indexOf(marker);
      if (idx !== -1) {
        const after = url.pathname.substring(idx + marker.length); // bucket/path
        const parts = after.split("/");
        bucket = parts.shift() || "";
        relPath = parts.join("/");
      } else {
        // Fallback: try to infer bucket and path
        const parts = url.pathname.split("/");
        const bIdx = parts.findIndex((p) => p === "specialist-proofs");
        if (bIdx >= 0) {
          bucket = parts[bIdx];
          relPath = parts.slice(bIdx + 1).join("/");
        }
      }

      if (!bucket || !relPath) {
        toast.error("Cannot parse proof path. Please re-upload the file.");
        return;
      }

      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(relPath, 60 * 60);

      if (error || !data?.signedUrl) {
        toast.error(
          "Proof not accessible. Ensure the 'specialist-proofs' bucket exists and policies are applied."
        );
        return;
      }

      window.open(data.signedUrl, "_blank", "noopener,noreferrer");
    } catch (e) {
      console.error("Error opening proof:", e);
      toast.error("Failed to open proof document.");
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      // Preferred approach: use RPC that joins auth.users to expose email to admins
      const { data: rpcData, error: rpcError } = await supabase.rpc("admin_user_list");

      if (!rpcError && rpcData) {
        // Ensure suspension fields exist by merging with profiles
        const base = [...(rpcData as any[])];
        const ids = base.map((u) => u.id).filter(Boolean);
        try {
          const { data: profilesData } = await supabase
            .from("profiles")
            .select("id, is_suspended, suspended_reason, suspended_until, specialist_proof_url, university_id")
            .in("id", ids);

          const byId: Record<string, any> = {};
          (profilesData || []).forEach((p: any) => {
            byId[p.id] = {
              is_suspended: p.is_suspended ?? false,
              suspended_reason: p.suspended_reason ?? null,
              suspended_until: p.suspended_until ?? null,
              specialist_proof_url: p.specialist_proof_url ?? null,
            };
          });

          const merged = base.map((u) => ({ ...u, ...(byId[u.id] || {}) }));
          const sorted = merged.sort((a, b) => (a.created_at > b.created_at ? -1 : 1));
          setUsers(sorted as any);
          setFilteredUsers(sorted as any);
        } catch (_) {
          // Fallback to base if merge fails
          const sorted = base.sort((a, b) => (a.created_at > b.created_at ? -1 : 1));
          setUsers(sorted as any);
          setFilteredUsers(sorted as any);
        }

        if (users.length > 0) {
          toast.success(t("admin.dashboard.toast.refreshSuccess", { count: (rpcData as any[])?.length || 0 }));
        }
        return;
      }

      // Fallback: profiles only (email may be empty)
      const { data, error } = await supabase
        .from("profiles")
        .select("id, name, establishment_name, university_id, level, gender, role, student_type, track, is_admin, created_at, suspended_reason, suspended_until, is_suspended, specialist_proof_url")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const withEmail = (data || []).map((u: any) => ({ email: "", ...u }));
      setUsers(withEmail);
      setFilteredUsers(withEmail);

      if (users.length > 0) {
        toast.success(t("admin.dashboard.toast.refreshSuccess", { count: data?.length || 0 }));
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error(t("admin.dashboard.toast.loadError"));
    } finally {
      setLoading(false);
    }
  };

  const fetchMajors = async () => {
    try {
      const majorsData = await getMajors();
      setMajors(majorsData);
    } catch (error) {
      console.error("Error fetching majors:", error);
    }
  };

  const fetchCommunityData = async () => {
    try {
      // Fetch all community data
      const [postsData, answersData, commentsData, reportsData] = await Promise.all([
        getAllCommunityPostsForAdmin(),
        getAnswers(),
        getComments(),
        getReports({ status: "pending" }),
      ]);

      setCommunityPosts(postsData);
      setCommunityAnswers(answersData);
      setCommunityComments(commentsData);
      setPendingReports(reportsData);
    } catch (error) {
      console.error("Error fetching community data:", error);
    }
  };

  const refreshAllData = async () => {
    setChartsReady(false);
    await Promise.all([
      fetchUsers(),
      fetchMajors(),
      fetchCommunityData(),
    ]);
    setTimeout(() => {
      setChartsReady(true);
    }, 100);
  };

  useEffect(() => {
    // Don't check admin access while still loading
    if (authLoading) {
      return;
    }
    
    // Check if user is admin
    if (!user) {
      navigate("/login");
      return;
    }
    
    if (user.is_admin === false) {
      toast.error(t("admin.dashboard.toast.accessDenied"));
      navigate("/");
      return;
    }

    if (user.is_admin === true) {
      refreshAllData();
    }
  }, [user, authLoading, navigate]);

  // Filter users based on search term
  useEffect(() => {
    if (!searchTerm) {
      setFilteredUsers(users);
      return;
    }

    const filtered = users.filter((u) =>
      u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.establishment_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredUsers(filtered);
  }, [searchTerm, users]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleDeleteClick = (userData: UserData) => {
    // Prevent admin from deleting themselves
    if (userData.id === user?.id) {
      toast.error(t("admin.dashboard.toast.deleteSelf"));
      return;
    }
    setUserToDelete(userData);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;

    try {
      setDeleting(true);

      // Try Method 1: Call the database function to delete user from auth.users
      try {
        const { error: rpcError } = await supabase.rpc('delete_user_by_id', {
          user_id: userToDelete.id
        });

        if (rpcError) {
          console.warn("RPC delete function error (function may not exist):", rpcError);
          throw rpcError;
        }

        // If RPC succeeded, update UI and return
        setUsers(users.filter((u) => u.id !== userToDelete.id));
        setFilteredUsers(filteredUsers.filter((u) => u.id !== userToDelete.id));
        toast.success(t("admin.dashboard.toast.deleteSuccess", { name: userToDelete.name || userToDelete.email }));
        setDeleteDialogOpen(false);
        setUserToDelete(null);
        return;
      } catch (rpcError) {
        // RPC failed, try fallback method
        console.log("Trying fallback deletion method...");
      }

      // Method 2 (Fallback): Delete from profiles table
      // This won't free up the email but at least removes the user from your app
      const { error: profileError } = await supabase
        .from("profiles")
        .delete()
        .eq("id", userToDelete.id);

      if (profileError) {
        console.error("Profile deletion error:", profileError);
        throw new Error("Failed to delete user. Please make sure the delete_user_by_id function is created in Supabase.");
      }

      // Update local state
      setUsers(users.filter((u) => u.id !== userToDelete.id));
      setFilteredUsers(filteredUsers.filter((u) => u.id !== userToDelete.id));

      toast.success(t("admin.dashboard.toast.deleteSuccess", { name: userToDelete.name || userToDelete.email }));
      setDeleteDialogOpen(false);
      setUserToDelete(null);
    } catch (error: any) {
      console.error("Error deleting user:", error);
      const errorMessage = error?.message || "Unknown error occurred";
      toast.error(`Failed to delete user: ${errorMessage}`);
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setUserToDelete(null);
  };

  const handleSuspendClick = (userData: UserData) => {
    // Prevent admin from suspending themselves or other admins
    if (userData.id === user?.id) {
      toast.error("You cannot suspend your own account");
      return;
    }
    if (userData.is_admin) {
      toast.error("You cannot suspend another admin");
      return;
    }
    setUserToSuspend(userData);
    setSuspendReason(userData.suspended_reason || "");
    setSuspendDurationType("date");
    setSuspendPeriod("permanent");
    // Format suspended_until for datetime-local input if it exists
    if (userData.suspended_until) {
      const date = new Date(userData.suspended_until);
      setSuspendUntil(date.toISOString().slice(0, 16));
    } else {
      setSuspendUntil("");
    }
    setSuspendDialogOpen(true);
  };

  const handleSuspendConfirm = async () => {
    if (!userToSuspend) return;

    // Require reason for suspension
    if (!suspendReason.trim()) {
      toast.error("Please provide a reason for suspension");
      return;
    }

    try {
      setSuspending(true);
      
      let calculatedSuspendUntil = null;
      
      if (suspendDurationType === "date" && suspendUntil) {
        calculatedSuspendUntil = new Date(suspendUntil).toISOString();
      } else if (suspendDurationType === "period" && suspendPeriod !== "permanent") {
        const now = new Date();
        if (suspendPeriod === "week") {
          now.setDate(now.getDate() + 7);
          calculatedSuspendUntil = now.toISOString();
        } else if (suspendPeriod === "month") {
          now.setMonth(now.getMonth() + 1);
          calculatedSuspendUntil = now.toISOString();
        }
      }
      // If period is "permanent", calculatedSuspendUntil remains null

      const payload: any = {
        is_suspended: true,
        suspended_reason: suspendReason,
        suspended_until: calculatedSuspendUntil,
      };

      const { error } = await supabase
        .from("profiles")
        .update(payload)
        .eq("id", userToSuspend.id);

      if (error) throw error;

      // Update local state
      const updated = users.map((u) =>
        u.id === userToSuspend.id ? { ...u, ...payload } : u
      );
      setUsers(updated);
      setFilteredUsers(updated);

      toast.success(`User ${userToSuspend.name || userToSuspend.email} has been suspended`);
      setSuspendDialogOpen(false);
      setUserToSuspend(null);
      setSuspendReason("");
      setSuspendUntil("");
      setSuspendDurationType("date");
      setSuspendPeriod("permanent");
    } catch (error) {
      console.error("Error suspending user:", error);
      toast.error("Failed to suspend user. Please try again.");
    } finally {
      setSuspending(false);
    }
  };

  const handleUnsuspend = async (userData: UserData) => {
    try {
      setSuspending(true);
      const payload = {
        is_suspended: false,
        suspended_reason: null,
        suspended_until: null,
      };

      const { error } = await supabase
        .from("profiles")
        .update(payload)
        .eq("id", userData.id);

      if (error) throw error;

      // Update local state
      const updated = users.map((u) => (u.id === userData.id ? { ...u, ...payload } : u));
      setUsers(updated);
      setFilteredUsers(updated);

      toast.success(`User ${userData.name || userData.email} has been unsuspended`);
    } catch (error) {
      console.error("Error unsuspending user:", error);
      toast.error("Failed to unsuspend user. Please try again.");
    } finally {
      setSuspending(false);
    }
  };

  const handleSuspendCancel = () => {
    setSuspendDialogOpen(false);
    setUserToSuspend(null);
    setSuspendReason("");
    setSuspendUntil("");
    setSuspendDurationType("date");
    setSuspendPeriod("permanent");
  };

  // Helper function to check if user is pending specialist verification
  const isPendingSpecialist = (userData: UserData) => {
    return userData.is_suspended === true && 
           userData.suspended_reason === 'Pending specialist verification' &&
           (userData.role === 'Specialist' || userData.role === 'specialist');
  };

  // Helper function to check if specialist is approved (not suspended, is specialist, has proof)
  const isApprovedSpecialist = (userData: UserData) => {
    return userData.is_suspended === false && 
           (userData.role === 'Specialist' || userData.role === 'specialist') &&
           userData.specialist_proof_url;
  };

  // Approve specialist
  const handleApproveClick = (userData: UserData) => {
    setUserToApprove(userData);
    setApproveDialogOpen(true);
  };

  const handleApproveConfirm = async () => {
    if (!userToApprove) return;

    try {
      setProcessing(true);

      // Update profile to unsuspend
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          is_suspended: false,
          suspended_reason: null,
          suspended_until: null,
        })
        .eq("id", userToApprove.id);

      if (updateError) throw updateError;

      // Send approval email
      try {
        await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-specialist-approval-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
          },
          body: JSON.stringify({
            to: userToApprove.email,
            name: userToApprove.name || userToApprove.email,
            approved: true
          })
        });
      } catch (emailError) {
        console.error('Email sending failed:', emailError);
        // Don't fail the whole operation if email fails
      }

      // Update local state
      const updated = users.map((u) =>
        u.id === userToApprove.id
          ? { ...u, is_suspended: false, suspended_reason: null, suspended_until: null }
          : u
      );
      setUsers(updated);
      setFilteredUsers(updated);

      toast.success(`Specialist ${userToApprove.name || userToApprove.email} has been approved`);
      setApproveDialogOpen(false);
      setUserToApprove(null);
    } catch (error) {
      console.error("Error approving specialist:", error);
      toast.error("Failed to approve specialist. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  // Refuse specialist
  const handleRefuseClick = (userData: UserData) => {
    setUserToApprove(userData);
    setRefusalReason("");
    setRefuseDialogOpen(true);
  };

  const handleRefuseConfirm = async () => {
    if (!userToApprove || !refusalReason.trim()) {
      toast.error("Please provide a reason for refusal");
      return;
    }

    try {
      setProcessing(true);

      // Update profile with refusal reason
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          is_suspended: true,
          suspended_reason: `Application refused: ${refusalReason}`,
          suspended_until: null,
        })
        .eq("id", userToApprove.id);

      if (updateError) throw updateError;

      // Send refusal email
      try {
        await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-specialist-approval-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
          },
          body: JSON.stringify({
            to: userToApprove.email,
            name: userToApprove.name || userToApprove.email,
            approved: false,
            reason: refusalReason
          })
        });
      } catch (emailError) {
        console.error('Email sending failed:', emailError);
      }

      // Update local state
      const updated = users.map((u) =>
        u.id === userToApprove.id
          ? { ...u, suspended_reason: `Application refused: ${refusalReason}` }
          : u
      );
      setUsers(updated);
      setFilteredUsers(updated);

      toast.success(`Specialist application for ${userToApprove.name || userToApprove.email} has been refused`);
      setRefuseDialogOpen(false);
      setUserToApprove(null);
      setRefusalReason("");
    } catch (error) {
      console.error("Error refusing specialist:", error);
      toast.error("Failed to refuse specialist. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  // Don't render if user is not loaded yet or not an admin
  if (!user || user.is_admin !== true) {
    return null;
  }

  return (
    <PageAnimation>
      <div className="admin-layout min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5" dir={language}>
      <Navbar />
      
        <ScrollAnimation>
          <div className="max-w-screen-2xl mx-auto px-2 sm:px-6 lg:px-10 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold flex items-center gap-3">
                <Shield className="w-10 h-10 text-primary" />
                {t("admin.dashboard.title")}
              </h1>
              <p className="text-muted-foreground mt-2">{t("admin.dashboard.subtitle")}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                onClick={refreshAllData} 
                id="admin-dashboard-refresh-button"
                variant="outline" 
                className="rounded-2xl px-6 py-3 border-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 gap-2"
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                {t("admin.dashboard.refresh")}
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Charts */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {(() => {
            const totalUsers = users.length;
            const studentsCount = users.filter((u) => u.role === "Student").length;
            const specialistsCount = users.filter((u) => u.role === "Specialist").length;
            const othersCount = totalUsers - studentsCount - specialistsCount;

            // Calculate majors by category
            const categoryCounts: { category: MajorCategory; count: number }[] = [];
            const categories: MajorCategory[] = ['Engineering', 'Medicine', 'Business', 'Arts', 'Science', 'IT', 'Law', 'Education', 'Other'];
            
            categories.forEach((category) => {
              const count = majors.filter((m) => m.category === category).length;
              categoryCounts.push({ category, count });
            });

            // Chart animation variants
            const chartVariants = {
              hidden: { 
                opacity: 0, 
                scale: 0.8,
                y: 20
              },
              visible: { 
                opacity: 1, 
                scale: 1,
                y: 0,
                transition: {
                  duration: 0.6,
                  ease: [0.4, 0, 0.2, 1] as const
                }
              }
            };

            // Loading skeleton component
            const ChartSkeleton = () => (
              <Card>
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                  <div className="relative h-[200px] flex items-center justify-center">
                    <Skeleton className="h-32 w-32 rounded-full" />
                  </div>
                </CardContent>
              </Card>
            );

            if (!chartsReady) {
              return (
                <>
                  <ChartSkeleton />
                  <ChartSkeleton />
                  <ChartSkeleton />
                </>
              );
            }

            return (
              <>
                <motion.div
                  initial="hidden"
                  animate="visible"
                  variants={chartVariants}
                >
                  <UserStatsChart
                    title={t("admin.dashboard.stats.totalUsers")}
                    total={totalUsers}
                    students={studentsCount}
                    specialists={specialistsCount}
                    others={othersCount}
                    type="total"
                  />
                </motion.div>
                <motion.div
                  initial="hidden"
                  animate="visible"
                  variants={chartVariants}
                  transition={{ delay: 0.2 }}
                >
                  <MajorsCategoryChart
                    title={t("admin.dashboard.stats.totalMajors")}
                    categoryCounts={categoryCounts}
                  />
                </motion.div>
                <motion.div
                  initial="hidden"
                  animate="visible"
                  variants={chartVariants}
                  transition={{ delay: 0.4 }}
                >
                  <CommunityStatsChart
                    title={t("admin.dashboard.stats.communityPosts")}
                    posts={communityPosts.filter((p) => !p.is_deleted).length}
                    answers={communityAnswers.filter((a) => !a.is_deleted).length}
                    comments={communityComments.filter((c) => !c.is_deleted).length}
                    pendingReports={pendingReports.length}
                  />
                </motion.div>
              </>
            );
          })()}
        </div>

        {/* Quick Actions */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-4">{t("admin.dashboard.tools.title")}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <Link to="/admin/universities" id="admin-dashboard-universities-link">
              <Card id="admin-dashboard-universities-card" className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardContent className="pt-6 h-full">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{t("admin.dashboard.tools.manageUniversities.title")}</h3>
                      <p className="text-sm text-muted-foreground">{t("admin.dashboard.tools.manageUniversities.desc")}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link to="/admin/majors" id="admin-dashboard-majors-link">
              <Card id="admin-dashboard-majors-card" className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardContent className="pt-6 h-full">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                      <BookOpen className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{t("admin.dashboard.tools.manageMajors.title")}</h3>
                      <p className="text-sm text-muted-foreground">{t("admin.dashboard.tools.manageMajors.desc")}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link to="/admin/university-majors" id="admin-dashboard-university-majors-link">
              <Card id="admin-dashboard-university-majors-card" className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardContent className="pt-6 h-full">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                      <LinkIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{t("admin.dashboard.tools.assignMajors.title")}</h3>
                      <p className="text-sm text-muted-foreground">{t("admin.dashboard.tools.assignMajors.desc")}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link to="/admin/community" id="admin-dashboard-community-link">
              <Card id="admin-dashboard-community-card" className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardContent className="pt-6 h-full">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center">
                      <MessageSquare className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{language === "ar" ? "إدارة المجتمع" : "Manage Community"}</h3>
                      <p className="text-sm text-muted-foreground">{language === "ar" ? "عرض وحذف المنشورات والإجابات والتعليقات" : "View and delete posts, answers, comments"}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                {t("admin.dashboard.table.title")}
              </CardTitle>
              <div className="relative w-full sm:w-64">
                <Search className={`absolute ${language === "ar" ? "right-3" : "left-3"} top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground`} />
                <Input
                  id="admin-dashboard-search-input"
                  placeholder={t("admin.dashboard.table.searchPlaceholder")}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={language === "ar" ? "pr-10" : "pl-10"}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                {searchTerm ? t("admin.dashboard.table.noSearchResults") : t("admin.dashboard.table.noResults")}
              </div>
            ) : (
              <>
                {/* Mobile Card View */}
                <div className="block lg:hidden space-y-4">
                  {filteredUsers.map((userData) => (
                    <Card key={userData.id} className="p-4 bg-gradient-to-br from-background to-muted/20">
                      <div className="space-y-3">
                        {/* Name and Role */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg mb-1">
                              {userData.name || t("profile.display.notSet")}
                            </h3>
                            {userData.role ? (
                              <Badge variant="outline" className="text-xs">
                                {userData.role === "Student" ? t("auth.role.student") : userData.role === "Specialist" ? t("auth.role.specialist") : userData.role}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground text-sm">{t("profile.display.notSet")}</span>
                            )}
                          </div>
                        </div>

                        {/* User Details Grid */}
                        <div className="grid grid-cols-1 gap-2 text-sm pt-2 border-t">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">{t("admin.dashboard.table.headers.email")}:</span>
                            <span className="font-medium text-right break-all max-w-[60%]">{userData.email || t("profile.display.notSet")}</span>
                          </div>
                          
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">{t("admin.dashboard.table.headers.institution")}:</span>
                            <span className="font-medium text-right">{userData.establishment_name || t("profile.display.notSet")}</span>
                          </div>
                          
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">{t("admin.dashboard.table.headers.level")}:</span>
                            <span className="font-medium text-right">{userData.level || t("profile.display.notSet")}</span>
                          </div>
                          
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">{t("admin.dashboard.table.headers.gender")}:</span>
                            <span className="font-medium text-right">
                              {userData.gender === "Male"
                                ? t("auth.gender.male")
                                : userData.gender === "Female"
                                ? t("auth.gender.female")
                                : userData.gender || t("profile.display.notSet")}
                            </span>
                          </div>
                          
                          {(userData.role === 'Specialist' || userData.role === 'specialist') && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Proof:</span>
                              <span className="font-medium text-right">
                                {userData.specialist_proof_url ? (
                                  <button
                                    onClick={() => handleViewProof(userData)}
                                    className="text-blue-600 hover:underline dark:text-blue-400"
                                    id={`admin-dashboard-proof-link-${userData.id}`}
                                  >
                                    View
                                  </button>
                                ) : (
                                  t("profile.display.notSet")
                                )}
                              </span>
                            </div>
                          )}
                          
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">{t("admin.dashboard.table.headers.joined")}:</span>
                            <span className="font-medium text-right text-xs">{formatDate(userData.created_at)}</span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-wrap items-center gap-2 pt-3 border-t">
                          {isPendingSpecialist(userData) ? (
                            <>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    id={`admin-dashboard-action-specialist-${userData.id}`}
                                    disabled={processing}
                                    className="rounded-xl border-2 text-blue-600 border-blue-200 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-all duration-300 hover:shadow-lg gap-1 flex-1"
                                  >
                                    Take Action
                                    <ChevronDown className="w-3 h-3 ml-1" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() => handleApproveClick(userData)}
                                    className="text-green-600 focus:text-green-600 focus:bg-green-50 dark:focus:bg-green-950/20 cursor-pointer"
                                  >
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Approve
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleRefuseClick(userData)}
                                    className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/20 cursor-pointer"
                                  >
                                    <XCircle className="w-4 h-4 mr-2" />
                                    Refuse
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={true}
                                className="rounded-xl border-2 text-gray-400 border-gray-200 bg-gray-50 dark:bg-gray-900/20 cursor-not-allowed opacity-50"
                                title="Approve specialist first to enable suspension"
                              >
                                <Ban className="w-4 h-4" />
                              </Button>
                            </>
                          ) : isApprovedSpecialist(userData) ? (
                            <>
                              <Badge variant="outline" className="rounded-xl bg-green-50 text-green-700 border-green-200 dark:bg-green-950/20 dark:text-green-400 dark:border-green-800 px-3 py-1">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Approved
                              </Badge>
                              <Button
                                variant="outline"
                                size="sm"
                                id={`admin-dashboard-suspend-user-${userData.id}`}
                                onClick={() => handleSuspendClick(userData)}
                                disabled={suspending || userData.id === user?.id || !!userData.is_admin}
                                className="rounded-xl border-2 text-amber-600 border-amber-200 hover:bg-amber-50 dark:hover:bg-amber-950/20 transition-all duration-300 hover:shadow-lg gap-1"
                              >
                                <Ban className="w-4 h-4" />
                              </Button>
                            </>
                          ) : userData.is_suspended ? (
                            <Button
                              variant="outline"
                              size="sm"
                              id={`admin-dashboard-unsuspend-user-${userData.id}`}
                              onClick={() => handleUnsuspend(userData)}
                              disabled={suspending}
                              className="rounded-xl border-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-300 hover:shadow-lg gap-1 flex-1"
                            >
                              <Undo2 className="w-4 h-4 mr-2" />
                              Unsuspend
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              id={`admin-dashboard-suspend-user-${userData.id}`}
                              onClick={() => handleSuspendClick(userData)}
                              disabled={suspending || userData.id === user?.id || !!userData.is_admin}
                              className="rounded-xl border-2 text-amber-600 border-amber-200 hover:bg-amber-50 dark:hover:bg-amber-950/20 transition-all duration-300 hover:shadow-lg gap-1 flex-1"
                            >
                              <Ban className="w-4 h-4 mr-2" />
                              Suspend
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            id={`admin-dashboard-delete-user-${userData.id}`}
                            onClick={() => handleDeleteClick(userData)}
                            disabled={userData.id === user?.id}
                            className="rounded-xl text-destructive hover:text-destructive hover:bg-destructive/10 transition-all duration-300 hover:shadow-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>

                {/* Desktop Table View */}
                <div className="hidden lg:block overflow-x-auto">
                <Table>
          <TableHeader>
            <TableRow>
                      <TableHead className={language === "ar" ? "text-right" : "text-left"}>
                        {t("admin.dashboard.table.headers.name")}
                      </TableHead>
                      <TableHead className={`${language === "ar" ? "text-right" : "text-left"} hidden sm:table-cell`}>
                        {t("admin.dashboard.table.headers.email")}
                      </TableHead>
                      <TableHead className={language === "ar" ? "text-right" : "text-left"}>
                        {t("admin.dashboard.table.headers.role")}
                      </TableHead>
                      <TableHead className={`${language === "ar" ? "text-right" : "text-left"} hidden md:table-cell`}>
                        {t("admin.dashboard.table.headers.institution")}
                      </TableHead>
                      <TableHead className={`${language === "ar" ? "text-right" : "text-left"} hidden lg:table-cell`}>
                        {t("admin.dashboard.table.headers.level")}
                      </TableHead>
              <TableHead className={`${language === "ar" ? "text-right" : "text-left"} hidden lg:table-cell`}>
                {t("admin.dashboard.table.headers.gender")}
              </TableHead>
              <TableHead className={`${language === "ar" ? "text-right" : "text-left"} hidden xl:table-cell`}>
                Proof
              </TableHead>
              <TableHead className={`${language === "ar" ? "text-right" : "text-left"} hidden xl:table-cell`}>
                {t("admin.dashboard.table.headers.joined")}
              </TableHead>
            <TableHead className="text-center">
              {t("admin.dashboard.table.headers.actions")}
            </TableHead>
          </TableRow>
          </TableHeader>
                  <TableBody>
                    {filteredUsers.map((userData) => (
                      <TableRow key={userData.id}>
                        <TableCell className={`font-medium ${language === "ar" ? "text-right" : "text-left"}`}>
                          {userData.name || t("profile.display.notSet")}
                        </TableCell>
                        <TableCell className={`text-sm text-muted-foreground ${language === "ar" ? "text-right" : "text-left"} hidden sm:table-cell`}>
                          {userData.email || t("profile.display.notSet")}
                        </TableCell>
                        <TableCell className={language === "ar" ? "text-right" : "text-left"}>
                          {userData.role ? (
                            <Badge variant="outline">{userData.role === "Student" ? t("auth.role.student") : userData.role === "Specialist" ? t("auth.role.specialist") : userData.role}</Badge>
                          ) : (
                            <span className="text-muted-foreground text-sm">{t("profile.display.notSet")}</span>
                          )}
                        </TableCell>
                        <TableCell className={`text-sm ${language === "ar" ? "text-right" : "text-left"} hidden md:table-cell`}>
                          {userData.establishment_name || t("profile.display.notSet")}
                        </TableCell>
                        <TableCell className={`text-sm ${language === "ar" ? "text-right" : "text-left"} hidden lg:table-cell`}>
                          {userData.level || t("profile.display.notSet")}
                        </TableCell>
                        <TableCell className={`text-sm ${language === "ar" ? "text-right" : "text-left"} hidden lg:table-cell`}>
                          {userData.gender === "Male"
                            ? t("auth.gender.male")
                            : userData.gender === "Female"
                            ? t("auth.gender.female")
                            : userData.gender || t("profile.display.notSet")}
                        </TableCell>
                        <TableCell className={`text-sm ${language === "ar" ? "text-right" : "text-left"} hidden xl:table-cell`}>
                          {userData.role === 'Specialist' || userData.role === 'specialist' ? (
                            userData.specialist_proof_url ? (
                              <button
                                onClick={() => handleViewProof(userData)}
                                className="text-blue-600 hover:underline dark:text-blue-400"
                                id={`admin-dashboard-proof-link-${userData.id}`}
                              >
                                View
                              </button>
                            ) : (
                              <span className="text-muted-foreground text-sm">{t("profile.display.notSet")}</span>
                            )
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell className={`text-sm text-muted-foreground ${language === "ar" ? "text-right" : "text-left"} hidden xl:table-cell`}>
                          {formatDate(userData.created_at)}
                        </TableCell>
                        <TableCell className={language === "ar" ? "text-left" : "text-right"}>
                          <div className={`flex items-center gap-1 ${language === "ar" ? "justify-start" : "justify-end"}`}>
                            {isPendingSpecialist(userData) ? (
                              <>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      id={`admin-dashboard-action-specialist-${userData.id}`}
                                      disabled={processing}
                                      className="rounded-xl border-2 text-blue-600 dark:text-blue-400 border-blue-200 hover:bg-blue-50 dark:hover:bg-blue-950/20 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-300 hover:shadow-lg gap-1"
                                    >
                                      Take Action
                                      <ChevronDown className="w-3 h-3 ml-1" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                      onClick={() => handleApproveClick(userData)}
                                      className="text-green-600 focus:text-green-600 focus:bg-green-50 dark:focus:bg-green-950/20 cursor-pointer"
                                    >
                                      <CheckCircle className="w-4 h-4 mr-2" />
                                      Approve
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => handleRefuseClick(userData)}
                                      className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/20 cursor-pointer"
                                    >
                                      <XCircle className="w-4 h-4 mr-2" />
                                      Refuse
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled={true}
                                  className="rounded-xl border-2 text-gray-400 border-gray-200 bg-gray-50 dark:bg-gray-900/20 cursor-not-allowed opacity-50"
                                  title="Approve specialist first to enable suspension"
                                >
                                  <Ban className="w-4 h-4" />
                                </Button>
                              </>
                            ) : isApprovedSpecialist(userData) ? (
                              <>
                                <Badge variant="outline" className="rounded-xl bg-green-50 text-green-700 border-green-200 dark:bg-green-950/20 dark:text-green-400 dark:border-green-800 px-3 py-1">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Approved
                                </Badge>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  id={`admin-dashboard-suspend-user-${userData.id}`}
                                  onClick={() => handleSuspendClick(userData)}
                                  disabled={suspending || userData.id === user?.id || !!userData.is_admin}
                                  className="rounded-xl border-2 text-amber-600 border-amber-200 hover:bg-amber-50 dark:hover:bg-amber-950/20 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 gap-1"
                                >
                                  <Ban className="w-4 h-4" />
                                </Button>
                              </>
                            ) : userData.is_suspended ? (
                              <Button
                                variant="outline"
                                size="sm"
                                id={`admin-dashboard-unsuspend-user-${userData.id}`}
                                onClick={() => handleUnsuspend(userData)}
                                disabled={suspending}
                                className="rounded-xl border-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 gap-1"
                              >
                                <Undo2 className="w-4 h-4" />
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                id={`admin-dashboard-suspend-user-${userData.id}`}
                                onClick={() => handleSuspendClick(userData)}
                                disabled={suspending || userData.id === user?.id || !!userData.is_admin}
                                className="rounded-xl border-2 text-amber-600 border-amber-200 hover:bg-amber-50 dark:hover:bg-amber-950/20 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 gap-1"
                              >
                                <Ban className="w-4 h-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              id={`admin-dashboard-delete-user-${userData.id}`}
                              onClick={() => handleDeleteClick(userData)}
                              disabled={userData.id === user?.id}
                              className="rounded-xl text-destructive hover:text-destructive hover:bg-destructive/10 transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                </div>
              </>
            )}
          </CardContent>
        </Card>
          </div>
        </ScrollAnimation>

        {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("admin.dashboard.dialog.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("admin.dashboard.dialog.description", {
                name: userToDelete?.name || userToDelete?.email || "",
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleDeleteCancel} id="admin-dashboard-delete-cancel-button" disabled={deleting}>
              {t("admin.dashboard.dialog.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              id="admin-dashboard-delete-confirm-button"
              disabled={deleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleting ? (
                <>
                  <Loader2 className={`w-4 h-4 ${language === "ar" ? "ml-2" : "mr-2"} animate-spin`} />
                  {t("admin.dashboard.dialog.deleting")}
                </>
              ) : (
                t("admin.dashboard.dialog.delete")
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Suspend Dialog */}
      <AlertDialog open={suspendDialogOpen} onOpenChange={setSuspendDialogOpen}>
        <AlertDialogContent className="max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Suspend User</AlertDialogTitle>
            <AlertDialogDescription>
              Suspend user{" "}
              <span className="font-semibold text-foreground">
                {userToSuspend?.name || userToSuspend?.email}
              </span>
              . The user will be blocked from logging in and will see the suspension reason.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Reason <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="e.g., Policy violation, Terms of service breach, Inappropriate behavior"
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground mt-1">
                This reason will be shown to the user when they try to login
              </p>
            </div>
            
            <div className="space-y-3">
              <label className="block text-sm font-medium">
                Duration
              </label>
              
              {/* Duration Type Selection */}
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={suspendDurationType === "date" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSuspendDurationType("date")}
                  className="flex-1"
                >
                  Specific Date
                </Button>
                <Button
                  type="button"
                  variant={suspendDurationType === "period" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSuspendDurationType("period")}
                  className="flex-1"
                >
                  By Period
                </Button>
              </div>

              {/* Specific Date Option */}
              {suspendDurationType === "date" && (
                <div>
                  <label className="block text-sm text-muted-foreground mb-1">
                    Suspend Until
                  </label>
                  <Input
                    type="datetime-local"
                    value={suspendUntil}
                    onChange={(e) => setSuspendUntil(e.target.value)}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Leave empty for permanent suspension
                  </p>
                </div>
              )}

              {/* Period Selection Option */}
              {suspendDurationType === "period" && (
                <div>
                  <label className="block text-sm text-muted-foreground mb-1">
                    Suspension Period
                  </label>
                  <Select value={suspendPeriod} onValueChange={(value: "week" | "month" | "permanent") => setSuspendPeriod(value)}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="week">1 Week</SelectItem>
                      <SelectItem value="month">1 Month</SelectItem>
                      <SelectItem value="permanent">Permanent (Until Removed)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    {suspendPeriod === "week" && "User will be suspended for 7 days"}
                    {suspendPeriod === "month" && "User will be suspended for 30 days"}
                    {suspendPeriod === "permanent" && "User will remain suspended until manually unsuspended"}
                  </p>
                </div>
              )}
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleSuspendCancel} disabled={suspending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSuspendConfirm}
              disabled={suspending || !suspendReason.trim()}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {suspending ? (
                <>
                  <Loader2 className={`w-4 h-4 ${language === "ar" ? "ml-2" : "mr-2"} animate-spin`} />
                  Suspending...
                </>
              ) : (
                "Suspend User"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Approve Specialist Dialog */}
      <AlertDialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve Specialist</AlertDialogTitle>
            <AlertDialogDescription>
              Approve specialist application for{" "}
              <span className="font-semibold text-foreground">
                {userToApprove?.name || userToApprove?.email}
              </span>
              . The user will be able to access the platform and an approval email will be sent.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setApproveDialogOpen(false); setUserToApprove(null); }} disabled={processing}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleApproveConfirm}
              disabled={processing}
              className="bg-green-600 hover:bg-green-700"
            >
              {processing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Approving...
                </>
              ) : (
                "Approve"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Refuse Specialist Dialog */}
      <AlertDialog open={refuseDialogOpen} onOpenChange={setRefuseDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Refuse Specialist Application</AlertDialogTitle>
            <AlertDialogDescription>
              Refuse specialist application for{" "}
              <span className="font-semibold text-foreground">
                {userToApprove?.name || userToApprove?.email}
              </span>
              . Please provide a reason that will be sent to the applicant.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <label className="block text-sm font-medium mb-1">
              Refusal Reason <span className="text-red-500">*</span>
            </label>
            <Input
              placeholder="e.g., Insufficient credentials, incomplete documentation"
              value={refusalReason}
              onChange={(e) => setRefusalReason(e.target.value)}
              className="w-full"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setRefuseDialogOpen(false); setUserToApprove(null); setRefusalReason(""); }} disabled={processing}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRefuseConfirm}
              disabled={processing || !refusalReason.trim()}
              className="bg-red-600 hover:bg-red-700"
            >
              {processing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Refusing...
                </>
              ) : (
                "Refuse"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </div>
    </PageAnimation>
  );
};

export default AdminDashboard;
