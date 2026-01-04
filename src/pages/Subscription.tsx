import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Loader2, 
  Sparkles, 
  Zap, 
  CheckCircle2, 
  XCircle, 
  Calendar,
  CreditCard,
  ArrowRight,
  Crown,
  AlertCircle
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { getUserData } from "@/lib/db";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Subscription {
  planId?: string;
  status?: 'active' | 'inactive' | 'cancelled' | 'past_due';
  subscriptionId?: string;
  startDate?: string;
  endDate?: string;
  cancelAtPeriodEnd?: boolean;
}

const PLAN_INFO: Record<string, { name: string; price: string; icon: React.ReactNode; color: string }> = {
  pro: {
    name: "Pro Archivist",
    price: "₹199/month",
    icon: <Sparkles className="h-5 w-5 text-primary" />,
    color: "text-primary"
  },
  legend: {
    name: "Cinema Legend",
    price: "₹499/month",
    icon: <Zap className="h-5 w-5 text-amber-500" />,
    color: "text-amber-500"
  }
};

export default function Subscription() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    const loadSubscription = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const userData = await getUserData(user.uid);
        if (userData?.subscription) {
          setSubscription(userData.subscription);
        }
      } catch (error) {
        console.error("Error loading subscription:", error);
        toast.error("Failed to load subscription details");
      } finally {
        setLoading(false);
      }
    };

    loadSubscription();
  }, [user]);

  const handleCancelSubscription = async () => {
    if (!subscription?.subscriptionId) {
      toast.error("No active subscription found");
      return;
    }

    setIsCancelling(true);
    try {
      // Call Stripe API to cancel subscription
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const apiEndpoint = apiUrl ? `${apiUrl}/api/cancel-subscription` : '/api/cancel-subscription';
      
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscriptionId: subscription.subscriptionId,
          userId: user?.uid
        })
      });

      if (!response.ok) {
        throw new Error("Failed to cancel subscription");
      }

      toast.success("Subscription cancelled. You'll have access until the end of your billing period.");
      
      // Reload subscription data
      const userData = await getUserData(user?.uid || '');
      if (userData?.subscription) {
        setSubscription(userData.subscription);
      }
    } catch (error: any) {
      console.error("Error cancelling subscription:", error);
      toast.error(error.message || "Failed to cancel subscription");
    } finally {
      setIsCancelling(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500/20 text-green-500 border-green-500/30">Active</Badge>;
      case 'past_due':
        return <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30">Past Due</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-500/20 text-red-500 border-red-500/30">Cancelled</Badge>;
      default:
        return <Badge variant="outline">Inactive</Badge>;
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </Layout>
    );
  }

  const planInfo = subscription?.planId ? PLAN_INFO[subscription.planId] : null;

  return (
    <Layout>
      <div className="min-h-screen py-12 px-6">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-serif text-4xl font-bold uppercase tracking-tight">Subscription</h1>
              <p className="font-mono text-sm text-muted-foreground mt-2">
                Manage your premium membership
              </p>
            </div>
            <Link to="/membership">
              <Button variant="outline" className="font-mono text-xs uppercase tracking-widest">
                View Plans
              </Button>
            </Link>
          </div>

          {/* Current Subscription */}
          {subscription?.status === 'active' || subscription?.status === 'past_due' ? (
            <Card className="p-8 space-y-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  {planInfo?.icon}
                  <div>
                    <h2 className="font-bold text-2xl">{planInfo?.name || "Premium Plan"}</h2>
                    <p className="font-mono text-sm text-muted-foreground mt-1">
                      {planInfo?.price || "Premium Subscription"}
                    </p>
                  </div>
                </div>
                {getStatusBadge(subscription.status)}
              </div>

              <Separator />

              {/* Subscription Details */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest mb-1">
                      Subscription ID
                    </p>
                    <p className="font-mono text-xs">{subscription.subscriptionId?.slice(0, 20)}...</p>
                  </div>
                  <div>
                    <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest mb-1">
                      Started On
                    </p>
                    <p className="font-medium">{formatDate(subscription.startDate)}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  {subscription.cancelAtPeriodEnd ? (
                    <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertCircle className="h-4 w-4 text-yellow-500" />
                        <p className="font-mono text-xs font-bold text-yellow-500 uppercase">
                          Cancelling at Period End
                        </p>
                      </div>
                      <p className="font-mono text-xs text-muted-foreground">
                        Access until: {formatDate(subscription.endDate)}
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest mb-1">
                        Next Billing Date
                      </p>
                      <p className="font-medium">
                        {subscription.endDate ? formatDate(subscription.endDate) : "Auto-renewing"}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <Separator />
              <div className="flex gap-4">
                {!subscription.cancelAtPeriodEnd ? (
                  <Button
                    onClick={handleCancelSubscription}
                    disabled={isCancelling}
                    variant="outline"
                    className="font-mono text-xs uppercase tracking-widest"
                  >
                    {isCancelling ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Cancelling...
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4 mr-2" />
                        Cancel Subscription
                      </>
                    )}
                  </Button>
                ) : (
                  <div className="p-4 bg-muted/50 rounded-lg flex-1">
                    <p className="font-mono text-xs text-muted-foreground">
                      Your subscription will be cancelled at the end of the current billing period.
                      You'll continue to have access until then.
                    </p>
                  </div>
                )}
              </div>
            </Card>
          ) : (
            /* No Active Subscription */
            <Card className="p-12 text-center space-y-6">
              <div className="flex justify-center">
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                  <Crown className="h-8 w-8 text-muted-foreground" />
                </div>
              </div>
              <div className="space-y-2">
                <h2 className="font-serif text-2xl font-bold uppercase">No Active Subscription</h2>
                <p className="font-mono text-sm text-muted-foreground">
                  Upgrade to unlock premium features and support the archive
                </p>
              </div>
              <Link to="/membership">
                <Button className="font-mono text-xs uppercase tracking-widest">
                  View Plans
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </Card>
          )}

          {/* Features Info */}
          {subscription?.status === 'active' && (
            <Card className="p-6 bg-muted/30">
              <h3 className="font-bold text-sm uppercase tracking-widest mb-4">Premium Benefits</h3>
              <div className="grid md:grid-cols-2 gap-4">
                {subscription.planId === 'pro' ? (
                  <>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      <span>Golden Profile Badge</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      <span>Detailed Viewing Analytics</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      <span>Custom Profile Themes</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      <span>Ad-free Experience</span>
                    </div>
                  </>
                ) : subscription.planId === 'legend' ? (
                  <>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-amber-500" />
                      <span>Legendary Diamond Badge</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-amber-500" />
                      <span>Private Archivist Groups</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-amber-500" />
                      <span>Unlimited Custom Lists</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-amber-500" />
                      <span>Personalized Curators</span>
                    </div>
                  </>
                ) : null}
              </div>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
}
