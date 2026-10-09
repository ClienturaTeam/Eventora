import type { ReactNode } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./app-sidebar";
import { Topbar } from "./topbar";
import { MobileBottomNav } from "./mobile-bottom-nav";
import { MfaSetupOverlay } from "../mfa/mfa-setup-overlay";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar />
          <main className="min-w-0 flex-1 px-3.5 py-4 pb-20 sm:px-6 sm:py-6 sm:pb-8 lg:px-8">
            <div className="mx-auto w-full max-w-[1400px] space-y-5 sm:space-y-6">{children}</div>
          </main>
        </div>
      </div>
      <MobileBottomNav />
      <MfaSetupOverlay />
    </SidebarProvider>
  );
}
