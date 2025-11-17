import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { FileText, LogOut, Download, Calendar, User } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface MedicalRecord {
  id: string;
  file_name: string;
  file_url: string;
  file_type: string | null;
  notes: string | null;
  uploaded_at: string;
  doctor: {
    full_name: string;
  };
}

interface Profile {
  full_name: string;
  email: string;
}

const PatientDashboard = () => {
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
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

      if (userProfile?.role !== "patient") {
        navigate("/doctor");
        return;
      }

      setProfile({ full_name: userProfile.full_name, email: userProfile.email });

      const { data, error } = await supabase
        .from("medical_records")
        .select(`
          *,
          doctor:profiles!medical_records_doctor_id_fkey(full_name)
        `)
        .eq("patient_id", session.user.id)
        .order("uploaded_at", { ascending: false });

      if (error) {
        toast({
          title: "Error",
          description: "Failed to load medical records",
          variant: "destructive",
        });
      } else {
        setRecords(data || []);
      }

      setLoading(false);
    };

    checkAuthAndFetchData();
  }, [navigate, toast]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const handleDownload = async (fileUrl: string, fileName: string) => {
    try {
      const { data, error } = await supabase.storage
        .from("medical-files")
        .download(fileUrl.split("/").pop() || "");

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: "File downloaded successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading your records...</p>
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
              <p className="text-sm text-muted-foreground">Patient Portal</p>
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
                <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                  {profile?.full_name?.charAt(0) || "P"}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-2xl">{profile?.full_name}</CardTitle>
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
            <CardTitle>My Medical Records</CardTitle>
            <CardDescription>
              View and download your medical documents uploaded by healthcare providers
            </CardDescription>
          </CardHeader>
          <CardContent>
            {records.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground text-lg">No medical records yet</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Your healthcare providers will upload documents here
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {records.map((record) => (
                  <Card key={record.id} className="border-l-4 border-l-primary">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-foreground mb-1">
                            {record.file_name}
                          </h3>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              Dr. {record.doctor.full_name}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(record.uploaded_at).toLocaleDateString()}
                            </span>
                          </div>
                          {record.notes && (
                            <p className="text-sm text-muted-foreground mt-2">
                              {record.notes}
                            </p>
                          )}
                        </div>
                        <Button
                          onClick={() => handleDownload(record.file_url, record.file_name)}
                          size="sm"
                          variant="outline"
                          className="ml-4"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default PatientDashboard;
