import { supabase } from "./supabase";
import type { Bookmark, BookmarkType } from "@/types/database";

// Get all bookmarks for the current user
export async function getUserBookmarks(userId: string): Promise<Bookmark[]> {
  const { data, error } = await supabase
    .from('bookmarks')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching bookmarks:', error);
    throw error;
  }

  return data || [];
}

// Check if an item is bookmarked
export async function isBookmarked(
  userId: string, 
  itemType: BookmarkType, 
  itemId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from('bookmarks')
    .select('id')
    .eq('user_id', userId)
    .eq('item_type', itemType)
    .eq('item_id', itemId)
    .maybeSingle();

  if (error) {
    console.error('Error checking bookmark:', error);
    return false;
  }

  return !!data;
}

// Add a bookmark
export async function addBookmark(
  userId: string,
  itemType: BookmarkType,
  itemId: string,
  notes?: string
): Promise<Bookmark> {
  const { data, error } = await supabase
    .from('bookmarks')
    .insert([{
      user_id: userId,
      item_type: itemType,
      item_id: itemId,
      notes
    }])
    .select()
    .single();

  if (error) {
    console.error('Error adding bookmark:', error);
    throw error;
  }

  return data;
}

// Remove a bookmark
export async function removeBookmark(
  userId: string,
  itemType: BookmarkType,
  itemId: string
): Promise<void> {
  const { error } = await supabase
    .from('bookmarks')
    .delete()
    .eq('user_id', userId)
    .eq('item_type', itemType)
    .eq('item_id', itemId);

  if (error) {
    console.error('Error removing bookmark:', error);
    throw error;
  }
}

// Toggle bookmark (add if not exists, remove if exists)
export async function toggleBookmark(
  userId: string,
  itemType: BookmarkType,
  itemId: string
): Promise<boolean> {
  const bookmarked = await isBookmarked(userId, itemType, itemId);

  if (bookmarked) {
    await removeBookmark(userId, itemType, itemId);
    return false;
  } else {
    await addBookmark(userId, itemType, itemId);
    return true;
  }
}

// Get bookmarked universities for a user
export async function getBookmarkedUniversities(userId: string) {
  // First, get the bookmarks
  const { data: bookmarks, error: bookmarksError } = await supabase
    .from('bookmarks')
    .select('item_id')
    .eq('user_id', userId)
    .eq('item_type', 'university');

  if (bookmarksError) {
    console.error('Error fetching bookmarked universities:', bookmarksError);
    throw bookmarksError;
  }

  if (!bookmarks || bookmarks.length === 0) {
    return [];
  }

  // Then fetch the actual universities
  const universityIds = bookmarks.map(b => b.item_id);
  const { data: universities, error: universitiesError } = await supabase
    .from('universities')
    .select('*')
    .in('id', universityIds);

  if (universitiesError) {
    console.error('Error fetching universities:', universitiesError);
    throw universitiesError;
  }

  return universities || [];
}

// Get bookmarked majors for a user
export async function getBookmarkedMajors(userId: string) {
  // First, get the bookmarks
  const { data: bookmarks, error: bookmarksError } = await supabase
    .from('bookmarks')
    .select('item_id')
    .eq('user_id', userId)
    .eq('item_type', 'major');

  if (bookmarksError) {
    console.error('Error fetching bookmarked majors:', bookmarksError);
    throw bookmarksError;
  }

  if (!bookmarks || bookmarks.length === 0) {
    return [];
  }

  // Then fetch the actual majors
  const majorIds = bookmarks.map(b => b.item_id);
  const { data: majors, error: majorsError } = await supabase
    .from('majors')
    .select('*')
    .in('id', majorIds);

  if (majorsError) {
    console.error('Error fetching majors:', majorsError);
    throw majorsError;
  }

  return majors || [];
}

