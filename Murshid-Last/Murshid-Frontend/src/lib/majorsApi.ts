import { supabase } from "./supabase";
import type { 
  Major, 
  MajorWithUniversities, 
  MajorFilters 
} from "@/types/database";

// Fetch all majors with optional filters
export async function getMajors(filters?: MajorFilters): Promise<MajorWithUniversities[]> {
  let query = supabase
    .from('majors')
    .select(`
      *,
      university_majors(count)
    `)
    .eq('is_active', true)
    .order('name', { ascending: true });

  // Apply filters
  if (filters?.category) {
    query = query.eq('category', filters.category);
  }

  if (filters?.degree_type) {
    query = query.eq('degree_type', filters.degree_type);
  }

  if (filters?.search) {
    query = query.or(`name.ilike.%${filters.search}%,name_ar.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching majors:', error);
    throw error;
  }

  return data || [];
}

// Fetch a single major by ID with its universities
export async function getMajorById(id: string): Promise<MajorWithUniversities | null> {
  const { data, error } = await supabase
    .from('majors')
    .select(`
      *,
      university_majors!inner(
        *,
        university:universities(*)
      )
    `)
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching major:', error);
    throw error;
  }

  // Transform the data to include universities array
  if (data) {
    const universities = data.university_majors?.map((um: any) => um.university) || [];
    return {
      ...data,
      universities,
      university_count: universities.length
    };
  }

  return null;
}

// Create a new major (admin only)
export async function createMajor(major: Omit<Major, 'id' | 'created_at' | 'updated_at'>): Promise<Major> {
  const { data, error } = await supabase
    .from('majors')
    .insert([major])
    .select()
    .single();

  if (error) {
    console.error('Error creating major:', error);
    throw error;
  }

  return data;
}

// Update a major (admin only)
export async function updateMajor(id: string, updates: Partial<Major>): Promise<Major> {
  const { data, error } = await supabase
    .from('majors')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating major:', error);
    throw error;
  }

  return data;
}

// Delete a major (admin only)
export async function deleteMajor(id: string): Promise<void> {
  const { error } = await supabase
    .from('majors')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting major:', error);
    throw error;
  }
}

// Get universities offering a specific major
export async function getUniversitiesByMajor(majorId: string) {
  const { data, error } = await supabase
    .from('university_majors')
    .select(`
      *,
      university:universities(*)
    `)
    .eq('major_id', majorId)
    .eq('is_available', true);

  if (error) {
    console.error('Error fetching universities by major:', error);
    throw error;
  }

  return data?.map(item => item.university) || [];
}

// Get majors offered by a specific university
export async function getMajorsByUniversity(universityId: string) {
  const { data, error } = await supabase
    .from('university_majors')
    .select(`
      *,
      major:majors(*)
    `)
    .eq('university_id', universityId)
    ;

  if (error) {
    console.error('Error fetching majors by university:', error);
    throw error;
  }

  return data?.map(item => item.major) || [];
}

// Get count of majors for a specific university (all assignments)
export async function getMajorsCountByUniversity(universityId: string): Promise<number> {
  const { count, error } = await supabase
    .from('university_majors')
    .select('*', { count: 'exact', head: true })
    .eq('university_id', universityId);

  if (error) {
    console.error('Error counting majors by university:', error);
    throw error;
  }

  return count ?? 0;
}
