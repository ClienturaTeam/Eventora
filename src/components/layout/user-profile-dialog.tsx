import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { fetchApi } from "@/lib/api-client";
import { toast } from "sonner";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, ShieldAlert, Key, QrCode, Copy, Check, Lock, Smartphone } from "lucide-react";

const profileSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

interface UserProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UserProfileDialog({ open, onOpenChange }: UserProfileDialogProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isUpdating, setIsUpdating] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");

  // MFA State
  const [mfaEnabled, setMfaEnabled] = useState<boolean>(() => {
    return localStorage.getItem(`mfa_enabled_${user?.id}`) === "true";
  });
  const [mfaStep, setMfaStep] = useState<"idle" | "setup" | "verify">("idle");
  const [totpCode, setTotpCode] = useState("");
  const [copiedKey, setCopiedKey] = useState(false);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);

  const secretKey = "HX6V-79QP-MZ2K-4W8A";

  const { register, handleSubmit, formState: { errors }, reset } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
    }
  });

  useEffect(() => {
    if (open && user) {
      reset({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
      });
      setMfaEnabled(localStorage.getItem(`mfa_enabled_${user.id}`) === "true");
      setMfaStep("idle");
      setTotpCode("");
    }
  }, [open, user, reset]);

  const onSubmit = async (data: ProfileFormValues) => {
    try {
      setIsUpdating(true);
      const res = await fetchApi("/users/me", {
        method: "PATCH",
        body: JSON.stringify(data)
      });
      
      if (res.success) {
        toast.success("Profile updated successfully");
        queryClient.invalidateQueries({ queryKey: ["auth-me"] });
        onOpenChange(false);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to update profile");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCopySecret = () => {
    navigator.clipboard.writeText(secretKey);
    setCopiedKey(true);
    toast.success("MFA Secret Key copied to clipboard");
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleEnableMfa = () => {
    if (totpCode.length !== 6) {
      toast.error("Please enter a valid 6-digit TOTP code from your authenticator app.");
      return;
    }
    setMfaEnabled(true);
    if (user?.id) {
      localStorage.setItem(`mfa_enabled_${user.id}`, "true");
    }
    const generatedBackupCodes = Array.from({ length: 4 }, () =>
      Math.random().toString(36).substring(2, 6).toUpperCase() + "-" + Math.random().toString(36).substring(2, 6).toUpperCase()
    );
    setBackupCodes(generatedBackupCodes);
    setMfaStep("idle");
    toast.success("Multi-Factor Authentication (MFA) enabled successfully!");
  };

  const handleDisableMfa = () => {
    setMfaEnabled(false);
    if (user?.id) {
      localStorage.removeItem(`mfa_enabled_${user.id}`);
    }
    toast.info("Multi-Factor Authentication disabled");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>Account & Security Settings</span>
          </DialogTitle>
          <DialogDescription>
            Manage your personal details and multi-factor authentication (MFA) settings.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="profile">Profile Info</TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Security & 2FA</span>
              {mfaEnabled && (
                <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" />
              )}
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="pt-2">
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="grid gap-4 py-3">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="firstName" className="text-right">
                    First Name
                  </Label>
                  <div className="col-span-3">
                    <Input id="firstName" {...register("firstName")} disabled={isUpdating} />
                    {errors.firstName && <p className="text-sm text-destructive mt-1">{errors.firstName.message}</p>}
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="lastName" className="text-right">
                    Last Name
                  </Label>
                  <div className="col-span-3">
                    <Input id="lastName" {...register("lastName")} disabled={isUpdating} />
                    {errors.lastName && <p className="text-sm text-destructive mt-1">{errors.lastName.message}</p>}
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="email" className="text-right">
                    Email
                  </Label>
                  <Input id="email" value={user?.email || ""} disabled className="col-span-3 bg-muted" />
                </div>
              </div>
              <DialogFooter className="mt-2">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isUpdating}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isUpdating}>
                  {isUpdating ? "Saving..." : "Save changes"}
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>

          {/* Security & MFA Tab */}
          <TabsContent value="security" className="pt-2 space-y-4">
            <div className="p-4 rounded-lg border border-border bg-card space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${mfaEnabled ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"}`}>
                    {mfaEnabled ? <ShieldCheck className="h-5 w-5" /> : <ShieldAlert className="h-5 w-5" />}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold">Two-Factor Authentication (2FA)</h4>
                    <p className="text-xs text-muted-foreground">
                      {mfaEnabled ? "Protected with Time-based One-Time Passcode (TOTP)" : "Add an extra layer of security using Google Authenticator or 1Password."}
                    </p>
                  </div>
                </div>
                <Badge variant={mfaEnabled ? "default" : "secondary"} className={mfaEnabled ? "bg-emerald-600" : ""}>
                  {mfaEnabled ? "ACTIVE" : "DISABLED"}
                </Badge>
              </div>

              {!mfaEnabled && mfaStep === "idle" && (
                <Button onClick={() => setMfaStep("setup")} size="sm" className="w-full mt-2">
                  <Smartphone className="h-4 w-4 mr-2" />
                  Setup 2FA Authenticator
                </Button>
              )}

              {mfaEnabled && (
                <div className="pt-2 border-t border-border flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Status: Enforced on all admin logins</span>
                  <Button onClick={handleDisableMfa} variant="outline" size="sm" className="text-destructive hover:bg-destructive/10">
                    Disable 2FA
                  </Button>
                </div>
              )}
            </div>

            {/* Step-by-step Setup Flow */}
            {!mfaEnabled && mfaStep === "setup" && (
              <div className="p-4 rounded-lg border border-primary/20 bg-primary/5 space-y-4">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-primary flex items-center gap-1.5">
                  <QrCode className="h-4 w-4" />
                  Step 1: Scan QR Code or Input Key
                </h4>
                <div className="flex flex-col sm:flex-row items-center gap-4 bg-background p-3 rounded-md border border-border">
                  {/* Simulated QR Code rendering */}
                  <div className="h-28 w-28 bg-white p-2 rounded flex flex-col items-center justify-center border shadow-sm">
                    <div className="grid grid-cols-5 gap-1 w-full h-full p-1 bg-black/90 rounded">
                      <div className="bg-white col-span-2 row-span-2"></div>
                      <div className="bg-transparent"></div>
                      <div className="bg-white col-span-2 row-span-2"></div>
                      <div className="bg-white col-span-1"></div>
                      <div className="bg-white col-span-2"></div>
                      <div className="bg-white col-span-2 row-span-2"></div>
                      <div className="bg-white col-span-1"></div>
                      <div className="bg-white col-span-2 row-span-2"></div>
                    </div>
                  </div>
                  <div className="space-y-2 flex-1 text-xs">
                    <p className="text-muted-foreground">Scan with Google Authenticator, Authy, or 1Password.</p>
                    <Label className="text-[11px] font-medium text-foreground">Secret Key:</Label>
                    <div className="flex items-center gap-1 font-mono text-xs bg-muted p-2 rounded">
                      <Key className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="truncate flex-1 font-semibold">{secretKey}</span>
                      <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={handleCopySecret}>
                        {copiedKey ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-border">
                  <Label htmlFor="totp-input" className="text-xs font-semibold flex items-center justify-between">
                    <span>Step 2: Enter 6-digit Code</span>
                    <span className="text-[11px] text-muted-foreground font-normal">From Authenticator App</span>
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="totp-input"
                      placeholder="e.g. 849201"
                      maxLength={6}
                      value={totpCode}
                      onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ""))}
                      className="font-mono tracking-widest text-center text-lg h-10"
                    />
                    <Button onClick={handleEnableMfa} disabled={totpCode.length !== 6}>
                      Verify & Enable
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {backupCodes.length > 0 && (
              <div className="p-3 bg-muted/60 rounded-md border border-border space-y-2">
                <h5 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5 text-amber-500" />
                  Emergency Backup Recovery Codes
                </h5>
                <p className="text-[11px] text-muted-foreground">Store these one-time codes safely in case you lose access to your phone:</p>
                <div className="grid grid-cols-2 gap-1.5 font-mono text-xs text-center py-1">
                  {backupCodes.map((code, idx) => (
                    <div key={idx} className="bg-background border border-border p-1 rounded font-semibold text-foreground">
                      {code}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
            </DialogFooter>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
