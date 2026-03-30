import { useCallback, useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";

type AdminRow = {
  user_id: number;
  email: string;
  first_name: string;
  last_name: string;
};

type AdminDeleteAdminSectionProps = {
  onDeleted?: () => void;
};

const AdminDeleteAdminSection = ({ onDeleted }: AdminDeleteAdminSectionProps) => {
  const { user: currentUser } = useAuth();
  const [admins, setAdmins] = useState<AdminRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string>("");
  const [deleting, setDeleting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const loadAdmins = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("users")
      .select("user_id, email, first_name, last_name")
      .eq("role", "admin")
      .order("email", { ascending: true });

    if (error) {
      toast({
        title: "Could not load admins",
        description: error.message,
        variant: "destructive",
      });
      setAdmins([]);
    } else {
      setAdmins((data as AdminRow[]) ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadAdmins();
  }, [loadAdmins]);

  const selected = admins.find((a) => String(a.user_id) === selectedId);
  const isSelf = selected != null && currentUser != null && selected.user_id === currentUser.user_id;
  const onlyOneAdmin = admins.length <= 1;
  const canDelete = selected != null && !isSelf && !onlyOneAdmin;

  const handleDelete = async () => {
    if (!selected || !canDelete) {
      return;
    }

    setDeleting(true);
    try {
      const { error } = await supabase.from("users").delete().eq("user_id", selected.user_id);

      if (error) {
        throw new Error(error.message);
      }

      toast({
        title: "Admin removed",
        description: `${selected.email} has been deleted.`,
      });
      setSelectedId("");
      setConfirmOpen(false);
      await loadAdmins();
      onDeleted?.();
    } catch (err) {
      toast({
        title: "Could not delete admin",
        description: err instanceof Error ? err.message : "Something went wrong.",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-destructive" />
            <CardTitle className="text-lg">Remove admin account</CardTitle>
          </div>
          <CardDescription>
            Select another admin to delete their account. You cannot delete yourself or the only remaining admin.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading admins…</p>
          ) : admins.length === 0 ? (
            <p className="text-sm text-muted-foreground">No admin accounts found.</p>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="admin-to-delete">Admin account</Label>
                <Select value={selectedId} onValueChange={setSelectedId}>
                  <SelectTrigger id="admin-to-delete">
                    <SelectValue placeholder="Choose an admin…" />
                  </SelectTrigger>
                  <SelectContent>
                    {admins.map((a) => (
                      <SelectItem key={a.user_id} value={String(a.user_id)}>
                        {a.email} — {a.first_name} {a.last_name}
                        {currentUser?.user_id === a.user_id ? " (you)" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {onlyOneAdmin && (
                <p className="text-sm text-amber-600 dark:text-amber-500">
                  There is only one admin. Add another admin before removing this one.
                </p>
              )}
              {selected && isSelf && !onlyOneAdmin && (
                <p className="text-sm text-muted-foreground">You cannot delete your own account while signed in.</p>
              )}

              <Button
                type="button"
                variant="destructive"
                disabled={!selectedId || !canDelete || deleting}
                onClick={() => setConfirmOpen(true)}
              >
                {deleting ? "Removing…" : "Delete selected admin"}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this admin?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove{" "}
              <span className="font-medium text-foreground">
                {selected?.email} ({selected?.first_name} {selected?.last_name})
              </span>
              . They will no longer be able to sign in.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              disabled={deleting}
              onClick={() => void handleDelete()}
            >
              {deleting ? "Deleting…" : "Delete"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default AdminDeleteAdminSection;
