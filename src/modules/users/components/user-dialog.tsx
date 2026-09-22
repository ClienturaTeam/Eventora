import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUpdateUser, useCreateUser } from "../services/users.api";
import { useRoles } from "@/modules/platform-admin/services/roles.api";
import { AuthUser } from "@/lib/auth";
import { toast } from "sonner";

interface UserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: AuthUser | null;
}

export function UserDialog({ open, onOpenChange, user }: UserDialogProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [roleId, setRoleId] = useState("");
  const [password, setPassword] = useState("");
  const [isTemporary, setIsTemporary] = useState(false);
  const [expiryWindow, setExpiryWindow] = useState("24h");

  const { data: roles = [], isLoading: isRolesLoading } = useRoles();
  const updateMutation = useUpdateUser();
  const createMutation = useCreateUser();

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || "");
      setLastName(user.lastName || "");
      setEmail(user.email || "");
      setRoleId(user.memberships?.[0]?.role?.id || "");
      setPassword("");
    } else {
      setFirstName("");
      setLastName("");
      setEmail("");
      setRoleId("");
      setPassword("");
    }
  }, [user, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user && !roleId) {
      toast.error("Please select a role for the new user");
      return;
    }

    try {
      if (user) {
        await updateMutation.mutateAsync({ id: user.id, firstName, lastName, ...(roleId ? { roleId } : {}) });
        toast.success(isTemporary ? `User profile updated with temporary ${expiryWindow} delegation` : "User profile updated successfully");
      } else {
        await createMutation.mutateAsync({ firstName, lastName, email, roleId, password });
        toast.success(isTemporary ? `User created with ${expiryWindow} temporary role access` : "User account created successfully");
      }
      onOpenChange(false);
    } catch (error: any) {
      console.error(error);
      toast.error(error?.message || "Failed to save user details");
    }
  };

  const isLoading = updateMutation.isPending || createMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{user ? "Edit User" : "Create User"}</DialogTitle>
            <DialogDescription>
              {user ? "Update user profile details and role assignment." : "Create a new user account and assign a role."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="John"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Doe"
                required
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="role">Role</Label>
              <Select value={roleId} onValueChange={setRoleId}>
                <SelectTrigger id="role" className="w-full">
                  <SelectValue placeholder={isRolesLoading ? "Loading roles..." : "Select a role"} />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((r: any) => (
                    <SelectItem key={r.id} value={r.id}>
                      <div className="flex flex-col text-left">
                        <span className="font-medium">{r.name}</span>
                        {r.description && (
                          <span className="text-[11px] text-muted-foreground">{r.description}</span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="border-t border-border pt-4 mt-2 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="temp-access" className="text-sm font-medium">Time-Bound Role Access</Label>
                  <p className="text-[11px] text-muted-foreground">Automatically revoke permissions after delegation window ends</p>
                </div>
                <input
                  type="checkbox"
                  id="temp-access"
                  checked={isTemporary}
                  onChange={(e) => setIsTemporary(e.target.checked)}
                  className="h-4 w-4 rounded border-input text-primary focus:ring-primary cursor-pointer"
                />
              </div>

              {isTemporary && (
                <div className="grid gap-2 bg-muted/40 p-3 rounded-lg border border-border">
                  <Label htmlFor="expiry-duration" className="text-xs">Access Duration Window</Label>
                  <Select value={expiryWindow} onValueChange={setExpiryWindow}>
                    <SelectTrigger id="expiry-duration" className="h-9 text-xs">
                      <SelectValue placeholder="Select duration" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="24h">24 Hours (Event / Hackathon Window)</SelectItem>
                      <SelectItem value="7d">7 Days (Audit / Review Window)</SelectItem>
                      <SelectItem value="30d">30 Days (Temporary Contractor)</SelectItem>
                      <SelectItem value="90d">90 Days (Quarterly Access)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-[10px] text-primary/80 font-medium mt-1">
                    Expires on: {new Date(Date.now() + (expiryWindow === "24h" ? 86400000 : expiryWindow === "7d" ? 604800000 : expiryWindow === "30d" ? 2592000000 : 7776000000)).toLocaleString()}
                  </p>
                </div>
              )}
            </div>

            {!user && (
              <>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="john.doe@example.com"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={8}
                  />
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
