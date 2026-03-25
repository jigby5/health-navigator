import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { hashPassword } from "@/lib/auth";

const DEMO_EMAIL = "chad@example.com";

const EditProfile = () => {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  useEffect(() => {
    if (user) {
      setFirstName(user.first_name ?? "");
      setLastName(user.last_name ?? "");
      setEmail(user.email ?? "");
    }
  }, [user]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) return;

    const trimmedFirstName = firstName.trim();
    const trimmedLastName = lastName.trim();
    const normalizedEmail = email.trim().toLowerCase();

    if (!trimmedFirstName || !trimmedLastName || !normalizedEmail) {
      toast({
        title: "Missing information",
        description: "First name, last name, and email are all required.",
        variant: "destructive",
      });
      return;
    }

    try {
      setSavingProfile(true);

      const { data: existingUser, error: lookupError } = await supabase
        .from("users")
        .select("user_id")
        .eq("email", normalizedEmail)
        .neq("user_id", user.user_id)
        .maybeSingle();

      if (lookupError) {
        throw new Error(lookupError.message);
      }

      if (existingUser) {
        toast({
          title: "Email already in use",
          description: "Another account already uses that email address.",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from("users")
        .update({
          first_name: trimmedFirstName,
          last_name: trimmedLastName,
          email: normalizedEmail,
        })
        .eq("user_id", user.user_id);

      if (error) {
        throw new Error(error.message);
      }

      await refreshUser();

      toast({
        title: "Profile updated",
        description: "Your personal information has been updated successfully.",
      });

      navigate("/profile");
    } catch (error) {
      toast({
        title: "Update failed",
        description: error instanceof Error ? error.message : "Something went wrong while updating your profile.",
        variant: "destructive",
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) return;

    if ((user.email ?? "").toLowerCase() === DEMO_EMAIL) {
      toast({
        title: "Demo account",
        description: "The demo account password cannot be changed.",
        variant: "destructive",
      });
      return;
    }

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      toast({
        title: "Missing information",
        description: "Fill out all password fields.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Password too short",
        description: "Your new password must be at least 6 characters long.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmNewPassword) {
      toast({
        title: "Passwords do not match",
        description: "Your new password and confirmation must match.",
        variant: "destructive",
      });
      return;
    }

    if (currentPassword === newPassword) {
      toast({
        title: "Choose a new password",
        description: "Your new password must be different from your current password.",
        variant: "destructive",
      });
      return;
    }

    try {
      setSavingPassword(true);

      const currentPasswordHash = await hashPassword(currentPassword);

      if (currentPasswordHash !== user.password_hash) {
        toast({
          title: "Incorrect current password",
          description: "The current password you entered is not correct.",
          variant: "destructive",
        });
        return;
      }

      const newPasswordHash = await hashPassword(newPassword);

      const { error } = await supabase
        .from("users")
        .update({
          password_hash: newPasswordHash,
        })
        .eq("user_id", user.user_id);

      if (error) {
        throw new Error(error.message);
      }

      await refreshUser();

      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");

      toast({
        title: "Password updated",
        description: "Your password has been changed successfully.",
      });
    } catch (error) {
      toast({
        title: "Password update failed",
        description: error instanceof Error ? error.message : "Something went wrong while changing your password.",
        variant: "destructive",
      });
    } finally {
      setSavingPassword(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen pt-20 px-4">
        <div className="max-w-2xl mx-auto">
          <p className="text-muted-foreground">No user found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 px-4 pb-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Edit Profile</h1>
          <p className="text-muted-foreground mt-1">
            Update your account details and password.
          </p>
        </div>

        <div className="glass-card rounded-xl p-6">
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-foreground">Personal Information</h2>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="firstName" className="text-sm font-medium text-foreground">
                  First Name
                </label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Enter first name"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="lastName" className="text-sm font-medium text-foreground">
                  Last Name
                </label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Enter last name"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-foreground">
                Email
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email address"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button type="submit" disabled={savingProfile}>
                {savingProfile ? "Saving..." : "Save Personal Info"}
              </Button>

              <Link to="/profile">
                <Button type="button" variant="outline">
                  Back to Profile
                </Button>
              </Link>
            </div>
          </form>
        </div>

        <div className="glass-card rounded-xl p-6">
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-foreground">Change Password</h2>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="currentPassword" className="text-sm font-medium text-foreground">
                Current Password
              </label>
              <Input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="newPassword" className="text-sm font-medium text-foreground">
                New Password
              </label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="confirmNewPassword" className="text-sm font-medium text-foreground">
                Confirm New Password
              </label>
              <Input
                id="confirmNewPassword"
                type="password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                placeholder="Re-enter new password"
              />
            </div>

            <Button type="submit" disabled={savingPassword}>
              {savingPassword ? "Updating..." : "Change Password"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditProfile;