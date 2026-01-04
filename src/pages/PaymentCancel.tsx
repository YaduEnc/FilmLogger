import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { XCircle, ArrowLeft } from "lucide-react";
import { Layout } from "@/components/layout/Layout";

export default function PaymentCancel() {
  return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="max-w-md w-full text-center space-y-8">
          <div className="flex justify-center">
            <div className="h-20 w-20 rounded-full bg-red-500/20 flex items-center justify-center">
              <XCircle className="h-10 w-10 text-red-500" />
            </div>
          </div>
          
          <div className="space-y-4">
            <h1 className="font-serif text-4xl font-bold uppercase tracking-tight">
              Payment Cancelled
            </h1>
            <p className="font-mono text-sm text-muted-foreground">
              Your payment was cancelled. No charges were made.
            </p>
          </div>

          <div className="space-y-4 pt-8">
            <Link to="/membership">
              <Button className="w-full h-12 font-mono text-xs uppercase tracking-widest">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Membership
              </Button>
            </Link>
            <Link to="/home">
              <Button variant="outline" className="w-full h-12 font-mono text-xs uppercase tracking-widest">
                Go to Home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}
