import { FormPageTemplate } from "@/components/templates/form-page";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function ConfigurationPage() {
  return (
    <FormPageTemplate
      title="Platform Configuration"
      description="System-wide defaults, feature flags and integrations."
      crumbs={[{ label: "Platform" }, { label: "Configuration" }]}
      steps={[
        {
          title: "General",
          description: "Global platform settings",
          content: (
            <div className="grid gap-5">
              <div className="space-y-1.5">
                <Label htmlFor="platform-name">Platform Name</Label>
                <Input id="platform-name" defaultValue="Eventora Enterprise" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="localization">Default Localization</Label>
                <Select defaultValue="en-us">
                  <SelectTrigger id="localization">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en-us">English (US)</SelectItem>
                    <SelectItem value="en-uk">English (UK)</SelectItem>
                    <SelectItem value="es">Spanish</SelectItem>
                    <SelectItem value="fr">French</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border bg-surface/60 p-4">
                <div>
                  <p className="text-sm font-medium">Maintenance Mode</p>
                  <p className="text-xs text-muted-foreground">
                    Temporarily disable access for non-admins.
                  </p>
                </div>
                <Switch />
              </div>
            </div>
          ),
        },
        {
          title: "Security Defaults",
          description: "Global security requirements",
          content: (
            <div className="grid gap-5">
              <div className="flex items-center justify-between rounded-lg border border-border bg-surface/60 p-4">
                <div>
                  <p className="text-sm font-medium">Require MFA for Admins</p>
                  <p className="text-xs text-muted-foreground">
                    Force multi-factor authentication for all platform and org admins.
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border bg-surface/60 p-4">
                <div>
                  <p className="text-sm font-medium">Single Sign-On (SSO)</p>
                  <p className="text-xs text-muted-foreground">
                    Enable enterprise SSO via SAML/OIDC.
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
            </div>
          ),
        },
        {
          title: "Feature Flags",
          description: "Toggle experimental modules",
          content: (
            <div className="grid gap-5">
              <div className="flex items-center justify-between rounded-lg border border-border bg-surface/60 p-4">
                <div>
                  <p className="text-sm font-medium">AI Validation Beta</p>
                  <p className="text-xs text-muted-foreground">
                    Enable experimental AI-driven plagiarism detection.
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
            </div>
          ),
        },
      ]}
    />
  );
}
