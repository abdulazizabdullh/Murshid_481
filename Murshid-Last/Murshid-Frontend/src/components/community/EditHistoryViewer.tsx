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
import { Separator } from '@/components/ui/separator';
import { History, ChevronDown, ChevronUp, User, Clock } from 'lucide-react';
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
      major_tags: { en: 'Major Tags', ar: 'تخصصات' },
      university_tags: { en: 'University Tags', ar: 'جامعات' },
    };
    return labels[field]?.[language] ?? field;
  };

  const renderDiffContent = (version: ContentVersion) => {
    if (!version.diff) {
      return (
        <p className="text-muted-foreground text-sm italic">
          {language === 'ar' ? 'لا توجد تغييرات مسجلة' : 'No changes recorded'}
        </p>
      );
    }

    // Render a simplified diff view
    const diff = version.diff as Record<string, unknown>;
    const changes: JSX.Element[] = [];

    Object.entries(diff).forEach(([field, change]) => {
      if (field === '_t') return; // Skip array type marker

      const fieldLabel = getFieldLabel(field);

      if (Array.isArray(change)) {
        // Added, modified, or deleted
        if (change.length === 1) {
          // Added
          changes.push(
            <div key={field} className="mb-3">
              <span className="font-medium text-sm">{fieldLabel}:</span>
              <div className="mt-1 p-2 rounded bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 text-sm">
                <span className="text-xs opacity-70">+ </span>
                {typeof change[0] === 'string' ? change[0] : JSON.stringify(change[0])}
              </div>
            </div>
          );
        } else if (change.length === 2) {
          // Modified
          changes.push(
            <div key={field} className="mb-3">
              <span className="font-medium text-sm">{fieldLabel}:</span>
              <div className="mt-1 space-y-1">
                <div className="p-2 rounded bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 text-sm line-through">
                  <span className="text-xs opacity-70">- </span>
                  {typeof change[0] === 'string' ? change[0] : JSON.stringify(change[0])}
                </div>
                <div className="p-2 rounded bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 text-sm">
                  <span className="text-xs opacity-70">+ </span>
                  {typeof change[1] === 'string' ? change[1] : JSON.stringify(change[1])}
                </div>
              </div>
            </div>
          );
        } else if (change.length === 3 && change[2] === 0) {
          // Deleted
          changes.push(
            <div key={field} className="mb-3">
              <span className="font-medium text-sm">{fieldLabel}:</span>
              <div className="mt-1 p-2 rounded bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 text-sm line-through">
                <span className="text-xs opacity-70">- </span>
                {typeof change[0] === 'string' ? change[0] : JSON.stringify(change[0])}
              </div>
            </div>
          );
        } else if (change.length === 3 && change[2] === 2) {
          // Text diff
          const diffHtml = formatDiffAsHtml({ [field]: change });
          changes.push(
            <div key={field} className="mb-3">
              <span className="font-medium text-sm">{fieldLabel}:</span>
              <div
                className="mt-1 p-2 rounded bg-muted text-sm overflow-x-auto"
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
            if (Array.isArray(v) && v.length === 1) return `+${v[0]}`;
            if (Array.isArray(v) && v.length === 3 && v[2] === 0) return `-${v[0]}`;
            return null;
          })
          .filter(Boolean);

        if (nestedChanges.length > 0) {
          changes.push(
            <div key={field} className="mb-3">
              <span className="font-medium text-sm">{fieldLabel}:</span>
              <div className="mt-1 flex flex-wrap gap-1">
                {nestedChanges.map((change, idx) => (
                  <Badge
                    key={idx}
                    variant={change?.startsWith('+') ? 'default' : 'destructive'}
                    className={
                      change?.startsWith('+')
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200 hover:bg-green-100 dark:hover:bg-green-900/30 cursor-default'
                        : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200 line-through hover:bg-red-100 dark:hover:bg-red-900/30 cursor-default'
                    }
                  >
                    {change}
                  </Badge>
                ))}
              </div>
            </div>
          );
        }
      }
    });

    if (changes.length === 0) {
      return (
        <p className="text-muted-foreground text-sm italic">
          {language === 'ar' ? 'لا توجد تغييرات مهمة' : 'No significant changes'}
        </p>
      );
    }

    return <div>{changes}</div>;
  };

  return (
    <>
      <style>{getDiffStyles()}</style>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              {language === 'ar' ? 'سجل التعديلات' : 'Edit History'}
              {contentTitle && (
                <span className="text-muted-foreground font-normal text-sm truncate max-w-[300px]">
                  - {contentTitle}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>

          <ScrollArea className="max-h-[60vh] pr-4">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : versions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <History className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>
                  {language === 'ar'
                    ? 'لا يوجد سجل تعديلات'
                    : 'No edit history available'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {versions.map((version, index) => (
                  <div
                    key={version.id}
                    className="border rounded-lg overflow-hidden"
                  >
                    <Button
                      variant="ghost"
                      className="w-full justify-between p-4 h-auto hover:bg-muted/50 text-foreground hover:text-foreground"
                      onClick={() => toggleVersion(version.id)}
                    >
                      <div className="flex items-center gap-3 text-left">
                        <Badge variant="outline" className="shrink-0">
                          v{version.version_number}
                        </Badge>
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-2 text-sm text-foreground">
                            <User className="h-3.5 w-3.5 text-muted-foreground" />
                            <span>{version.editor_name || 'Unknown'}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span title={formatFullDate(version.created_at, language)}>
                              {formatTimeAgo(version.created_at, language)}
                            </span>
                          </div>
                        </div>
                      </div>
                      {expandedVersions.has(version.id) ? (
                        <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                      )}
                    </Button>

                    {expandedVersions.has(version.id) && (
                      <>
                        <Separator />
                        <div className="p-4 bg-muted/30">
                          <h4 className="text-sm font-medium mb-3">
                            {language === 'ar' ? 'التغييرات:' : 'Changes:'}
                          </h4>
                          {renderDiffContent(version)}

                          {index === versions.length - 1 && (
                            <div className="mt-4 pt-3 border-t">
                              <h4 className="text-sm font-medium mb-2">
                                {language === 'ar'
                                  ? 'المحتوى الأصلي:'
                                  : 'Original content:'}
                              </h4>
                              <div className="p-3 rounded bg-background border text-sm">
                                {'title' in version.previous_data && (
                                  <div className="mb-2">
                                    <span className="font-medium">
                                      {language === 'ar' ? 'العنوان: ' : 'Title: '}
                                    </span>
                                    {version.previous_data.title}
                                  </div>
                                )}
                                <div className="whitespace-pre-wrap">
                                  {version.previous_data.content}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          <div className="flex justify-end pt-2">
            <Button variant="outline" onClick={onClose}>
              {language === 'ar' ? 'إغلاق' : 'Close'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default EditHistoryViewer;

