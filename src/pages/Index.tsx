import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FileHeart, Stethoscope, User, Shield, Clock, FileText } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-medical-blue via-primary to-medical-teal">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/10 backdrop-blur-sm mb-6">
            <FileHeart className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-5xl font-bold text-white mb-4">MedRecords</h1>
          <p className="text-xl text-white/90 max-w-2xl mx-auto">
            Secure, digital medical record management. Access your health documents anytime, anywhere.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-16">
          <Card className="border-0 shadow-2xl hover:shadow-3xl transition-all duration-300">
            <CardContent className="p-8">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                <User className="w-7 h-7 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-3">For Patients</h2>
              <p className="text-muted-foreground mb-6">
                Access all your medical records in one secure place. No more carrying physical files to appointments.
              </p>
              <Button 
                onClick={() => navigate("/auth")} 
                className="w-full"
                size="lg"
              >
                Patient Portal
              </Button>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-2xl hover:shadow-3xl transition-all duration-300">
            <CardContent className="p-8">
              <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center mb-6">
                <Stethoscope className="w-7 h-7 text-accent" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-3">For Doctors</h2>
              <p className="text-muted-foreground mb-6">
                Upload and manage patient records securely. Streamline your practice workflow.
              </p>
              <Button 
                onClick={() => navigate("/auth")} 
                className="w-full"
                size="lg"
                variant="secondary"
              >
                Doctor Portal
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <Card className="border-0 bg-white/10 backdrop-blur-sm text-white">
            <CardContent className="p-6 text-center">
              <Shield className="w-10 h-10 mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2">Secure & Private</h3>
              <p className="text-sm text-white/80">
                End-to-end encryption ensures your medical data stays confidential
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 bg-white/10 backdrop-blur-sm text-white">
            <CardContent className="p-6 text-center">
              <Clock className="w-10 h-10 mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2">24/7 Access</h3>
              <p className="text-sm text-white/80">
                Access your medical records anytime, from any device
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 bg-white/10 backdrop-blur-sm text-white">
            <CardContent className="p-6 text-center">
              <FileText className="w-10 h-10 mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2">All in One Place</h3>
              <p className="text-sm text-white/80">
                No more scattered files - everything organized digitally
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;
