import { useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { useAuth } from "@/hooks/useAuth";

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const sessionId = searchParams.get("session_id");

  useEffect(() => {
    // Verify payment and update user subscription in database
    if (sessionId && user) {
      // TODO: Verify payment with backend and update user subscription
      console.log("Payment successful:", sessionId);
    }
  }, [sessionId, user]);

  return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="max-w-md w-full text-center space-y-8">
          <div className="flex justify-center">
            <div className="h-20 w-20 rounded-full bg-green-500/20 flex items-center justify-center">
              <CheckCircle2 className="h-10 w-10 text-green-500" />
            </div>
          </div>
          
          <div className="space-y-4">
            <h1 className="font-serif text-4xl font-bold uppercase tracking-tight">
              Payment Successful
            </h1>
            <p className="font-mono text-sm text-muted-foreground">
              Your subscription has been activated. Welcome to the premium tier!
            </p>
          </div>

          <div className="space-y-4 pt-8">
            <Button
              onClick={() => navigate("/home")}
              className="w-full h-12 font-mono text-xs uppercase tracking-widest"
            >
              Go to Home
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
            <Link to="/profile">
              <Button variant="outline" className="w-full h-12 font-mono text-xs uppercase tracking-widest">
                View Profile
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}
