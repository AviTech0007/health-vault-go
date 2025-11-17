import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { FileText, LogOut, Upload, User, Search } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface Profile {
  full_name: string;
  email: string;
}

interface Patient {
  id: string;
  full_name: string;
  email: string;
}

const DoctorDashboard = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [notes, setNotes] = useState("");
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkAuthAndFetchData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      const { data: userProfile } = await supabase
        .from("profiles")
        .select("role, full_name, email")
        .eq("id", session.user.id)
        .single();

      if (userProfile?.role !== "doctor") {
        navigate("/patient");
        return;
      }

      setProfile({ full_name: userProfile.full_name, email: userProfile.email });

      const { data: patientsData } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .eq("role", "patient")
        .order("full_name");

      setPatients(patientsData || []);
      setLoading(false);
    };

    checkAuthAndFetchData();
  }, [navigate]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file || !selectedPatient) {
      toast({
        title: "Error",
        description: "Please select a patient and file",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = fileName;

      const { error: uploadError } = await supabase.storage
        .from("medical-files")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("medical-files")
        .getPublicUrl(filePath);

      const { error: recordError } = await supabase
        .from("medical_records")
        .insert({
          patient_id: selectedPatient,
          doctor_id: session.user.id,
          file_name: file.name,
          file_url: filePath,
          file_type: file.type,
          notes: notes || null,
        });

      if (recordError) throw recordError;

      toast({
        title: "Success",
        description: "Medical record uploaded successfully",
      });

      setFile(null);
      setNotes("");
      setSelectedPatient("");
      (e.target as HTMLFormElement).reset();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const filteredPatients = patients.filter(
    (patient) =>
      patient.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">MedRecords</h1>
              <p className="text-sm text-muted-foreground">Doctor Portal</p>
            </div>
          </div>
          <Button onClick={handleSignOut} variant="outline" size="sm">
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center gap-4">
              <Avatar className="w-16 h-16">
                <AvatarFallback className="bg-accent text-accent-foreground text-xl">
                  {profile?.full_name?.charAt(0) || "D"}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-2xl">Dr. {profile?.full_name}</CardTitle>
                <CardDescription className="flex items-center gap-2 mt-1">
                  <User className="w-4 h-4" />
                  {profile?.email}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upload Medical Record</CardTitle>
            <CardDescription>
              Upload medical documents for your patients
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpload} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="patient-search">Select Patient</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="patient-search"
                    placeholder="Search patients by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="border rounded-lg max-h-48 overflow-y-auto">
                  {filteredPatients.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground">
                      No patients found
                    </div>
                  ) : (
                    <div className="divide-y">
                      {filteredPatients.map((patient) => (
                        <button
                          key={patient.id}
                          type="button"
                          onClick={() => setSelectedPatient(patient.id)}
                          className={`w-full p-3 text-left hover:bg-accent transition-colors ${
                            selectedPatient === patient.id ? "bg-accent" : ""
                          }`}
                        >
                          <p className="font-medium text-foreground">{patient.full_name}</p>
                          <p className="text-sm text-muted-foreground">{patient.email}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="file">Medical File</Label>
                <Input
                  id="file"
                  type="file"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  required
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                />
                <p className="text-xs text-muted-foreground">
                  Accepted formats: PDF, DOC, DOCX, JPG, PNG
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Add any relevant notes about this document..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                />
              </div>

              <Button type="submit" className="w-full" disabled={uploading}>
                <Upload className="w-4 h-4 mr-2" />
                {uploading ? "Uploading..." : "Upload Record"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default DoctorDashboard;
