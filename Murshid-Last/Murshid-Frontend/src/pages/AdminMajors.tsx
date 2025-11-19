import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import ImageUpload from '@/components/ImageUpload';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  BookOpen 
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  getMajors, 
  createMajor, 
  updateMajor, 
  deleteMajor 
} from '@/lib/majorsApi';
import type { Major, MajorCategory, DegreeType } from '@/types/database';
import { toast } from 'sonner';

export default function AdminMajors() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [majors, setMajors] = useState<Major[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMajor, setEditingMajor] = useState<Major | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    name_ar: '',
    description: '',
    description_ar: '',
    category: 'Other' as MajorCategory,
    degree_type: 'Bachelor' as DegreeType,
    duration_years: 4,
    career_prospects: '',
    career_prospects_ar: '',
    average_salary_range: '',
    icon_name: '📚',
    color: '#3b82f6',
  });

  useEffect(() => {
    // Don't check admin access while still loading
    if (authLoading) {
      return;
    }
    
    if (!user?.is_admin) {
      navigate('/');
      return;
    }
    fetchMajors();
  }, [user, authLoading, navigate]);

  const fetchMajors = async () => {
    try {
      setLoading(true);
      const data = await getMajors();
      setMajors(data);
    } catch (error) {
      console.error('Error fetching majors:', error);
      toast.error('Failed to load majors');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const majorData = {
        ...formData,
        is_active: true,
        created_by: user?.id,
      };

      if (editingMajor) {
        await updateMajor(editingMajor.id, majorData);
        toast.success('Major updated successfully');
      } else {
        await createMajor(majorData as any);
        toast.success('Major created successfully');
      }

      setDialogOpen(false);
      resetForm();
      fetchMajors();
    } catch (error) {
      console.error('Error saving major:', error);
      toast.error('Failed to save major');
    }
  };

  const handleEdit = (major: Major) => {
    setEditingMajor(major);
    setFormData({
      name: major.name,
      name_ar: major.name_ar || '',
      description: major.description || '',
      description_ar: major.description_ar || '',
      category: major.category,
      degree_type: major.degree_type || 'Bachelor',
      duration_years: major.duration_years || 4,
      career_prospects: major.career_prospects || '',
      career_prospects_ar: major.career_prospects_ar || '',
      average_salary_range: major.average_salary_range || '',
      icon_name: major.icon_name || '📚',
      color: major.color || '#3b82f6',
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this major?')) return;

    try {
      await deleteMajor(id);
      toast.success('Major deleted successfully');
      fetchMajors();
    } catch (error) {
      console.error('Error deleting major:', error);
      toast.error('Failed to delete major');
    }
  };

  const resetForm = () => {
    setEditingMajor(null);
    setFormData({
      name: '',
      name_ar: '',
      description: '',
      description_ar: '',
      category: 'Other',
      degree_type: 'Bachelor',
      duration_years: 4,
      career_prospects: '',
      career_prospects_ar: '',
      average_salary_range: '',
      icon_name: '📚',
      color: '#3b82f6',
    });
  };

  const filteredMajors = majors.filter(major =>
    major.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    major.name_ar?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    major.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const categories: MajorCategory[] = [
    'Engineering', 'Medicine', 'Business', 'IT', 'Science', 'Arts', 'Law', 'Education', 'Other'
  ];

  const degreeTypes: DegreeType[] = ['Bachelor', 'Master', 'PhD', 'Diploma'];

  return (
    <div className="admin-layout min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-10 pt-12 pb-20">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Manage Majors
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Add, edit, and manage academic majors in the system
            </p>
          </div>
          <Button
            onClick={() => {
              resetForm();
              setDialogOpen(true);
            }}
            id="admin-majors-add-button"
            className="bg-blue-500 hover:bg-blue-600 text-white rounded-2xl px-8 py-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Major
          </Button>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              id="admin-majors-search-input"
              type="text"
              placeholder="Search majors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Majors List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMajors.map((major) => (
            <Card key={major.id} className="p-6 h-65 flex flex-col">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center text-2xl">
                    {major.icon_name || '📚'}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                      {major.name}
                    </h3>
                    {major.name_ar && (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {major.name_ar}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-2 mb-4 text-sm flex-1">
                <p className="text-gray-600 dark:text-gray-400">
                  📁 {major.category}
                </p>
                {major.degree_type && (
                  <p className="text-gray-600 dark:text-gray-400">
                    🎓 {major.degree_type}
                  </p>
                )}
                {major.duration_years && (
                  <p className="text-gray-600 dark:text-gray-400">
                    ⏱️ {major.duration_years} years
                  </p>
                )}
              </div>

              <div className="flex gap-2 mt-auto">
                <Button
                  onClick={() => handleEdit(major)}
                  id={`admin-majors-edit-${major.id}`}
                  variant="outline"
                  size="sm"
                  className="flex-1 rounded-xl border-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                >
                  <Edit className="w-4 h-4 mr-1" />
                  Edit
                </Button>
                <Button
                  onClick={() => handleDelete(major.id)}
                  id={`admin-majors-delete-${major.id}`}
                  variant="destructive"
                  size="sm"
                  className="flex-1 rounded-xl transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {filteredMajors.length === 0 && (
          <div className="text-center py-20">
            <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">No majors found</p>
          </div>
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingMajor ? 'Edit Major' : 'Add New Major'}
            </DialogTitle>
            <DialogDescription>
              Fill in the information below to {editingMajor ? 'update' : 'create'} a major
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Icon/Image Upload */}
            <div>
              <Label>Major Icon/Image (Optional)</Label>
              <ImageUpload
                currentImage={formData.icon_name?.startsWith('http') ? formData.icon_name : ''}
                onImageUpload={(url) => setFormData({ ...formData, icon_name: url })}
                bucket="major-icons"
                path={editingMajor?.id || `temp-${Date.now()}`}
                label="Upload Icon/Image"
                maxSizeMB={1}
              />
              <p className="text-xs text-gray-500 mt-2">
                Alternatively, you can use an emoji in the "Icon/Emoji" field below
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Name (English)*</Label>
                <Input
                  id="admin-majors-form-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="admin-majors-form-name-ar">Name (Arabic)</Label>
                <Input
                  id="admin-majors-form-name-ar"
                  value={formData.name_ar}
                  onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
                  dir="rtl"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="admin-majors-form-description">Description (English)</Label>
              <Textarea
                id="admin-majors-form-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="admin-majors-form-description-ar">Description (Arabic)</Label>
              <Textarea
                id="admin-majors-form-description-ar"
                value={formData.description_ar}
                onChange={(e) => setFormData({ ...formData, description_ar: e.target.value })}
                rows={3}
                dir="rtl"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="admin-majors-form-category">Category*</Label>
                <Select 
                  value={formData.category} 
                  onValueChange={(value: MajorCategory) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger id="admin-majors-form-category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="admin-majors-form-degree-type">Degree Type</Label>
                <Select 
                  value={formData.degree_type} 
                  onValueChange={(value: DegreeType) => setFormData({ ...formData, degree_type: value })}
                >
                  <SelectTrigger id="admin-majors-form-degree-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {degreeTypes.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="admin-majors-form-duration">Duration (years)</Label>
                <Input
                  id="admin-majors-form-duration"
                  type="number"
                  step="0.5"
                  value={formData.duration_years}
                  onChange={(e) => setFormData({ ...formData, duration_years: parseFloat(e.target.value) })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="admin-majors-form-icon">Icon/Emoji</Label>
                <Input
                  id="admin-majors-form-icon"
                  value={formData.icon_name}
                  onChange={(e) => setFormData({ ...formData, icon_name: e.target.value })}
                  placeholder="📚"
                />
              </div>
              <div>
                <Label htmlFor="admin-majors-form-salary">Average Salary Range</Label>
                <Input
                  id="admin-majors-form-salary"
                  value={formData.average_salary_range}
                  onChange={(e) => setFormData({ ...formData, average_salary_range: e.target.value })}
                  placeholder="e.g., 8,000 - 15,000 SAR"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="admin-majors-form-career-prospects">Career Prospects (English)</Label>
              <Textarea
                id="admin-majors-form-career-prospects"
                value={formData.career_prospects}
                onChange={(e) => setFormData({ ...formData, career_prospects: e.target.value })}
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="admin-majors-form-career-prospects-ar">Career Prospects (Arabic)</Label>
              <Textarea
                id="admin-majors-form-career-prospects-ar"
                value={formData.career_prospects_ar}
                onChange={(e) => setFormData({ ...formData, career_prospects_ar: e.target.value })}
                rows={2}
                dir="rtl"
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                id="admin-majors-form-cancel-button"
                variant="outline"
                className="rounded-2xl px-6 py-3 border-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                onClick={() => {
                  setDialogOpen(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button type="submit" id="admin-majors-form-submit-button" className="bg-blue-500 hover:bg-blue-600 text-white rounded-2xl px-6 py-3 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                {editingMajor ? 'Update' : 'Create'} Major
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

