import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { H1, H3 } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Divider } from "@/components/ui/divider";
import { Switch } from "@/components/ui/switch";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { ArrowLeft, Download, Trash2, Loader2, Save, AtSign, Globe, Lock, Check, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { getUserData, updateUserData, checkUsernameAvailable, deleteUserAccount } from "@/lib/db";
import { updateProfile, deleteUser } from "firebase/auth";
import { toast } from "sonner";

export default function Settings() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [currentUsername, setCurrentUsername] = useState("");
  const [bio, setBio] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'available' | 'taken' | 'invalid'>('idle');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");

  useEffect(() => {
    async function loadSettings() {
      if (!user) return;
      try {
        setDisplayName(user.displayName || "");
        const userData = await getUserData(user.uid);
        if (userData) {
          setBio(userData.bio || "");
          setUsername(userData.username || "");
          setCurrentUsername(userData.username || "");
          setIsPublic(userData.isPublic !== false);
        }
      } catch (error) {
        console.error("Failed to load settings:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadSettings();
  }, [user]);

  useEffect(() => {
    if (!username || username === currentUsername) {
      setUsernameStatus('idle');
      return;
    }

    if (username.length < 3) {
      setUsernameStatus('invalid');
      return;
    }

    const timer = setTimeout(async () => {
      setIsCheckingUsername(true);
      const available = await checkUsernameAvailable(username);
      setUsernameStatus(available ? 'available' : 'taken');
      setIsCheckingUsername(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [username, currentUsername]);

  const handleUpdateProfile = async () => {
    if (!user) return;

    if (username && username !== currentUsername && usernameStatus !== 'available') {
      toast.error("Please choose a valid, available username");
      return;
    }

    setIsSaving(true);
    try {
      // Update Firebase Auth display name if it changed
      if (displayName !== user.displayName) {
        await updateProfile(user, { displayName });
      }

      // Update Firestore user data
      await updateUserData(user.uid, {
        displayName,
        username: username.toLowerCase(),
        bio,
        isPublic,
        updatedAt: new Date().toISOString()
      });

      setCurrentUsername(username.toLowerCase());
      toast.success("Profile updated successfully");
    } catch (error) {
      console.error("Failed to update profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleExport = (format: "csv" | "json") => {
    toast.info(`Exporting as ${format.toUpperCase()}...`);
  };

  const handleDeleteAccount = async () => {
    if (!user) return;

    setIsDeleting(true);
    try {
      // 1. Delete all Firestore data
      await deleteUserAccount(user.uid);

      // 2. Delete Firebase Auth account
      await deleteUser(user);

      // 3. Sign out
      await signOut();

      // 4. Show success message and redirect
      toast.success("Your account has been permanently deleted");
      navigate("/");
    } catch (error: any) {
      console.error("Error deleting account:", error);
      
      // Handle specific Firebase Auth errors
      if (error.code === "auth/requires-recent-login") {
        toast.error("Please sign in again to confirm account deletion");
      } else {
        toast.error("Failed to delete account. Please try again.");
      }
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-6 py-24 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-6 py-8 max-w-2xl">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/profile"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to profile
          </Link>
          <H1 className="tracking-tight text-3xl md:text-4xl">Settings</H1>
        </div>

        {/* Profile Identity */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <H3 className="text-xl">Identity</H3>
            <Button
              onClick={handleUpdateProfile}
              disabled={isSaving || (username !== currentUsername && usernameStatus !== 'available')}
              className="gap-2 rounded-full px-6 shadow-lg shadow-primary/10"
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save changes
            </Button>
          </div>

          <div className="space-y-5 bg-muted/5 p-6 rounded-2xl border border-border/50">
            {/* Username Field */}
            <div className="space-y-2">
              <Label htmlFor="username" className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Unique Username</Label>
              <div className="relative">
                <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase())}
                  placeholder="cinephile_99"
                  className="pl-9 bg-background border-border focus:ring-primary h-11"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
                  {isCheckingUsername ? (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  ) : usernameStatus === 'available' ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (usernameStatus === 'taken' || usernameStatus === 'invalid') && (
                    <X className="h-4 w-4 text-destructive" />
                  )}
                </div>
              </div>
              {usernameStatus === 'taken' && <p className="text-[10px] text-destructive">This username is already claimed.</p>}
              {usernameStatus === 'invalid' && <p className="text-[10px] text-destructive">Username must be at least 3 characters.</p>}
              <p className="text-[10px] text-muted-foreground">Usernames are public and help others find your archive.</p>
            </div>

            <Divider className="opacity-30" />

            <div className="space-y-2">
              <Label htmlFor="displayName" className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Display Name</Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name"
                className="bg-background border-border focus:ring-primary h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio" className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Personal Bio</Label>
              <Textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="A few words about your cinematic journey..."
                rows={4}
                className="bg-background border-border focus:ring-primary resize-none p-4"
              />
            </div>
          </div>
        </section>

        <Divider className="my-12 opacity-50" />

        {/* Visibility Section */}
        <section className="space-y-4">
          <H3 className="text-xl">Privacy</H3>
          <div className="bg-muted/5 p-6 rounded-2xl border border-border/50">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Public Profile</span>
                  {isPublic ? <Globe className="h-3 w-3 text-green-500" /> : <Lock className="h-3 w-3 text-yellow-500" />}
                </div>
                <p className="text-xs text-muted-foreground pr-8">
                  Allow others to discover your archive, read your reviews, and see your custom collections.
                </p>
              </div>
              <Switch checked={isPublic} onCheckedChange={setIsPublic} />
            </div>
          </div>
        </section>

        <Divider className="my-12 opacity-50" />

        {/* Data & Export */}
        <section className="space-y-4">
          <H3 className="text-xl">Archive Management</H3>
          <div className="bg-muted/5 p-6 rounded-2xl border border-border/50 space-y-4">
            <p className="text-sm text-muted-foreground">
              Download your personal data including all logs, ratings, and custom collections.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" onClick={() => handleExport("csv")} className="gap-2 rounded-full h-10 px-5 transition-all hover:bg-muted">
                <Download className="h-4 w-4" />
                Export as CSV
              </Button>
              <Button variant="outline" onClick={() => handleExport("json")} className="gap-2 rounded-full h-10 px-5 transition-all hover:bg-muted">
                <Download className="h-4 w-4" />
                Export as JSON
              </Button>
            </div>
          </div>
        </section>

        <Divider className="my-12 opacity-50" />

        {/* Danger Zone */}
        <section className="space-y-4">
          <H3 className="text-xl text-destructive font-serif">Danger Zone</H3>
          <div className="bg-destructive/5 p-6 rounded-2xl border border-destructive/20 space-y-4">
            <p className="text-sm text-muted-foreground">
              Permanently delete your CineLunatic account. This will erase all logs, reviews, and connections. This action cannot be undone.
            </p>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  disabled={isDeleting}
                  className="gap-2 text-destructive border-destructive/30 hover:bg-destructive hover:text-white rounded-full transition-all"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4" />
                      Delete account
                    </>
                  )}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription className="space-y-2">
                    <p>
                      This action cannot be undone. This will permanently delete your CineLunatic account and remove all of your data from our servers.
                    </p>
                    <p className="font-medium text-destructive">
                      This includes:
                    </p>
                    <ul className="list-disc list-inside text-sm space-y-1 text-muted-foreground">
                      <li>All your movie logs and diary entries</li>
                      <li>All your reviews and ratings</li>
                      <li>All your custom lists</li>
                      <li>All your connections and conversations</li>
                      <li>All your polls, debates, and comments</li>
                    </ul>
                    <p className="pt-2">
                      Type <span className="font-mono font-bold">DELETE</span> to confirm:
                    </p>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="py-4">
                  <Input
                    value={deleteConfirmation}
                    onChange={(e) => setDeleteConfirmation(e.target.value)}
                    placeholder="DELETE"
                    className="font-mono"
                    disabled={isDeleting}
                  />
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => setDeleteConfirmation("")}>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteAccount}
                    disabled={isDeleting || deleteConfirmation !== "DELETE"}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isDeleting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      "Delete Forever"
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </section>
      </div>
    </Layout>
  );
}
