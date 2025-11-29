import { supabase } from "./supabase";
import { create, clone, type Delta } from "jsondiffpatch";
import * as htmlFormatter from "jsondiffpatch/formatters/html";
import type {
  ContentVersion,
  VersionContentType,
  PostVersionData,
  AnswerVersionData,
} from "@/types/community";

// Create a jsondiffpatch instance with text diff support
const diffpatcher = create({
  // Use text diff for string properties
  textDiff: {
    minLength: 60, // Only use text diff for strings longer than 60 chars
  },
  objectHash: (obj: unknown) => {
    // For arrays of objects, use id as hash
    if (obj && typeof obj === "object" && "id" in obj) {
      return (obj as { id: string }).id;
    }
    return JSON.stringify(obj);
  },
});

/**
 * Compute diff between two objects using jsondiffpatch
 */
export function computeDiff<T>(oldData: T, newData: T): unknown {
  return diffpatcher.diff(oldData, newData);
}

/**
 * Apply a diff to reconstruct a version
 */
export function applyDiff<T>(data: T, delta: unknown): T {
  return diffpatcher.patch(clone(data), delta as Delta) as T;
}

/**
 * Reverse a diff to get the previous version
 */
export function reverseDiff<T>(data: T, delta: unknown): T {
  return diffpatcher.unpatch(clone(data), delta as Delta) as T;
}

/**
 * Format diff as HTML for visualization
 */
export function formatDiffAsHtml(delta: unknown): string {
  if (!delta) return "";
  return htmlFormatter.format(delta as Delta, undefined);
}

/**
 * Get CSS styles for diff visualization
 */
export function getDiffStyles(): string {
  return `
    .jsondiffpatch-delta {
      font-family: 'Source Code Pro', monospace;
      font-size: 0.875rem;
      margin: 0;
      padding: 0;
      display: inline-block;
    }
    .jsondiffpatch-delta pre {
      font-family: inherit;
      font-size: inherit;
      margin: 0;
      padding: 0;
      display: inline-block;
    }
    .jsondiffpatch-added .jsondiffpatch-property-name,
    .jsondiffpatch-added .jsondiffpatch-value pre,
    .jsondiffpatch-modified .jsondiffpatch-right-value pre,
    .jsondiffpatch-textdiff-added {
      background: #bbffbb;
      color: #006400;
    }
    .jsondiffpatch-deleted .jsondiffpatch-property-name,
    .jsondiffpatch-deleted .jsondiffpatch-value pre,
    .jsondiffpatch-modified .jsondiffpatch-left-value pre,
    .jsondiffpatch-textdiff-deleted {
      background: #ffbbbb;
      color: #8b0000;
      text-decoration: line-through;
    }
    .jsondiffpatch-unchanged {
      color: #888;
    }
    .jsondiffpatch-textdiff-location {
      color: #666;
      font-size: 0.75rem;
    }
    .jsondiffpatch-value {
      display: inline-block;
    }
    .jsondiffpatch-property-name {
      display: inline-block;
      padding-right: 0.5em;
      font-weight: 600;
    }
    .jsondiffpatch-modified,
    .jsondiffpatch-added,
    .jsondiffpatch-deleted {
      padding: 0.25em 0.5em;
      border-radius: 0.25em;
      margin: 0.125em 0;
    }
    .jsondiffpatch-arrow {
      display: none;
    }
    .jsondiffpatch-moved-destination {
      display: none;
    }
    .jsondiffpatch-moved-origin {
      display: none;
    }
    .dark .jsondiffpatch-added .jsondiffpatch-property-name,
    .dark .jsondiffpatch-added .jsondiffpatch-value pre,
    .dark .jsondiffpatch-modified .jsondiffpatch-right-value pre,
    .dark .jsondiffpatch-textdiff-added {
      background: #1a4d1a;
      color: #90ee90;
    }
    .dark .jsondiffpatch-deleted .jsondiffpatch-property-name,
    .dark .jsondiffpatch-deleted .jsondiffpatch-value pre,
    .dark .jsondiffpatch-modified .jsondiffpatch-left-value pre,
    .dark .jsondiffpatch-textdiff-deleted {
      background: #4d1a1a;
      color: #ffb6c1;
    }
    .dark .jsondiffpatch-unchanged {
      color: #888;
    }
  `;
}

/**
 * Save a content version before an update
 */
export async function saveContentVersion(
  contentType: VersionContentType,
  contentId: string,
  previousData: PostVersionData | AnswerVersionData,
  newData: PostVersionData | AnswerVersionData,
  editedBy: string,
  editorName: string
): Promise<void> {
  // Get the current max version number
  const { data: maxVersion } = await supabase
    .from("content_versions")
    .select("version_number")
    .eq("content_type", contentType)
    .eq("content_id", contentId)
    .order("version_number", { ascending: false })
    .limit(1)
    .single();

  const nextVersion = (maxVersion?.version_number ?? 0) + 1;

  // Compute the diff
  const diff = computeDiff(previousData, newData);

  // Save the version
  const { error } = await supabase.from("content_versions").insert({
    content_type: contentType,
    content_id: contentId,
    version_number: nextVersion,
    previous_data: previousData,
    diff: diff,
    edited_by: editedBy,
    editor_name: editorName,
  });

  if (error) {
    console.error("Error saving content version:", error);
    // Don't throw - versioning failure shouldn't block the update
  }
}

/**
 * Get version history for a piece of content
 */
export async function getContentVersionHistory(
  contentType: VersionContentType,
  contentId: string
): Promise<ContentVersion[]> {
  const { data, error } = await supabase
    .from("content_versions")
    .select("*")
    .eq("content_type", contentType)
    .eq("content_id", contentId)
    .order("version_number", { ascending: false });

  if (error) {
    console.error("Error fetching version history:", error);
    throw error;
  }

  return (data ?? []) as ContentVersion[];
}

/**
 * Get a specific version
 */
export async function getContentVersion(versionId: string): Promise<ContentVersion | null> {
  const { data, error } = await supabase
    .from("content_versions")
    .select("*")
    .eq("id", versionId)
    .single();

  if (error) {
    console.error("Error fetching version:", error);
    return null;
  }

  return data as ContentVersion;
}

/**
 * Check if content has been edited (has version history)
 */
export async function hasVersionHistory(
  contentType: VersionContentType,
  contentId: string
): Promise<boolean> {
  const { count, error } = await supabase
    .from("content_versions")
    .select("*", { count: "exact", head: true })
    .eq("content_type", contentType)
    .eq("content_id", contentId);

  if (error) {
    console.error("Error checking version history:", error);
    return false;
  }

  return (count ?? 0) > 0;
}

/**
 * Get the count of versions for content
 */
export async function getVersionCount(
  contentType: VersionContentType,
  contentId: string
): Promise<number> {
  const { count, error } = await supabase
    .from("content_versions")
    .select("*", { count: "exact", head: true })
    .eq("content_type", contentType)
    .eq("content_id", contentId);

  if (error) {
    console.error("Error getting version count:", error);
    return 0;
  }

  return count ?? 0;
}

