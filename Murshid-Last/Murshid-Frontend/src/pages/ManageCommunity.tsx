import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { PageAnimation } from "@/components/animations/PageAnimation";
import { 
  Flag,
  Search,
  ArrowLeft,
  Eye,
  Check,
  X,
  AlertTriangle,
  Filter
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useI18n } from '@/contexts/I18nContext';
import { useAuth } from '@/contexts/AuthContext';
import type { CommunityReport, ReportStatus } from '@/types/community';
import { toast } from 'sonner';
import { getCommunityReports, updateCommunityReportStatus } from '@/lib/communityApi';

export default function ManageCommunity() {
  const [reports, setReports] = useState<CommunityReport[]>([]);
  const [filteredReports, setFilteredReports] = useState<CommunityReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'pending' | 'resolved' | 'dismissed'>('pending');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const { language } = useI18n();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Restore active tab from location state if available
  useEffect(() => {
    const locationState = location.state as { activeTab?: 'pending' | 'resolved' | 'dismissed' } | null;
    if (locationState?.activeTab) {
      setActiveTab(locationState.activeTab);
    }
  }, [location.state]);

  useEffect(() => {
    if (!user?.is_admin) {
      navigate('/');
      return;
    }
    fetchReports();
  }, [user]);

  useEffect(() => {
    applyFilters();
  }, [reports, searchQuery, activeTab, dateFilter]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const fetchedReports = await getCommunityReports();
      setReports(fetchedReports);
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast.error(language === 'ar' ? 'فشل تحميل التقارير' : 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...reports];

    // Tab filter (status)
    filtered = filtered.filter(report => report.status === activeTab);

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(report =>
        report.target_title?.toLowerCase().includes(query) ||
        report.reporter_name.toLowerCase().includes(query) ||
        report.reason.toLowerCase().includes(query)
      );
    }

    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      filtered = filtered.filter(report => {
        const reportDate = new Date(report.created_at);
        
        if (dateFilter === 'today') {
          return reportDate >= today;
        } else if (dateFilter === 'week') {
          const weekAgo = new Date(today);
          weekAgo.setDate(weekAgo.getDate() - 7);
          return reportDate >= weekAgo;
        } else if (dateFilter === 'month') {
          const monthAgo = new Date(today);
          monthAgo.setMonth(monthAgo.getMonth() - 1);
          return reportDate >= monthAgo;
        }
        return true;
      });
    }

    setFilteredReports(filtered);
  };

  const handleUpdateStatus = async (reportId: string, newStatus: ReportStatus) => {
    try {
      await updateCommunityReportStatus(reportId, newStatus);
      setReports(prev => prev.map(report => 
        report.id === reportId ? { ...report, status: newStatus } : report
      ));
      toast.success(language === 'ar' ? 'تم تحديث حالة التقرير' : 'Report status updated');
    } catch (error) {
      console.error('Error updating report status:', error);
      toast.error(language === 'ar' ? 'فشل تحديث حالة التقرير' : 'Failed to update report status');
    }
  };

  const getStatusBadge = (status: ReportStatus) => {
    const variants = {
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      reviewing: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      resolved: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      dismissed: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
    };

    const labels = {
      pending: language === 'ar' ? 'قيد الانتظار' : 'Pending',
      reviewing: language === 'ar' ? 'قيد المراجعة' : 'Reviewing',
      resolved: language === 'ar' ? 'محلول' : 'Resolved',
      dismissed: language === 'ar' ? 'مرفوض' : 'Dismissed'
    };

    return (
      <Badge className={variants[status]}>
        {labels[status]}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <PageAnimation>
        <div className="min-h-screen bg-gradient-to-br from-[#e3e8ff] via-[#f5f7ff] to-[#cbd4ff] dark:from-[#0f172a] dark:via-[#1e2a4a] dark:to-[#2a3b6b]">
          <Navbar />
          <div className="py-20 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-300">
                {language === 'ar' ? 'جاري التحميل...' : 'Loading...'}
              </p>
            </div>
          </div>
        </div>
      </PageAnimation>
    );
  }

  return (
    <PageAnimation>
      <div className="min-h-screen bg-gradient-to-br from-[#e3e8ff] via-[#f5f7ff] to-[#cbd4ff] dark:from-[#0f172a] dark:via-[#1e2a4a] dark:to-[#2a3b6b]">
        <Navbar />
        
        <div className="py-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-10">
            {/* Header */}
            <div className="mb-8">
              <Button
                onClick={() => navigate('/admin/dashboard')}
                variant="ghost"
                className="mb-4"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                {language === 'ar' ? 'العودة إلى لوحة التحكم' : 'Back to Dashboard'}
              </Button>
              
              <div className="flex items-center gap-3 mb-2">
                <Flag className="w-8 h-8 text-red-500" />
                <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100" dir={language}>
                  {language === 'ar' ? 'إدارة المجتمع' : 'Manage Community'}
                </h1>
              </div>
              <p className="text-gray-600 dark:text-gray-300" dir={language}>
                {language === 'ar' 
                  ? `${filteredReports.length} تقرير`
                  : `${filteredReports.length} reports`}
              </p>
            </div>

            {/* Tabs - 2x2 grid on mobile, flex on larger screens */}
            <div className="grid grid-cols-2 xl:flex gap-4 mb-6">
              {[
                { id: 'pending', label: language === 'ar' ? 'قيد الانتظار' : 'Pending', count: reports.filter(r => r.status === 'pending').length },
                { id: 'resolved', label: language === 'ar' ? 'محلول' : 'Resolved', count: reports.filter(r => r.status === 'resolved').length },
                { id: 'dismissed', label: language === 'ar' ? 'مرفوض' : 'Dismissed', count: reports.filter(r => r.status === 'dismissed').length }
              ].map((tab) => (
                <Button
                  key={tab.id}
                  variant={activeTab === tab.id ? 'default' : 'outline'}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`rounded-2xl px-6 py-3 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 w-full xl:w-auto ${
                    activeTab === tab.id 
                      ? 'bg-blue-500 hover:bg-blue-600 text-white' 
                      : 'border-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400'
                  }`}
                >
                  {tab.label} ({tab.count})
                </Button>
              ))}
            </div>

            {/* Filters */}
            <Card className="p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Search */}
                <div className="relative">
                  <Search className={`absolute ${language === 'ar' ? 'right-3' : 'left-3'} top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5`} />
                  <Input
                    type="text"
                    placeholder={language === 'ar' ? 'بحث...' : 'Search...'}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`${language === 'ar' ? 'pr-10' : 'pl-10'}`}
                    dir={language}
                  />
                </div>

                {/* Date Filter */}
                <Select value={dateFilter} onValueChange={(value) => setDateFilter(value as any)}>
                  <SelectTrigger>
                    <SelectValue placeholder={language === 'ar' ? 'التاريخ' : 'Date'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{language === 'ar' ? 'الكل' : 'All'}</SelectItem>
                    <SelectItem value="today">{language === 'ar' ? 'اليوم' : 'Today'}</SelectItem>
                    <SelectItem value="week">{language === 'ar' ? 'هذا الأسبوع' : 'This Week'}</SelectItem>
                    <SelectItem value="month">{language === 'ar' ? 'هذا الشهر' : 'This Month'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </Card>

            {/* Reports List */}
            {filteredReports.length === 0 ? (
              <Card className="p-12 text-center">
                <Flag className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2" dir={language}>
                  {language === 'ar' ? 'لا توجد تقارير' : 'No reports'}
                </h3>
                <p className="text-gray-600 dark:text-gray-300" dir={language}>
                  {language === 'ar' ? 'لا توجد تقارير تطابق المعايير المحددة' : 'No reports match the selected criteria'}
                </p>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredReports.map((report) => (
                  <Card key={report.id} className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {getStatusBadge(report.status)}
                          <Badge variant="outline" className="text-xs">
                            {report.target_type === 'post' ? (language === 'ar' ? 'منشور' : 'Post') : (language === 'ar' ? 'إجابة' : 'Answer')}
                          </Badge>
                          <span className="text-sm text-gray-500">
                            {formatDate(report.created_at)}
                          </span>
                        </div>
                        
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2" dir={language}>
                          {report.target_title || (language === 'ar' ? 'بدون عنوان' : 'No title')}
                        </h3>
                        
                        <div className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                          <span className="font-medium">{language === 'ar' ? 'المبلغ: ' : 'Reporter: '}</span>
                          {report.reporter_name}
                        </div>
                        
                        <div className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                          <span className="font-medium">{language === 'ar' ? 'السبب: ' : 'Reason: '}</span>
                          {report.reason}
                        </div>
                        
                        {report.target_excerpt && (
                          <div className="text-sm text-gray-500 italic border-l-4 border-gray-300 pl-3 mb-3" dir={language}>
                            {report.target_excerpt}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(`/community/post/${report.target_type === 'post' ? report.target_id : report.target_id}`, {
                          state: { from: 'manage-community', tab: activeTab }
                        })}
                        className="gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        {language === 'ar' ? 'عرض' : 'View'}
                      </Button>
                      
                      {report.status === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUpdateStatus(report.id, 'reviewing')}
                            className="gap-2"
                          >
                            <AlertTriangle className="w-4 h-4" />
                            {language === 'ar' ? 'قيد المراجعة' : 'Review'}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUpdateStatus(report.id, 'resolved')}
                            className="gap-2 text-green-600 hover:text-green-700"
                          >
                            <Check className="w-4 h-4" />
                            {language === 'ar' ? 'حل' : 'Resolve'}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUpdateStatus(report.id, 'dismissed')}
                            className="gap-2 text-red-600 hover:text-red-700"
                          >
                            <X className="w-4 h-4" />
                            {language === 'ar' ? 'رفض' : 'Dismiss'}
                          </Button>
                        </>
                      )}
                      
                      {report.status === 'reviewing' && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUpdateStatus(report.id, 'resolved')}
                            className="gap-2 text-green-600 hover:text-green-700"
                          >
                            <Check className="w-4 h-4" />
                            {language === 'ar' ? 'حل' : 'Resolve'}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUpdateStatus(report.id, 'dismissed')}
                            className="gap-2 text-red-600 hover:text-red-700"
                          >
                            <X className="w-4 h-4" />
                            {language === 'ar' ? 'رفض' : 'Dismiss'}
                          </Button>
                        </>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </PageAnimation>
  );
}
