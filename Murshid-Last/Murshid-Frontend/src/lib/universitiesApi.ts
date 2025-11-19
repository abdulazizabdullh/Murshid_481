import { supabase } from "./supabase";
import type { 
  University, 
  UniversityWithMajors, 
  UniversityFilters 
} from "@/types/database";

// Fetch all universities with optional filters
export async function getUniversities(filters?: UniversityFilters): Promise<UniversityWithMajors[]> {
  let query = supabase
    .from('universities')
    .select(`
      *,
      university_majors!inner(count)
    `)
    .eq('is_active', true)
    .order('name', { ascending: true });

  // Apply filters
  if (filters?.city) {
    query = query.eq('city', filters.city);
  }

  if (filters?.type) {
    query = query.eq('university_type', filters.type);
  }

  if (filters?.search) {
    query = query.or(`name.ilike.%${filters.search}%,name_ar.ilike.%${filters.search}%,city.ilike.%${filters.search}%`);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching universities:', error);
    throw error;
  }

  // Map relationship count into a flat major_count number
  const mapped = (data || []).map((row: any) => {
    let majorCount = 0;
    const rel = (row as any)?.university_majors;
    if (Array.isArray(rel) && rel.length > 0 && typeof rel[0]?.count === 'number') {
      majorCount = rel[0].count as number;
    }
    return { ...row, major_count: majorCount } as UniversityWithMajors;
  });

  return mapped;
}

// Fetch a single university by ID with its majors
export async function getUniversityById(id: string): Promise<UniversityWithMajors | null> {
  const { data, error } = await supabase
    .from('universities')
    .select(`
      *,
      university_majors(
        *,
        major:majors(*)
      )
    `)
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching university:', error);
    throw error;
  }

  // Transform the data to include majors array
  if (data) {
    const majors = data.university_majors?.map((um: any) => um.major) || [];
    return {
      ...data,
      majors,
      major_count: majors.length
    };
  }

  return null;
}

// Create a new university (admin only)
export async function createUniversity(university: Omit<University, 'id' | 'created_at' | 'updated_at'>): Promise<University> {
  const { data, error } = await supabase
    .from('universities')
    .insert([university])
    .select()
    .single();

  if (error) {
    console.error('Error creating university:', error);
    throw error;
  }

  return data;
}

// Update a university (admin only)
export async function updateUniversity(id: string, updates: Partial<University>): Promise<University> {
  const { data, error } = await supabase
    .from('universities')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating university:', error);
    throw error;
  }

  return data;
}

// Delete a university (admin only)
export async function deleteUniversity(id: string): Promise<void> {
  const { error } = await supabase
    .from('universities')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting university:', error);
    throw error;
  }
}

// Get unique cities for filter dropdown
export async function getUniversityCities(): Promise<string[]> {
  const { data, error } = await supabase
    .from('universities')
    .select('city')
    .eq('is_active', true)
    .not('city', 'is', null);

  if (error) {
    console.error('Error fetching cities:', error);
    throw error;
  }

  const cities = [...new Set(data.map(item => item.city).filter(Boolean))] as string[];
  return cities.sort();
}

// Assign a major to a university
export async function assignMajorToUniversity(
  universityId: string,
  majorId: string,
  details?: {
    tuition_fee_annual?: number;
    admission_requirements?: string;
    admission_requirements_ar?: string;
    capacity?: number;
    program_url?: string;
  }
): Promise<void> {
  const { error } = await supabase
    .from('university_majors')
    .insert([{
      university_id: universityId,
      major_id: majorId,
      ...details
    }]);

  if (error) {
    console.error('Error assigning major to university:', error);
    throw error;
  }
}

// Remove a major from a university
export async function removeMajorFromUniversity(universityId: string, majorId: string): Promise<void> {
  const { error } = await supabase
    .from('university_majors')
    .delete()
    .eq('university_id', universityId)
    .eq('major_id', majorId);

  if (error) {
    console.error('Error removing major from university:', error);
    throw error;
  }
}

