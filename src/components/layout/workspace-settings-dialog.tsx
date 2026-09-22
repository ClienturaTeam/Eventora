import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings, Sliders, Bell, Shield, Palette, CreditCard, Save, Globe, Lock, Smartphone } from "lucide-react";

interface WorkspaceSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WorkspaceSettingsDialog({ open, onOpenChange }: WorkspaceSettingsDialogProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("general");

  // Settings state with localStorage persistence
  const [orgName, setOrgName] = useState(() => localStorage.getItem("setting_org_name") || "Eventora powered by Clientura");
  const [timezone, setTimezone] = useState(() => localStorage.getItem("setting_timezone") || "Asia/Kolkata (IST)");
  const [language, setLanguage] = useState(() => localStorage.getItem("setting_language") || "en");

  // Notifications
  const [emailAlerts, setEmailAlerts] = useState(() => localStorage.getItem("setting_email_alerts") !== "false");
  const [whatsappAlerts, setWhatsappAlerts] = useState(() => localStorage.getItem("setting_whatsapp_alerts") === "true");
  const [soundEffects, setSoundEffects] = useState(() => localStorage.getItem("setting_sound_effects") !== "false");

  // Security
  const [enforce2FA, setEnforce2FA] = useState(() => localStorage.getItem("setting_enforce_2fa") === "true");
  const [sessionTimeout, setSessionTimeout] = useState(() => localStorage.getItem("setting_session_timeout") || "60m");
  const [emailMasking, setEmailMasking] = useState(() => localStorage.getItem("setting_email_masking") !== "false");

  // Appearance
  const [tableDensity, setTableDensity] = useState(() => localStorage.getItem("setting_table_density") || "comfortable");
  const [themeMode, setThemeMode] = useState(() => localStorage.getItem("setting_theme_mode") || "dark");

  // Payments & Integrations
  const [currency, setCurrency] = useState(() => localStorage.getItem("setting_currency") || "INR (₹)");
  const [stripeEnv, setStripeEnv] = useState(() => localStorage.getItem("setting_stripe_env") || "live");

  const handleSaveSettings = () => {
    localStorage.setItem("setting_org_name", orgName);
    localStorage.setItem("setting_timezone", timezone);
    localStorage.setItem("setting_language", language);
    localStorage.setItem("setting_email_alerts", String(emailAlerts));
    localStorage.setItem("setting_whatsapp_alerts", String(whatsappAlerts));
    localStorage.setItem("setting_sound_effects", String(soundEffects));
    localStorage.setItem("setting_enforce_2fa", String(enforce2FA));
    localStorage.setItem("setting_session_timeout", sessionTimeout);
    localStorage.setItem("setting_email_masking", String(emailMasking));
    localStorage.setItem("setting_table_density", tableDensity);
    localStorage.setItem("setting_theme_mode", themeMode);
    localStorage.setItem("setting_currency", currency);
    localStorage.setItem("setting_stripe_env", stripeEnv);

    toast.success("Workspace settings updated successfully");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <Settings className="h-5 w-5 text-primary" />
            <span>Workspace & System Settings</span>
          </DialogTitle>
          <DialogDescription>
            Configure platform parameters, security policies, notification channels, and workspace display.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 text-xs">
            <TabsTrigger value="general" className="flex items-center gap-1 text-[11px] px-1">
              <Globe className="h-3.5 w-3.5" />
              <span>General</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-1 text-[11px] px-1">
              <Bell className="h-3.5 w-3.5" />
              <span>Alerts</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-1 text-[11px] px-1">
              <Shield className="h-3.5 w-3.5" />
              <span>Security</span>
            </TabsTrigger>
            <TabsTrigger value="appearance" className="flex items-center gap-1 text-[11px] px-1">
              <Palette className="h-3.5 w-3.5" />
              <span>Display</span>
            </TabsTrigger>
            <TabsTrigger value="payments" className="flex items-center gap-1 text-[11px] px-1">
              <CreditCard className="h-3.5 w-3.5" />
              <span>Payments</span>
            </TabsTrigger>
          </TabsList>

          {/* General Tab */}
          <TabsContent value="general" className="pt-3 space-y-4">
            <div className="grid gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="org-name" className="text-xs font-semibold">Organization Name</Label>
                <Input
                  id="org-name"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label htmlFor="timezone" className="text-xs font-semibold">Default Timezone</Label>
                  <Select value={timezone} onValueChange={setTimezone}>
                    <SelectTrigger id="timezone" className="h-9 text-xs">
                      <SelectValue placeholder="Select timezone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Asia/Kolkata (IST)">Asia/Kolkata (IST +5:30)</SelectItem>
                      <SelectItem value="UTC (GMT)">UTC (GMT +0:00)</SelectItem>
                      <SelectItem value="America/New_York (EST)">America/New_York (EST -5:00)</SelectItem>
                      <SelectItem value="Europe/London (BST)">Europe/London (BST +1:00)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-1.5">
                  <Label htmlFor="language" className="text-xs font-semibold">System Language</Label>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger id="language" className="h-9 text-xs">
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English (US)</SelectItem>
                      <SelectItem value="hi">Hindi (हिन्दी)</SelectItem>
                      <SelectItem value="es">Spanish (Español)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="pt-3 space-y-3">
            <div className="p-3 rounded-lg border border-border bg-card space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="email-alerts" className="text-xs font-semibold cursor-pointer">Email Notifications</Label>
                  <p className="text-[11px] text-muted-foreground">Send transactional emails for event approvals & certificate issuances</p>
                </div>
                <input
                  type="checkbox"
                  id="email-alerts"
                  checked={emailAlerts}
                  onChange={(e) => setEmailAlerts(e.target.checked)}
                  className="h-4 w-4 rounded border-input text-primary cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border">
                <div>
                  <Label htmlFor="whatsapp-alerts" className="text-xs font-semibold cursor-pointer">WhatsApp Webhook Broadcasting</Label>
                  <p className="text-[11px] text-muted-foreground">Broadcast QR entry cards directly to participant WhatsApp numbers</p>
                </div>
                <input
                  type="checkbox"
                  id="whatsapp-alerts"
                  checked={whatsappAlerts}
                  onChange={(e) => setWhatsappAlerts(e.target.checked)}
                  className="h-4 w-4 rounded border-input text-primary cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border">
                <div>
                  <Label htmlFor="sound-effects" className="text-xs font-semibold cursor-pointer">Audio Effects & Scan Feedback</Label>
                  <p className="text-[11px] text-muted-foreground">Play audible beep sound on successful QR check-in scan</p>
                </div>
                <input
                  type="checkbox"
                  id="sound-effects"
                  checked={soundEffects}
                  onChange={(e) => setSoundEffects(e.target.checked)}
                  className="h-4 w-4 rounded border-input text-primary cursor-pointer"
                />
              </div>
            </div>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="pt-3 space-y-3">
            <div className="p-3 rounded-lg border border-border bg-card space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="enforce-2fa" className="text-xs font-semibold cursor-pointer">Enforce Mandatory 2FA TOTP</Label>
                  <p className="text-[11px] text-muted-foreground">Require Two-Factor Authentication for all Admin & Manager logins</p>
                </div>
                <input
                  type="checkbox"
                  id="enforce-2fa"
                  checked={enforce2FA}
                  onChange={(e) => setEnforce2FA(e.target.checked)}
                  className="h-4 w-4 rounded border-input text-primary cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border">
                <div>
                  <Label htmlFor="email-masking" className="text-xs font-semibold cursor-pointer">Field-Level Data Privacy Masking</Label>
                  <p className="text-[11px] text-muted-foreground">Mask participant emails and phone numbers for non-admin viewers</p>
                </div>
                <input
                  type="checkbox"
                  id="email-masking"
                  checked={emailMasking}
                  onChange={(e) => setEmailMasking(e.target.checked)}
                  className="h-4 w-4 rounded border-input text-primary cursor-pointer"
                />
              </div>

              <div className="grid gap-1.5 pt-2 border-t border-border">
                <Label htmlFor="session-timeout" className="text-xs font-semibold">Session Inactivity Timeout</Label>
                <Select value={sessionTimeout} onValueChange={setSessionTimeout}>
                  <SelectTrigger id="session-timeout" className="h-9 text-xs">
                    <SelectValue placeholder="Select timeout" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15m">15 Minutes (High Security)</SelectItem>
                    <SelectItem value="30m">30 Minutes</SelectItem>
                    <SelectItem value="60m">60 Minutes (Standard)</SelectItem>
                    <SelectItem value="24h">24 Hours (Persistent)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>

          {/* Appearance Tab */}
          <TabsContent value="appearance" className="pt-3 space-y-3">
            <div className="grid gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="table-density" className="text-xs font-semibold">Data Table Display Density</Label>
                <Select value={tableDensity} onValueChange={setTableDensity}>
                  <SelectTrigger id="table-density" className="h-9 text-xs">
                    <SelectValue placeholder="Select density" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="comfortable">Comfortable (Standard padding)</SelectItem>
                    <SelectItem value="compact">Compact (High density for large lists)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="theme-mode" className="text-xs font-semibold">Default Theme Preference</Label>
                <Select value={themeMode} onValueChange={setThemeMode}>
                  <SelectTrigger id="theme-mode" className="h-9 text-xs">
                    <SelectValue placeholder="Select theme mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dark">Dark Theme (Recommended)</SelectItem>
                    <SelectItem value="light">Light Theme</SelectItem>
                    <SelectItem value="system">System Synchronized</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments" className="pt-3 space-y-3">
            <div className="p-3 rounded-lg border border-border bg-card space-y-3">
              <div className="grid gap-1.5">
                <Label htmlFor="currency" className="text-xs font-semibold">Default Currency</Label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger id="currency" className="h-9 text-xs">
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INR (₹)">INR - Indian Rupee (₹)</SelectItem>
                    <SelectItem value="USD ($)">USD - US Dollar ($)</SelectItem>
                    <SelectItem value="EUR (€)">EUR - Euro (€)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-1.5 pt-2 border-t border-border">
                <Label htmlFor="stripe-env" className="text-xs font-semibold">Payment Gateway Integration</Label>
                <Select value={stripeEnv} onValueChange={setStripeEnv}>
                  <SelectTrigger id="stripe-env" className="h-9 text-xs">
                    <SelectValue placeholder="Select environment" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="live">Stripe Live Gateway (Active)</SelectItem>
                    <SelectItem value="test">Stripe Test Mode (Sandbox)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSaveSettings}>
            <Save className="h-4 w-4 mr-1.5" />
            Save Settings
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
