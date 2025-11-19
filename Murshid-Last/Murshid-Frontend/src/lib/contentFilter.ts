// Comprehensive profanity filter
class ProfanityFilter {
  private bannedWords: Set<string>;
  private arabicBannedWords: Set<string>;
  
  constructor() {
    // Comprehensive English profanity list
    this.bannedWords = new Set([
      // Profanity
      'fuck', 'shit', 'bitch', 'damn', 'hell', 'ass', 'bastard', 'crap', 'piss',
      'whore', 'slut', 'cock', 'dick', 'pussy', 'tits', 'boobs', 'sex', 'porn',
      'nude', 'naked', 'xxx', 'adult', 'escort', 'prostitute', 'hooker',
      
      // Hate speech
      'nigger', 'faggot', 'retard', 'gay', 'lesbian', 'homo', 'queer', 'tranny',
      'nazi', 'hitler', 'terrorist', 'jihad', 'isis', 'kill', 'murder', 'rape',
      'suicide', 'bomb', 'gun', 'weapon', 'violence', 'hate', 'racist',
      
      // Spam/Scam
      'scam', 'fraud', 'fake', 'cheat', 'hack', 'crack', 'pirate', 'illegal',
      'drugs', 'cocaine', 'heroin', 'marijuana', 'weed', 'cannabis', 'meth',
      'gambling', 'casino', 'bet', 'lottery', 'money', 'cash', 'bitcoin',
      
      // Harassment
      'harassment', 'bullying', 'threat', 'abuse', 'stalking', 'doxxing',
      'discrimination', 'offensive', 'inappropriate', 'vulgar', 'obscene'
    ]);
    
    // Arabic profanity and inappropriate words
    this.arabicBannedWords = new Set([
      // Profanity in Arabic
      'كس', 'زب', 'عرص', 'خرا', 'لعنة', 'جحش', 'حمار', 'كلب', 'قحبة', 'شرموطة',
      'منيوك', 'ابن الكلب', 'ابن الشرموطة', 'يا كلب', 'يا حمار', 'يا جحش',
      
      // Hate speech in Arabic
      'إرهابي', 'قتل', 'اقتل', 'موت', 'انتحار', 'قنبلة', 'سلاح', 'عنف', 'كراهية',
      'عنصري', 'تمييز', 'اغتصاب', 'جنس', 'إباحي', 'عاري', 'عارية', 'فاحش',
      
      // Scam/Fraud in Arabic
      'احتيال', 'خداع', 'نصب', 'غش', 'اختراق', 'قرصنة', 'غير قانوني', 'مخدرات',
      'كوكايين', 'هيروين', 'حشيش', 'مخدر', 'قمار', 'كازينو', 'رهان', 'يانصيب',
      
      // Harassment in Arabic
      'مضايقة', 'تنمر', 'تهديد', 'إساءة', 'ملاحقة', 'تحرش', 'مسيء', 'غير مناسب',
      'فاحش', 'بذيء', 'مبتذل', 'وقح'
    ]);
  }
  
  isProfane(text: string): boolean {
    const lowerText = text.toLowerCase();
    
    // Check English words
    for (const word of this.bannedWords) {
      if (lowerText.includes(word)) return true;
    }
    
    // Check Arabic words
    for (const word of this.arabicBannedWords) {
      if (text.includes(word)) return true;
    }
    
    return false;
  }
  
  getViolations(text: string): string[] {
    const violations: string[] = [];
    const lowerText = text.toLowerCase();
    
    // Check English words
    for (const word of this.bannedWords) {
      if (lowerText.includes(word)) {
        violations.push(word);
      }
    }
    
    // Check Arabic words
    for (const word of this.arabicBannedWords) {
      if (text.includes(word)) {
        violations.push(word);
      }
    }
    
    return violations;
  }
}

const profanityFilter = new ProfanityFilter();

const suspiciousPatterns = [
  /\b\d{10,}\b/g, // Phone numbers
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, // Email addresses
  /https?:\/\/[^\s]+/g, // URLs
  /(.)\1{4,}/g, // Repeated characters (spam-like)
];

export interface ContentAnalysis {
  isAllowed: boolean;
  issues: string[];
  severity: 'low' | 'medium' | 'high';
}

export function analyzeContent(text: string, language: 'ar' | 'en' = 'en'): ContentAnalysis {
  const issues: string[] = [];
  let severity: 'low' | 'medium' | 'high' = 'low';
  
  // Check for profanity using comprehensive filter
  if (profanityFilter.isProfane(text)) {
    const violations = profanityFilter.getViolations(text);
    issues.push(language === 'ar' ? 
      `يحتوي على كلمات غير مناسبة (${violations.length} مخالفة)` :
      `Contains inappropriate language (${violations.length} violations)`
    );
    severity = 'high';
  }
  
  // Check for suspicious patterns
  suspiciousPatterns.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) {
      if (pattern.source.includes('\\d{10,}')) {
        issues.push(language === 'ar' ? 
          'يحتوي على أرقام هواتف' : 
          'Contains phone numbers'
        );
      } else if (pattern.source.includes('@')) {
        issues.push(language === 'ar' ? 
          'يحتوي على عناوين بريد إلكتروني' : 
          'Contains email addresses'
        );
      } else if (pattern.source.includes('https?')) {
        issues.push(language === 'ar' ? 
          'يحتوي على روابط خارجية' : 
          'Contains external links'
        );
      } else if (pattern.source.includes('(.)\\1{4,}')) {
        issues.push(language === 'ar' ? 
          'يحتوي على أحرف متكررة (محتمل أن يكون سبام)' : 
          'Contains repeated characters (potential spam)'
        );
      }
      if (severity === 'low') severity = 'medium';
    }
  });
  
 
  
  // Check for excessive caps
  const capsRatio = (text.match(/[A-Z]/g) || []).length / text.length;
  if (capsRatio > 0.5 && text.length > 20) {
    issues.push(language === 'ar' ? 
      'استخدام مفرط للأحرف الكبيرة' : 
      'Excessive use of capital letters'
    );
    if (severity === 'low') severity = 'medium';
  }
  
  return {
    isAllowed: severity !== 'high',
    issues,
    severity
  };
}