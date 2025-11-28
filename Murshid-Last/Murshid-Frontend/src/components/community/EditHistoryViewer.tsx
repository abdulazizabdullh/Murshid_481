import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { 
  History, 
  ChevronDown, 
  ChevronUp, 
  User, 
  Clock, 
  FileEdit,
  Plus,
  Minus,
  RefreshCw,
  FileText
} from 'lucide-react';
import { useI18n } from '@/contexts/I18nContext';
import {
  getContentVersionHistory,
  formatDiffAsHtml,
  getDiffStyles,
} from '@/lib/versioningApi';
import type { ContentVersion, VersionContentType } from '@/types/community';
import { formatTimeAgo, formatFullDate } from '@/lib/timeUtils';

interface EditHistoryViewerProps {
  contentType: VersionContentType;
  contentId: string;
  contentTitle?: string;
  isOpen: boolean;
  onClose: () => void;
}

export function EditHistoryViewer({
  contentType,
  contentId,
  contentTitle,
  isOpen,
  onClose,
}: EditHistoryViewerProps) {
  const { language } = useI18n();
  const [versions, setVersions] = useState<ContentVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedVersions, setExpandedVersions] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (isOpen) {
      fetchVersionHistory();
    }
  }, [isOpen, contentType, contentId]);

  const fetchVersionHistory = async () => {
    setLoading(true);
    try {
      const history = await getContentVersionHistory(contentType, contentId);
      setVersions(history);
      // Auto-expand the first version
      if (history.length > 0) {
        setExpandedVersions(new Set([history[0].id]));
      }
    } catch (error) {
      console.error('Error fetching version history:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleVersion = (versionId: string) => {
    setExpandedVersions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(versionId)) {
        newSet.delete(versionId);
      } else {
        newSet.add(versionId);
      }
      return newSet;
    });
  };

  const getFieldLabel = (field: string): string => {
    const labels: Record<string, { en: string; ar: string }> = {
      title: { en: 'Title', ar: 'العنوان' },
      content: { en: 'Content', ar: 'المحتوى' },
      tags: { en: 'Tags', ar: 'الوسوم' },
      major_tags: { en: 'Majors', ar: 'التخصصات' },
      university_tags: { en: 'Universities', ar: 'الجامعات' },
    };
    return labels[field]?.[language] ?? field;
  };

  const getFieldIcon = (field: string) => {
    switch (field) {
      case 'title':
        return <FileText className="h-3.5 w-3.5" />;
      case 'content':
        return <FileEdit className="h-3.5 w-3.5" />;
      default:
        return <RefreshCw className="h-3.5 w-3.5" />;
    }
  };

  const renderDiffContent = (version: ContentVersion) => {
    if (!version.diff) {
      return (
        <div className="flex items-center justify-center py-6 text-muted-foreground">
          <FileEdit className="h-5 w-5 mr-2 opacity-50" />
          <span className="text-sm italic">
            {language === 'ar' ? 'لا توجد تغييرات مسجلة' : 'No changes recorded'}
          </span>
        </div>
      );
    }

    const diff = version.diff as Record<string, unknown>;
    const changes: JSX.Element[] = [];

    Object.entries(diff).forEach(([field, change]) => {
      if (field === '_t') return;

      const fieldLabel = getFieldLabel(field);
      const fieldIcon = getFieldIcon(field);

      if (Array.isArray(change)) {
        if (change.length === 1) {
          // Added
          changes.push(
            <div key={field} className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1 rounded bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400">
                  <Plus className="h-3 w-3" />
                </div>
                <span className="font-medium text-sm text-foreground">{fieldLabel}</span>
                <Badge variant="outline" className="text-xs bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800">
                  {language === 'ar' ? 'مُضاف' : 'Added'}
                </Badge>
              </div>
              <div className="ml-6 p-3 rounded-lg border-l-4 border-green-500 bg-green-50/50 dark:bg-green-900/20 text-sm text-foreground">
                {typeof change[0] === 'string' ? change[0] : JSON.stringify(change[0])}
              </div>
            </div>
          );
        } else if (change.length === 2) {
          // Modified
          changes.push(
            <div key={field} className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1 rounded bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400">
                  {fieldIcon}
                </div>
                <span className="font-medium text-sm text-foreground">{fieldLabel}</span>
                <Badge variant="outline" className="text-xs bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800">
                  {language === 'ar' ? 'مُعدّل' : 'Modified'}
                </Badge>
              </div>
              <div className="ml-6 space-y-2">
                <div className="p-3 rounded-lg border-l-4 border-red-400 bg-red-50/50 dark:bg-red-900/20 text-sm">
                  <div className="flex items-start gap-2">
                    <Minus className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                    <span className="text-red-700 dark:text-red-300 line-through opacity-75">
                      {typeof change[0] === 'string' ? change[0] : JSON.stringify(change[0])}
                    </span>
                  </div>
                </div>
                <div className="p-3 rounded-lg border-l-4 border-green-500 bg-green-50/50 dark:bg-green-900/20 text-sm">
                  <div className="flex items-start gap-2">
                    <Plus className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                    <span className="text-green-700 dark:text-green-300">
                      {typeof change[1] === 'string' ? change[1] : JSON.stringify(change[1])}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        } else if (change.length === 3 && change[2] === 0) {
          // Deleted
          changes.push(
            <div key={field} className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1 rounded bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400">
                  <Minus className="h-3 w-3" />
                </div>
                <span className="font-medium text-sm text-foreground">{fieldLabel}</span>
                <Badge variant="outline" className="text-xs bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800">
                  {language === 'ar' ? 'محذوف' : 'Removed'}
                </Badge>
              </div>
              <div className="ml-6 p-3 rounded-lg border-l-4 border-red-400 bg-red-50/50 dark:bg-red-900/20 text-sm text-red-700 dark:text-red-300 line-through opacity-75">
                {typeof change[0] === 'string' ? change[0] : JSON.stringify(change[0])}
              </div>
            </div>
          );
        } else if (change.length === 3 && change[2] === 2) {
          // Text diff
          const diffHtml = formatDiffAsHtml({ [field]: change });
          changes.push(
            <div key={field} className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400">
                  {fieldIcon}
                </div>
                <span className="font-medium text-sm text-foreground">{fieldLabel}</span>
                <Badge variant="outline" className="text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800">
                  {language === 'ar' ? 'تم التعديل' : 'Text Changed'}
                </Badge>
              </div>
              <div
                className="ml-6 p-3 rounded-lg bg-muted/50 border text-sm overflow-x-auto"
                dangerouslySetInnerHTML={{ __html: diffHtml }}
              />
            </div>
          );
        }
      } else if (typeof change === 'object' && change !== null) {
        // Nested object changes (for arrays like tags)
        const nestedChanges = Object.entries(change as Record<string, unknown>)
          .filter(([k]) => k !== '_t')
          .map(([, v]) => {
            if (Array.isArray(v) && v.length === 1) return { type: 'add', value: v[0] };
            if (Array.isArray(v) && v.length === 3 && v[2] === 0) return { type: 'remove', value: v[0] };
            return null;
          })
          .filter(Boolean) as { type: string; value: string }[];

        if (nestedChanges.length > 0) {
          changes.push(
            <div key={field} className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1 rounded bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400">
                  <RefreshCw className="h-3 w-3" />
                </div>
                <span className="font-medium text-sm text-foreground">{fieldLabel}</span>
              </div>
              <div className="ml-6 flex flex-wrap gap-2">
                {nestedChanges.map((change, idx) => (
                  <div
                    key={idx}
                    className={`
                      inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium cursor-default
                      ${change.type === 'add'
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                        : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                      }
                    `}
                  >
                    {change.type === 'add' ? (
                      <Plus className="h-3 w-3" />
                    ) : (
                      <Minus className="h-3 w-3" />
                    )}
                    <span className={change.type === 'remove' ? 'line-through' : ''}>
                      {change.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        }
      }
    });

    if (changes.length === 0) {
      return (
        <div className="flex items-center justify-center py-6 text-muted-foreground">
          <FileEdit className="h-5 w-5 mr-2 opacity-50" />
          <span className="text-sm italic">
            {language === 'ar' ? 'لا توجد تغييرات مهمة' : 'No significant changes'}
          </span>
        </div>
      );
    }

    return <div className="space-y-1">{changes}</div>;
  };

  return (
    <>
      <style>{getDiffStyles()}</style>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[85vh] p-0 gap-0 overflow-hidden">
          {/* Header with gradient */}
          <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent dark:from-primary/20 dark:via-primary/10 p-6 border-b">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3 text-xl">
                <div className="p-2 rounded-lg bg-primary/10 dark:bg-primary/20">
                  <History className="h-5 w-5 text-primary" />
                </div>
                <div className="flex flex-col">
                  <span>{language === 'ar' ? 'سجل التعديلات' : 'Edit History'}</span>
                  {contentTitle && (
                    <span className="text-muted-foreground font-normal text-sm truncate max-w-[400px]">
                      {contentTitle}
                    </span>
                  )}
                </div>
              </DialogTitle>
            </DialogHeader>
            
            {/* Stats bar */}
            {!loading && versions.length > 0 && (
              <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <FileEdit className="h-4 w-4" />
                  <span>
                    {versions.length} {language === 'ar' ? 'تعديل' : versions.length === 1 ? 'revision' : 'revisions'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  <span>
                    {language === 'ar' ? 'آخر تعديل' : 'Last edit'}: {formatTimeAgo(versions[0].created_at, language)}
                  </span>
                </div>
              </div>
            )}
          </div>

          <ScrollArea className="max-h-[55vh] px-6 py-4">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="relative">
                  <div className="animate-spin rounded-full h-10 w-10 border-2 border-muted"></div>
                  <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-primary absolute top-0"></div>
                </div>
                <p className="mt-4 text-sm text-muted-foreground">
                  {language === 'ar' ? 'جاري التحميل...' : 'Loading history...'}
                </p>
              </div>
            ) : versions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="p-4 rounded-full bg-muted/50 mb-4">
                  <History className="h-10 w-10 text-muted-foreground/50" />
                </div>
                <h3 className="font-medium text-foreground mb-1">
                  {language === 'ar' ? 'لا يوجد سجل تعديلات' : 'No edit history'}
                </h3>
                <p className="text-sm text-muted-foreground max-w-[280px]">
                  {language === 'ar' 
                    ? 'لم يتم إجراء أي تعديلات على هذا المحتوى بعد'
                    : 'No edits have been made to this content yet'}
                </p>
              </div>
            ) : (
              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-[19px] top-8 bottom-8 w-0.5 bg-gradient-to-b from-primary/50 via-muted to-transparent" />
                
                <div className="space-y-4">
                  {versions.map((version, index) => (
                    <div key={version.id} className="relative">
                      {/* Timeline dot */}
                      <div className={`
                        absolute left-0 top-4 w-10 h-10 rounded-full border-2 flex items-center justify-center z-10
                        ${index === 0 
                          ? 'bg-primary border-primary text-primary-foreground' 
                          : 'bg-background border-muted-foreground/30 text-muted-foreground'
                        }
                      `}>
                        <span className="text-xs font-bold">v{version.version_number}</span>
                      </div>
                      
                      {/* Version card */}
                      <Card className={`ml-14 overflow-hidden transition-all duration-200 ${
                        expandedVersions.has(version.id) ? 'ring-2 ring-primary/20' : ''
                      }`}>
                        <button
                          className="w-full p-4 flex items-center justify-between hover:bg-muted/30 transition-colors text-left"
                          onClick={() => toggleVersion(version.id)}
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex flex-col">
                              <div className="flex items-center gap-2">
                                <User className="h-3.5 w-3.5 text-muted-foreground" />
                                <span className="font-medium text-sm text-foreground">
                                  {version.editor_name || 'Unknown'}
                                </span>
                                {index === 0 && (
                                  <Badge className="text-xs bg-primary/10 text-primary hover:bg-primary/10 border-0">
                                    {language === 'ar' ? 'الأحدث' : 'Latest'}
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                                <Clock className="h-3 w-3" />
                                <span title={formatFullDate(version.created_at, language)}>
                                  {formatTimeAgo(version.created_at, language)}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className={`p-1.5 rounded-full transition-transform duration-200 ${
                            expandedVersions.has(version.id) ? 'bg-primary/10 rotate-180' : 'bg-muted'
                          }`}>
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </button>

                        {expandedVersions.has(version.id) && (
                          <CardContent className="pt-0 pb-4 px-4 border-t bg-muted/20">
                            <div className="pt-4">
                              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
                                {language === 'ar' ? 'التغييرات' : 'Changes Made'}
                              </h4>
                              {renderDiffContent(version)}

                              {index === versions.length - 1 && (
                                <div className="mt-6 pt-4 border-t border-dashed">
                                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                                    <FileText className="h-3.5 w-3.5" />
                                    {language === 'ar' ? 'المحتوى الأصلي' : 'Original Content'}
                                  </h4>
                                  <div className="p-4 rounded-lg bg-background border-2 border-dashed text-sm">
                                    {'title' in version.previous_data && (
                                      <div className="mb-3 pb-3 border-b">
                                        <span className="text-xs uppercase tracking-wider text-muted-foreground">
                                          {language === 'ar' ? 'العنوان' : 'Title'}
                                        </span>
                                        <p className="mt-1 font-medium text-foreground">
                                          {version.previous_data.title}
                                        </p>
                                      </div>
                                    )}
                                    <div>
                                      <span className="text-xs uppercase tracking-wider text-muted-foreground">
                                        {language === 'ar' ? 'المحتوى' : 'Content'}
                                      </span>
                                      <p className="mt-1 whitespace-pre-wrap text-foreground">
                                        {version.previous_data.content}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        )}
                      </Card>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </ScrollArea>

          {/* Footer */}
          <div className="flex justify-end p-4 border-t bg-muted/30">
            <Button variant="outline" onClick={onClose} className="min-w-[100px]">
              {language === 'ar' ? 'إغلاق' : 'Close'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default EditHistoryViewer;
