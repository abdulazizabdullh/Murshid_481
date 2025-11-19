import { supabase } from './supabase';

// Cache for university and major translations
const translationCache = new Map<string, { en: string; ar: string }>();

// Function to fetch universities and build cache
async function buildUniversityCache() {
  const { data } = await supabase
    .from('universities')
    .select('name, name_ar');
  
  if (data) {
    data.forEach(item => {
      if (item.name && item.name_ar) {
        translationCache.set(item.name.toLowerCase(), { en: item.name, ar: item.name_ar });
        translationCache.set(item.name_ar.toLowerCase(), { en: item.name, ar: item.name_ar });
      }
    });
  }
}

// Function to fetch majors and build cache
async function buildMajorCache() {
  const { data } = await supabase
    .from('majors')
    .select('name, name_ar');
  
  if (data) {
    data.forEach(item => {
      if (item.name && item.name_ar) {
        translationCache.set(item.name.toLowerCase(), { en: item.name, ar: item.name_ar });
        translationCache.set(item.name_ar.toLowerCase(), { en: item.name, ar: item.name_ar });
      }
    });
  }
}

// Initialize cache
let cacheInitialized = false;
async function initializeCache() {
  if (!cacheInitialized) {
    await Promise.all([buildUniversityCache(), buildMajorCache()]);
    cacheInitialized = true;
  }
}

/**
 * Translates a tag name to the target language
 * @param tagName - The tag name to translate
 * @param targetLanguage - The target language ('en' or 'ar')
 * @returns The translated tag name, or original if translation not found
 */
export async function translateTag(tagName: string, targetLanguage: 'en' | 'ar'): Promise<string> {
  if (!tagName) return tagName;
  
  // Initialize cache if not done yet
  await initializeCache();
  
  // Look up in cache
  const cached = translationCache.get(tagName.toLowerCase());
  if (cached) {
    return cached[targetLanguage];
  }
  
  // If not found, return original
  return tagName;
}

/**
 * Translates an array of tag names to the target language
 * @param tags - Array of tag names to translate
 * @param targetLanguage - The target language ('en' or 'ar')
 * @returns Array of translated tag names
 */
export async function translateTags(tags: string[], targetLanguage: 'en' | 'ar'): Promise<string[]> {
  if (!tags || tags.length === 0) return tags;
  
  // Initialize cache if not done yet
  await initializeCache();
  
  return tags.map(tag => {
    const cached = translationCache.get(tag.toLowerCase());
    return cached ? cached[targetLanguage] : tag;
  });
}

/**
 * Synchronous version for use in components (requires cache to be initialized)
 * @param tagName - The tag name to translate
 * @param targetLanguage - The target language ('en' or 'ar')
 * @returns The translated tag name, or original if translation not found
 */
export function translateTagSync(tagName: string, targetLanguage: 'en' | 'ar'): string {
  if (!tagName) return tagName;
  
  const cached = translationCache.get(tagName.toLowerCase());
  return cached ? cached[targetLanguage] : tagName;
}

/**
 * Synchronous version for arrays
 * @param tags - Array of tag names to translate
 * @param targetLanguage - The target language ('en' or 'ar')
 * @returns Array of translated tag names
 */
export function translateTagsSync(tags: string[], targetLanguage: 'en' | 'ar'): string[] {
  if (!tags || tags.length === 0) return tags;
  
  return tags.map(tag => translateTagSync(tag, targetLanguage));
}

// Export function to manually initialize cache (can be called in App.tsx)
export { initializeCache };
