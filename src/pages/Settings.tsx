import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { H1, H3 } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Divider } from "@/components/ui/divider";
import { ArrowLeft, Download, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function Settings() {
  const handleExport = (format: "csv" | "json") => {
    toast({
      title: "Export started",
      description: `Your data will be exported as ${format.toUpperCase()}.`,
    });
  };

  const handleDeleteAccount = () => {
    toast({
      title: "Are you sure?",
      description: "This action cannot be undone.",
      variant: "destructive",
    });
  };

  return (
    <Layout>
      <div className="container mx-auto px-6 py-8 max-w-2xl">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/profile"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to profile
          </Link>
          <H1>Settings</H1>
        </div>

        {/* Account */}
        <section className="mb-10">
          <H3 className="mb-4">Account</H3>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" defaultValue="jane@example.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input id="username" defaultValue="janedoe" />
            </div>
            <Button>Save changes</Button>
          </div>
        </section>

        <Divider className="mb-10" />

        {/* Profile */}
        <section className="mb-10">
          <H3 className="mb-4">Profile</H3>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="displayName">Display name</Label>
              <Input id="displayName" defaultValue="Jane Doe" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                defaultValue="Film enthusiast, slow cinema devotee"
                rows={3}
              />
            </div>
            <Button>Update profile</Button>
          </div>
        </section>

        <Divider className="mb-10" />

        {/* Export */}
        <section className="mb-10">
          <H3 className="mb-4">Export data</H3>
          <p className="text-sm text-muted-foreground mb-4">
            Download all your diary entries, lists, and ratings.
          </p>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => handleExport("csv")} className="gap-2">
              <Download className="h-4 w-4" />
              Export as CSV
            </Button>
            <Button variant="outline" onClick={() => handleExport("json")} className="gap-2">
              <Download className="h-4 w-4" />
              Export as JSON
            </Button>
          </div>
        </section>

        <Divider className="mb-10" />

        {/* Danger zone */}
        <section>
          <H3 className="mb-4 text-destructive">Danger zone</H3>
          <p className="text-sm text-muted-foreground mb-4">
            Once you delete your account, there is no going back. Please be certain.
          </p>
          <Button variant="outline" onClick={handleDeleteAccount} className="gap-2 text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground">
            <Trash2 className="h-4 w-4" />
            Delete account
          </Button>
        </section>
      </div>
    </Layout>
  );
}
