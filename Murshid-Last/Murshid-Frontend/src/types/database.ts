// Database Types for Universities and Majors

export type UniversityType = 'Public' | 'Private' | 'International';

export type MajorCategory = 
  | 'Engineering' 
  | 'Medicine' 
  | 'Business' 
  | 'Arts' 
  | 'Science' 
  | 'IT' 
  | 'Law' 
  | 'Education' 
  | 'Other';

export type DegreeType = 'Bachelor' | 'Master' | 'PhD' | 'Diploma';

export type BookmarkType = 'university' | 'major';

export interface University {
  id: string;
  name: string;
  name_ar?: string;
  description?: string;
  description_ar?: string;
  location?: string;
  location_ar?: string;
  city?: string;
  country?: string;
  website_url?: string;
  logo_url?: string;
  image_url?: string;
  establishment_year?: number;
  university_type?: UniversityType;
  ranking_national?: number;
  ranking_international?: number;
  student_count?: number;
  contact_email?: string;
  contact_phone?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface Major {
  id: string;
  name: string;
  name_ar?: string;
  description?: string;
  description_ar?: string;
  category: MajorCategory;
  degree_type?: DegreeType;
  duration_years?: number;
  career_prospects?: string;
  career_prospects_ar?: string;
  average_salary_range?: string;
  required_skills?: string[];
  related_fields?: string[];
  icon_name?: string;
  color?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface UniversityMajor {
  id: string;
  university_id: string;
  major_id: string;
  tuition_fee_annual?: number;
  currency?: string;
  admission_requirements?: string;
  admission_requirements_ar?: string;
  capacity?: number;
  is_available: boolean;
  program_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Bookmark {
  id: string;
  user_id: string;
  item_type: BookmarkType;
  item_id: string;
  notes?: string;
  created_at: string;
}

// Extended types with relations
export interface UniversityWithMajors extends University {
  majors?: Major[];
  major_count?: number;
}

export interface MajorWithUniversities extends Major {
  universities?: University[];
  university_count?: number;
}

export interface UniversityMajorWithDetails extends UniversityMajor {
  university?: University;
  major?: Major;
}

// Filter and search types
export interface UniversityFilters {
  city?: string;
  type?: UniversityType;
  search?: string;
}

export interface MajorFilters {
  category?: MajorCategory;
  degree_type?: DegreeType;
  search?: string;
}

