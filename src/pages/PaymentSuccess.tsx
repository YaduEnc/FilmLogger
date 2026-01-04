import { useEffect, useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, ArrowRight, Download, Receipt, Sparkles, Zap, Loader2 } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { useAuth } from "@/hooks/useAuth";
import { Logo } from "@/components/layout/Logo";

const PLAN_NAMES: Record<string, { name: string; icon: React.ReactNode }> = {
  pro: {
    name: "Pro Archivist",
    icon: <Sparkles className="h-5 w-5 text-primary" />
  },
  legend: {
    name: "Cinema Legend",
    icon: <Zap className="h-5 w-5 text-amber-500" />
  }
};

interface SessionData {
  id: string;
  amount_total: number;
  currency: string;
  customer_email: string;
  customer_details?: {
    name?: string;
    email?: string;
  };
  payment_status: string;
  created: number;
  metadata: {
    planId?: string;
    userId?: string;
  };
  planId?: string;
}

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const sessionId = searchParams.get("session_id");
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSessionDetails = async () => {
      if (!sessionId) {
        setError("No session ID provided");
        setLoading(false);
        return;
      }

      try {
        const apiUrl = import.meta.env.VITE_API_URL || '';
        const apiEndpoint = apiUrl ? `${apiUrl}/api/get-session` : '/api/get-session';
        const response = await fetch(`${apiEndpoint}?session_id=${sessionId}`);

        if (!response.ok) {
          throw new Error("Failed to fetch session details");
        }

        const data = await response.json();
        setSessionData(data);
      } catch (err: any) {
        console.error("Error fetching session:", err);
        setError(err.message || "Failed to load payment details");
      } finally {
        setLoading(false);
      }
    };

    fetchSessionDetails();
  }, [sessionId]);

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency.toUpperCase(),
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount / 100);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const planInfo = sessionData?.planId ? PLAN_NAMES[sessionData.planId] : null;

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </Layout>
    );
  }

  if (error || !sessionData) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center px-6">
          <Card className="p-8 max-w-md w-full text-center">
            <p className="font-mono text-sm text-destructive">{error || "Payment details not found"}</p>
            <Button onClick={() => navigate("/home")} className="mt-6">
              Go to Home
            </Button>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-background py-12 px-6">
        <div className="max-w-2xl mx-auto space-y-8">
          {/* Success Header */}
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="h-20 w-20 rounded-full bg-green-500/20 flex items-center justify-center border-2 border-green-500/30">
                <CheckCircle2 className="h-10 w-10 text-green-500" />
              </div>
            </div>
            <div className="space-y-2">
              <h1 className="font-serif text-5xl font-bold uppercase tracking-tight">
                Payment Successful
              </h1>
              <p className="font-mono text-sm text-muted-foreground">
                Your subscription has been activated. Welcome to the premium tier!
              </p>
            </div>
          </div>

          {/* Invoice Card */}
          <Card className="border-2 p-8 space-y-6">
            {/* Invoice Header */}
            <div className="flex items-start justify-between border-b pb-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Logo className="h-6 w-6" />
                  <span className="font-bold text-lg tracking-tight uppercase">CineLunatic</span>
                </div>
                <p className="font-mono text-xs text-muted-foreground uppercase tracking-widest">
                  Payment Receipt
                </p>
              </div>
              <div className="text-right space-y-1">
                <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
                  Transaction ID
                </p>
                <p className="font-mono text-xs font-bold">{sessionData.id.slice(0, 20)}...</p>
              </div>
            </div>

            {/* Customer Info */}
            <div className="grid md:grid-cols-2 gap-6 pb-6 border-b">
              <div>
                <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest mb-2">
                  Bill To
                </p>
                <p className="font-medium">{sessionData.customer_details?.name || user?.displayName || "Customer"}</p>
                <p className="font-mono text-sm text-muted-foreground">{sessionData.customer_email}</p>
              </div>
              <div>
                <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest mb-2">
                  Payment Date
                </p>
                <p className="font-medium">{formatDate(sessionData.created)}</p>
                <p className="font-mono text-xs text-muted-foreground mt-1">
                  Status: <span className="text-green-500 font-bold uppercase">{sessionData.payment_status}</span>
                </p>
              </div>
            </div>

            {/* Subscription Details */}
            <div className="space-y-4">
              <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
                Subscription Details
              </p>
              <div className="border rounded-none p-4 bg-muted/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {planInfo?.icon}
                    <div>
                      <p className="font-bold text-lg">{planInfo?.name || "Subscription"}</p>
                      <p className="font-mono text-xs text-muted-foreground uppercase tracking-widest">
                        Monthly Subscription
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-xl">{formatAmount(sessionData.amount_total, sessionData.currency)}</p>
                    <p className="font-mono text-[10px] text-muted-foreground uppercase">Per Month</p>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Total */}
            <div className="flex items-center justify-between pt-2">
              <p className="font-mono text-sm uppercase tracking-widest font-bold">Total Paid</p>
              <p className="font-serif text-3xl font-bold">{formatAmount(sessionData.amount_total, sessionData.currency)}</p>
            </div>

            {/* Footer Note */}
            <div className="pt-6 border-t">
              <p className="font-mono text-[9px] text-muted-foreground/60 text-center leading-relaxed">
                This is a recurring subscription. You will be charged monthly until you cancel.
                You can manage your subscription from your profile settings.
              </p>
            </div>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              onClick={() => navigate("/home")}
              className="flex-1 h-12 font-mono text-xs uppercase tracking-widest"
            >
              Go to Home
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
            <Link to="/profile" className="flex-1">
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
