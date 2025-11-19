import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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

export default function AdminReports() {
  const [reports, setReports] = useState<CommunityReport[]>([]);
  const [filteredReports, setFilteredReports] = useState<CommunityReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ReportStatus | 'all'>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const { language } = useI18n();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user?.is_admin) {
      navigate('/');
      return;
    }
    fetchReports();
  }, [user]);

  useEffect(() => {
    filterReports();
  }, [reports, searchQuery, statusFilter, dateFilter]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const allReports = await getCommunityReports();
      setReports(allReports);
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast.error(language === 'ar' ? 'فشل في تحميل البلاغات' : 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const filterReports = () => {
    let filtered = [...reports];

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(report => report.status === statusFilter);
    }

    // Filter by date
    if (dateFilter !== 'all') {
      const now = new Date();
      const filterDate = new Date();
      
      if (dateFilter === 'today') {
        filterDate.setHours(0, 0, 0, 0);
      } else if (dateFilter === 'week') {
        filterDate.setDate(now.getDate() - 7);
      } else if (dateFilter === 'month') {
        filterDate.setMonth(now.getMonth() - 1);
      }
      
      filtered = filtered.filter(report => new Date(report.created_at) >= filterDate);
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(report => 
        report.target_title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        report.reason.toLowerCase().includes(searchQuery.toLowerCase()) ||
        report.reporter_name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredReports(filtered);
  };

  const handleUpdateStatus = async (reportId: string, newStatus: ReportStatus) => {
    try {
      await updateCommunityReportStatus(reportId, newStatus);
      toast.success(language === 'ar' ? 'تم تحديث حالة البلاغ' : 'Report status updated');
      fetchReports();
    } catch (error) {
      console.error('Error updating report status:', error);
      toast.error(language === 'ar' ? 'فشل في تحديث حالة البلاغ' : 'Failed to update report status');
    }
  };

  const getStatusBadge = (status: ReportStatus) => {
    const variants = {
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      reviewing: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      resolved: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      dismissed: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
    };

    const labels = {
      pending: language === 'ar' ? 'قيد الانتظار' : 'Pending',
      reviewing: language === 'ar' ? 'قيد المراجعة' : 'Reviewing',
      resolved: language === 'ar' ? 'تم الحل' : 'Resolved',
      dismissed: language === 'ar' ? 'مرفوض' : 'Dismissed',
    };

    return (
      <Badge className={variants[status]}>
        {labels[status]}
      </Badge>
    );
  };

  const getReasonLabel = (reason: string) => {
    const reasons: Record<string, { ar: string; en: string }> = {
      spam: { ar: 'محتوى غير مرغوب فيه', en: 'Spam' },
      inappropriate: { ar: 'محتوى غير لائق', en: 'Inappropriate' },
      harassment: { ar: 'تحرش', en: 'Harassment' },
      misinformation: { ar: 'معلومات خاطئة', en: 'Misinformation' },
      other: { ar: 'أخرى', en: 'Other' },
    };
    return reasons[reason]?.[language] || reason;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString(language === 'ar' ? 'ar-SA' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!user?.is_admin) {
    return null;
  }

  if (loading) {
    return (
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
    );
  }

  return (
    <PageAnimation>
      <div className="min-h-screen bg-gradient-to-br from-[#e3e8ff] via-[#f5f7ff] to-[#cbd4ff] dark:from-[#0f172a] dark:via-[#1e2a4a] dark:to-[#2a3b6b]">
        <Navbar />
        
        <div className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
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
                <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">
                  {language === 'ar' ? 'إدارة البلاغات' : 'Reports Management'}
                </h1>
              </div>
              <p className="text-gray-600 dark:text-gray-300">
                {language === 'ar' 
                  ? `${filteredReports.length} بلاغ من أصل ${reports.length}` 
                  : `${filteredReports.length} of ${reports.length} reports`}
              </p>
            </div>

            {/* Filters */}
            <Card className="p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder={language === 'ar' ? 'بحث...' : 'Search...'}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as ReportStatus | 'all')}>
                  <SelectTrigger>
                    <SelectValue placeholder={language === 'ar' ? 'الحالة' : 'Status'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{language === 'ar' ? 'جميع الحالات' : 'All Statuses'}</SelectItem>
                    <SelectItem value="pending">{language === 'ar' ? 'قيد الانتظار' : 'Pending'}</SelectItem>
                    <SelectItem value="reviewing">{language === 'ar' ? 'قيد المراجعة' : 'Reviewing'}</SelectItem>
                    <SelectItem value="resolved">{language === 'ar' ? 'تم الحل' : 'Resolved'}</SelectItem>
                    <SelectItem value="dismissed">{language === 'ar' ? 'مرفوض' : 'Dismissed'}</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={dateFilter} onValueChange={(value) => setDateFilter(value as typeof dateFilter)}>
                  <SelectTrigger>
                    <SelectValue placeholder={language === 'ar' ? 'التاريخ' : 'Date'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{language === 'ar' ? 'جميع الأوقات' : 'All Time'}</SelectItem>
                    <SelectItem value="today">{language === 'ar' ? 'اليوم' : 'Today'}</SelectItem>
                    <SelectItem value="week">{language === 'ar' ? 'آخر أسبوع' : 'Last Week'}</SelectItem>
                    <SelectItem value="month">{language === 'ar' ? 'آخر شهر' : 'Last Month'}</SelectItem>
                  </SelectContent>
                </Select>

                <Button onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('all');
                  setDateFilter('all');
                }} variant="outline">
                  <Filter className="w-4 h-4 mr-2" />
                  {language === 'ar' ? 'إعادة تعيين' : 'Reset'}
                </Button>
              </div>
            </Card>

            {/* Reports List */}
            {filteredReports.length === 0 ? (
              <Card className="p-12 text-center">
                <Flag className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  {language === 'ar' ? 'لا توجد بلاغات' : 'No Reports Found'}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {language === 'ar' 
                    ? 'لا توجد بلاغات تطابق المعايير المحددة' 
                    : 'No reports match the selected criteria'}
                </p>
              </Card>
            ) : (
              <div className="grid gap-4">
                {filteredReports.map((report) => (
                  <Card key={report.id} className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3 flex-wrap">
                          {getStatusBadge(report.status)}
                          <Badge variant="outline">
                            {report.target_type === 'post' 
                              ? (language === 'ar' ? 'منشور' : 'Post')
                              : (language === 'ar' ? 'إجابة' : 'Answer')}
                          </Badge>
                          <Badge variant="secondary">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            {getReasonLabel(report.reason)}
                          </Badge>
                          <span className="text-sm text-gray-500">
                            {formatDate(report.created_at)}
                          </span>
                        </div>

                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                          {report.target_title || (language === 'ar' ? 'لا يوجد عنوان' : 'No title')}
                        </h3>

                        {report.target_excerpt && (
                          <p className="text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                            {report.target_excerpt}
                          </p>
                        )}

                        <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                          <span>{language === 'ar' ? 'أبلغ بواسطة:' : 'Reported by:'}</span>
                          <span className="font-medium">{report.reporter_name}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigate(`/community/post/${report.target_id}`)}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            {language === 'ar' ? 'عرض المحتوى' : 'View Content'}
                          </Button>

                          {report.status === 'pending' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUpdateStatus(report.id, 'reviewing')}
                            >
                              {language === 'ar' ? 'بدء المراجعة' : 'Start Review'}
                            </Button>
                          )}

                          {report.status === 'reviewing' && (
                            <>
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => handleUpdateStatus(report.id, 'resolved')}
                              >
                                <Check className="w-4 h-4 mr-2" />
                                {language === 'ar' ? 'تم الحل' : 'Resolve'}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleUpdateStatus(report.id, 'dismissed')}
                              >
                                <X className="w-4 h-4 mr-2" />
                                {language === 'ar' ? 'رفض' : 'Dismiss'}
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
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
