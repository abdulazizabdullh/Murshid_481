// Simple fuzzy search implementation for handling typos
export function fuzzySearch(query: string, text: string): number {
  if (!query || !text) return 0;
  
  query = query.toLowerCase();
  text = text.toLowerCase();
  
  // Exact match gets highest score
  if (text.includes(query)) return 1;
  
  // Calculate fuzzy match score
  let score = 0;
  let queryIndex = 0;
  
  for (let i = 0; i < text.length && queryIndex < query.length; i++) {
    if (text[i] === query[queryIndex]) {
      score++;
      queryIndex++;
    }
  }
  
  // Normalize score (percentage of query characters found in order)
  const fuzzyScore = score / query.length;
  
  // Bonus for starting with query
  if (text.startsWith(query)) {
    return Math.min(1, fuzzyScore + 0.3);
  }
  
  // Return fuzzy score (minimum threshold of 0.6 for reasonable matches)
  return fuzzyScore >= 0.6 ? fuzzyScore : 0;
}

export function searchWithFuzzy<T>(
  items: T[], 
  query: string, 
  getSearchText: (item: T) => string,
  limit: number = 5
): T[] {
  if (!query.trim()) return items.slice(0, limit);
  
  const results = items
    .map(item => ({
      item,
      score: fuzzySearch(query, getSearchText(item))
    }))
    .filter(result => result.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(result => result.item);
    
  return results;
}