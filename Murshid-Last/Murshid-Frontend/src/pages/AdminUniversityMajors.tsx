import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Plus, Trash2, Link as LinkIcon, Search } from 'lucide-react';
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
import { getUniversities } from '@/lib/universitiesApi';
import { getMajors, getMajorsByUniversity } from '@/lib/majorsApi';
import { assignMajorToUniversity, removeMajorFromUniversity } from '@/lib/universitiesApi';
import type { University, Major } from '@/types/database';
import { toast } from 'sonner';

export default function AdminUniversityMajors() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [universities, setUniversities] = useState<University[]>([]);
  const [allMajors, setAllMajors] = useState<Major[]>([]);
  const [selectedUniversity, setSelectedUniversity] = useState<string>('');
  const [universityMajors, setUniversityMajors] = useState<Major[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    major_id: '',
    tuition_fee_annual: 0,
    admission_requirements: '',
    admission_requirements_ar: '',
    capacity: 0,
    program_url: '',
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
    fetchData();
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (selectedUniversity) {
      fetchUniversityMajors();
    }
  }, [selectedUniversity]);

  const fetchData = async () => {
    try {
      const [universitiesData, majorsData] = await Promise.all([
        getUniversities(),
        getMajors()
      ]);
      setUniversities(universitiesData);
      setAllMajors(majorsData);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    }
  };

  const fetchUniversityMajors = async () => {
    if (!selectedUniversity) return;
    
    try {
      const majors = await getMajorsByUniversity(selectedUniversity);
      setUniversityMajors(majors);
    } catch (error) {
      console.error('Error fetching university majors:', error);
      toast.error('Failed to load university majors');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedUniversity || !formData.major_id) {
      toast.error('Please select a university and major');
      return;
    }

    try {
      await assignMajorToUniversity(selectedUniversity, formData.major_id, {
        tuition_fee_annual: formData.tuition_fee_annual,
        admission_requirements: formData.admission_requirements,
        admission_requirements_ar: formData.admission_requirements_ar,
        capacity: formData.capacity,
        program_url: formData.program_url,
      } as any);

      toast.success('Major assigned to university successfully');
      setDialogOpen(false);
      resetForm();
      fetchUniversityMajors();
    } catch (error) {
      console.error('Error assigning major:', error);
      toast.error('Failed to assign major. It may already be assigned to this university.');
    }
  };

  const handleRemove = async (majorId: string) => {
    if (!selectedUniversity) return;
    if (!confirm('Are you sure you want to remove this major from the university?')) return;

    try {
      await removeMajorFromUniversity(selectedUniversity, majorId);
      toast.success('Major removed from university successfully');
      fetchUniversityMajors();
    } catch (error) {
      console.error('Error removing major:', error);
      toast.error('Failed to remove major');
    }
  };

  const resetForm = () => {
    setFormData({
      major_id: '',
      tuition_fee_annual: 0,
      admission_requirements: '',
      admission_requirements_ar: '',
      capacity: 0,
      program_url: '',
    });
  };

  const selectedUniversityData = universities.find(u => u.id === selectedUniversity);
  const availableMajors = allMajors.filter(
    major => !universityMajors.find(um => um.id === major.id)
  );

  return (
    <div className="admin-layout min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-10 pt-12 pb-20">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Assign Majors to Universities
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Manage which majors are offered by each university
          </p>
        </div>

        {/* University Selector */}
        <Card className="p-6 mb-8">
          <Label htmlFor="university" className="text-lg font-semibold mb-4 block">
            Select University
          </Label>
          <Select value={selectedUniversity} onValueChange={setSelectedUniversity}>
            <SelectTrigger id="admin-university-majors-university-select" className="w-full">
              <SelectValue placeholder="Choose a university..." />
            </SelectTrigger>
            <SelectContent>
              {universities.map(uni => (
                <SelectItem key={uni.id} value={uni.id}>
                  {uni.name} {uni.name_ar && `(${uni.name_ar})`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Card>

        {/* Majors List */}
        {selectedUniversity && (
          <>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  Majors at {selectedUniversityData?.name}
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  {universityMajors.length} majors currently offered
                </p>
              </div>
              <Button
                onClick={() => setDialogOpen(true)}
                id="admin-university-majors-assign-button"
                className="bg-blue-500 hover:bg-blue-600"
                disabled={availableMajors.length === 0}
              >
                <Plus className="w-4 h-4 mr-2" />
                Assign Major
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {universityMajors.map((major) => (
                <Card key={major.id} className="p-6">
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

                  <div className="space-y-2 mb-4 text-sm">
                    <p className="text-gray-600 dark:text-gray-400">
                      📁 {major.category}
                    </p>
                    {major.degree_type && (
                      <p className="text-gray-600 dark:text-gray-400">
                        🎓 {major.degree_type}
                      </p>
                    )}
                  </div>

                  <Button
                    onClick={() => handleRemove(major.id)}
                    id={`admin-university-majors-remove-${major.id}`}
                    variant="destructive"
                    size="sm"
                    className="w-full"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Remove
                  </Button>
                </Card>
              ))}
            </div>

            {universityMajors.length === 0 && (
              <div className="text-center py-20">
                <LinkIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">
                  No majors assigned to this university yet
                </p>
              </div>
            )}
          </>
        )}

        {!selectedUniversity && (
          <div className="text-center py-20">
            <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              Please select a university to view and manage its majors
            </p>
          </div>
        )}
      </div>

      {/* Assign Major Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Assign Major to {selectedUniversityData?.name}</DialogTitle>
            <DialogDescription>
              Select a major and provide program details
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="admin-university-majors-form-major">Major*</Label>
              <Select 
                value={formData.major_id} 
                onValueChange={(value) => setFormData({ ...formData, major_id: value })}
              >
                <SelectTrigger id="admin-university-majors-form-major">
                  <SelectValue placeholder="Select a major..." />
                </SelectTrigger>
                <SelectContent>
                  {availableMajors.map(major => (
                    <SelectItem key={major.id} value={major.id}>
                      {major.name} {major.name_ar && `(${major.name_ar})`} - {major.category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="admin-university-majors-form-tuition">Annual Tuition Fee (SAR)</Label>
                <Input
                  id="admin-university-majors-form-tuition"
                  type="number"
                  value={formData.tuition_fee_annual}
                  onChange={(e) => setFormData({ ...formData, tuition_fee_annual: parseFloat(e.target.value) })}
                  placeholder="0"
                />
              </div>
              <div>
                <Label htmlFor="admin-university-majors-form-capacity">Student Capacity</Label>
                <Input
                  id="admin-university-majors-form-capacity"
                  type="number"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
                  placeholder="0"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="admin-university-majors-form-program-url">Program URL</Label>
              <Input
                id="admin-university-majors-form-program-url"
                type="url"
                value={formData.program_url}
                onChange={(e) => setFormData({ ...formData, program_url: e.target.value })}
                placeholder="https://..."
              />
            </div>

            <div>
              <Label htmlFor="admin-university-majors-form-admission-requirements">Admission Requirements (English)</Label>
              <Textarea
                id="admin-university-majors-form-admission-requirements"
                value={formData.admission_requirements}
                onChange={(e) => setFormData({ ...formData, admission_requirements: e.target.value })}
                rows={3}
                placeholder="Enter admission requirements..."
              />
            </div>

            <div>
              <Label htmlFor="admin-university-majors-form-admission-requirements-ar">Admission Requirements (Arabic)</Label>
              <Textarea
                id="admin-university-majors-form-admission-requirements-ar"
                value={formData.admission_requirements_ar}
                onChange={(e) => setFormData({ ...formData, admission_requirements_ar: e.target.value })}
                rows={3}
                dir="rtl"
                placeholder="أدخل متطلبات القبول..."
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                id="admin-university-majors-form-cancel-button"
                variant="outline"
                onClick={() => {
                  setDialogOpen(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button type="submit" id="admin-university-majors-form-submit-button" className="bg-blue-500 hover:bg-blue-600">
                Assign Major
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

