import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  Trophy,
  Calendar,
  ClipboardList,
  Users,
  CheckCircle,
  FileText,
  Bell,
  Shield,
  LayoutDashboard,
  ArrowRight,
  Target,
  BarChart,
  Settings,
} from "lucide-react";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

function getDashboardUrl(user: any) {
  if (!user || !user.memberships || user.memberships.length === 0) return "/events";
  if (user.memberships[0]?.status === "PENDING") return "/pending-approval";
  const roleName = user.memberships[0]?.role?.name;
  if (roleName === "Sudo Admin" || roleName === "Platform Admin") return "/platform-admin";
  if (roleName === "Admin" || roleName === "Organization Admin" || roleName === "Manager") return "/manager";
  if (roleName === "Student Coordinator") return "/coordinator";
  if (roleName === "Participant") return "/participant";
  if (roleName === "Judge") return "/evaluations";
  if (roleName === "Mentor") return "/teams";
  if (roleName === "Volunteer") return "/volunteers";
  return "/events";
}

function LandingPage() {
  const { user, isAuthenticated } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const dashboardUrl = getDashboardUrl(user);

  return (
    <div className="min-h-screen bg-[#020817] font-sans text-slate-300 selection:bg-blue-500/30">
      {/* Navigation */}
      <header
        className={`fixed inset-x-0 top-0 z-50 flex items-center justify-between px-6 py-4 transition-all duration-300 md:px-12 ${
          isScrolled ? "bg-[#020817]/80 shadow-md shadow-blue-900/10 backdrop-blur-md border-b border-slate-800/50" : "bg-transparent border-b border-transparent"
        }`}
      >
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 shadow-lg shadow-blue-600/20">
            <Trophy className="h-5 w-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-bold leading-none text-white tracking-tight">
              ASCENT
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-widest text-blue-400">
              Event Management
            </span>
          </div>
        </div>

        <nav className="hidden items-center gap-8 md:flex">
          <a href="#features" className="text-sm font-medium text-slate-300 transition-colors hover:text-blue-400">
            Features
          </a>
          <a href="#how-it-works" className="text-sm font-medium text-slate-300 transition-colors hover:text-blue-400">
            How It Works
          </a>
          <a href="#roles" className="text-sm font-medium text-slate-300 transition-colors hover:text-blue-400">
            Roles
          </a>
        </nav>

        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <Button asChild className="rounded-full bg-blue-600 px-6 font-semibold text-white shadow-md transition-all hover:bg-blue-500 hover:shadow-lg hover:shadow-blue-900/20">
              <Link to={dashboardUrl}>
                Go to Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost" className="hidden font-medium text-slate-300 hover:text-white hover:bg-white/10 md:inline-flex">
                <Link to="/login">Sign In</Link>
              </Button>
              <Button asChild className="rounded-full bg-blue-600 px-6 font-semibold text-white shadow-md transition-all hover:bg-blue-500 hover:shadow-lg hover:shadow-blue-900/20">
                <Link to="/signup">Create Account</Link>
              </Button>
            </>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-32 pb-24 lg:pt-48 lg:pb-32">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay pointer-events-none"></div>
        
        {/* Subtle glowing orbs */}
        <div className="absolute -left-[10%] top-0 h-[500px] w-[500px] rounded-full bg-blue-600/10 blur-[120px] pointer-events-none"></div>
        <div className="absolute -right-[10%] bottom-0 h-[600px] w-[600px] rounded-full bg-indigo-600/10 blur-[120px] pointer-events-none"></div>

        <div className="container relative mx-auto grid items-center gap-16 px-6 md:px-12 lg:grid-cols-2">
          <div className="max-w-2xl text-center lg:text-left">
            <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl xl:text-7xl">
              Manage Every Event. <br className="hidden lg:block" />
              <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
                From Proposal to Impact.
              </span>
            </h1>
            <p className="mt-6 text-lg text-slate-400 sm:text-xl">
              Plan, approve, organize, execute, and report your events from one centralized platform.
            </p>
            <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row lg:justify-start">
              {isAuthenticated ? (
                <Button asChild size="lg" className="h-14 rounded-full bg-blue-600 px-8 text-base font-semibold text-white shadow-xl shadow-blue-900/20 transition-all hover:bg-blue-500 hover:shadow-blue-900/40">
                  <Link to={dashboardUrl}>
                    Go to Dashboard
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              ) : (
                <>
                  <Button asChild size="lg" className="h-14 rounded-full bg-blue-600 px-8 text-base font-semibold text-white shadow-xl shadow-blue-900/20 transition-all hover:bg-blue-500 hover:shadow-blue-900/40">
                    <Link to="/signup">Create Account</Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="h-14 rounded-full border-slate-700 bg-slate-800/50 px-8 text-base font-semibold text-white backdrop-blur-sm transition-all hover:bg-slate-700 hover:text-white">
                    <Link to="/login">Sign In</Link>
                  </Button>
                </>
              )}
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-lg lg:max-w-none">
            {/* Visual Lifecycle Illustration */}
            <div className="relative rounded-3xl border border-slate-800 bg-[#0a1128]/80 p-8 shadow-2xl backdrop-blur-xl">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5 rounded-3xl pointer-events-none"></div>
              
              <div className="relative flex h-full flex-col gap-6">
                {[
                  { label: "Proposal", icon: FileText, delay: "0s", color: "text-blue-400", bg: "bg-blue-400/10", border: "border-blue-400/20" },
                  { label: "Manager Review", icon: CheckCircle, delay: "0.1s", color: "text-emerald-400", bg: "bg-emerald-400/10", border: "border-emerald-400/20" },
                  { label: "Principal Approval", icon: Shield, delay: "0.2s", color: "text-teal-400", bg: "bg-teal-400/10", border: "border-teal-400/20" },
                  { label: "Event Creation", icon: Calendar, delay: "0.3s", color: "text-indigo-400", bg: "bg-indigo-400/10", border: "border-indigo-400/20" },
                  { label: "Coordinator Assignment", icon: Users, delay: "0.4s", color: "text-violet-400", bg: "bg-violet-400/10", border: "border-violet-400/20" },
                  { label: "Event Execution", icon: Target, delay: "0.5s", color: "text-fuchsia-400", bg: "bg-fuchsia-400/10", border: "border-fuchsia-400/20" },
                  { label: "Final Report", icon: BarChart, delay: "0.6s", color: "text-rose-400", bg: "bg-rose-400/10", border: "border-rose-400/20" },
                ].map((step, i) => (
                  <div key={i} className="flex items-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both relative" style={{ animationDelay: step.delay }}>
                    <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border ${step.border} ${step.bg} z-10`}>
                      <step.icon className={`h-5 w-5 ${step.color}`} />
                    </div>
                    <div className="flex-1 rounded-2xl border border-slate-800 bg-slate-900/50 p-3 backdrop-blur-sm z-10 transition-colors hover:border-slate-700 hover:bg-slate-800/80">
                      <p className="font-semibold text-white text-sm">{step.label}</p>
                    </div>
                  </div>
                ))}
                
                {/* Connecting Lines */}
                <div className="absolute left-6 top-6 bottom-6 w-[2px] bg-slate-800 z-0">
                  <div className="w-full h-full bg-gradient-to-b from-blue-500/50 via-purple-500/50 to-rose-500/50"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 border-t border-slate-800/50 bg-[#020817] relative">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-900/5 to-transparent pointer-events-none"></div>
        <div className="container relative mx-auto px-6 md:px-12">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Everything You Need to Manage Events
            </h2>
            <p className="mt-4 text-lg text-slate-400">
              A comprehensive suite of tools built specifically for managing the entire lifecycle of professional and academic events.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[
              { title: "Hackathon Proposals", icon: FileText, desc: "Create and manage detailed event proposals." },
              { title: "Manager Review", icon: CheckCircle, desc: "Managers review and approve submitted proposals." },
              { title: "Principal Approval", icon: Shield, desc: "Final organizational approval before event creation." },
              { title: "Event Management", icon: Calendar, desc: "Create and manage approved events seamlessly." },
              { title: "Coordinator Assignment", icon: Users, desc: "Managers can explicitly assign events to Student/Faculty Coordinators." },
              { title: "Event Execution", icon: Target, desc: "Track registrations, attendance, teams and event activities." },
              { title: "Final Reports", icon: ClipboardList, desc: "Assigned coordinators prepare event reports with supporting documents." },
              { title: "AI-Powered Reporting", icon: BarChart, desc: "Generate structured final reports from verified event information." },
            ].map((feature, i) => (
              <div key={i} className="group relative rounded-2xl border border-slate-800 bg-slate-900/50 p-6 shadow-sm transition-all hover:shadow-md hover:border-blue-500/30 hover:bg-slate-800/50">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-800 text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-colors border border-slate-700">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-white">{feature.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Lifecycle / How It Works Section */}
      <section id="how-it-works" className="py-24 bg-[#0a1128] border-t border-slate-800/50">
        <div className="container mx-auto px-6 md:px-12">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              From Idea to Impact
            </h2>
            <p className="mt-4 text-lg text-slate-400 mb-8">
              Experience a structured, transparent, and efficient workflow that brings everyone together on the same page.
            </p>
          </div>
          
          <div className="max-w-4xl mx-auto space-y-6">
            {[
              { step: "STEP 1", title: "Create Proposal", desc: "Student Coordinator creates an event proposal." },
              { step: "STEP 2", title: "Manager Review", desc: "Manager reviews and approves the proposal." },
              { step: "STEP 3", title: "Principal Approval", desc: "Principal gives final approval." },
              { step: "STEP 4", title: "Create Event", desc: "Authorized Manager/Admin creates the event." },
              { step: "STEP 5", title: "Assign Coordinator", desc: "Manager explicitly assigns the event to a Student/Faculty Coordinator." },
              { step: "STEP 6", title: "Execute Event", desc: "Coordinator manages the assigned event and execution." },
              { step: "STEP 7", title: "Final Report", desc: "Coordinator enters report information, uploads supporting documents, generates the AI report, reviews it and finalizes it." },
            ].map((item, i) => (
              <div key={i} className="flex flex-col sm:flex-row gap-4 sm:gap-6 bg-slate-900/50 p-6 rounded-2xl border border-slate-800 transition-colors hover:border-slate-700 hover:bg-slate-800/50">
                <div className="flex h-10 shrink-0 items-center justify-center rounded-lg bg-blue-900/30 px-4 text-xs font-bold tracking-wider text-blue-400 border border-blue-800/50">
                  {item.step}
                </div>
                <div className="flex-1 flex flex-col justify-center">
                  <h4 className="font-semibold text-white text-lg">{item.title}</h4>
                  <p className="text-slate-400 mt-1">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Role-Based Section */}
      <section id="roles" className="py-24 border-t border-slate-800/50 bg-[#020817] relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/10 via-transparent to-transparent pointer-events-none"></div>
        <div className="container relative mx-auto px-6 md:px-12">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Built for Every Role
            </h2>
            <p className="mt-4 text-lg text-slate-400">
              Eventora respects the organizational hierarchy and provides tailored workflows for everyone involved.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                role: "STUDENT COORDINATOR",
                icon: Target,
                color: "text-blue-400",
                bg: "bg-blue-500/10",
                border: "border-blue-500/20",
                tasks: ["Create proposals", "Edit drafts", "Submit proposals", "View proposal status", "View assigned events", "Execute assigned events", "Prepare final reports"],
              },
              {
                role: "MANAGER",
                icon: LayoutDashboard,
                color: "text-indigo-400",
                bg: "bg-indigo-500/10",
                border: "border-indigo-500/20",
                tasks: ["Review proposals", "Approve proposals", "Create approved events", "Assign coordinators", "Manage event operations"],
              },
              {
                role: "PRINCIPAL / ADMIN",
                icon: Shield,
                color: "text-emerald-400",
                bg: "bg-emerald-500/10",
                border: "border-emerald-500/20",
                tasks: ["Review final proposals", "Give approval", "Manage authorized administrative operations"],
              },
              {
                role: "FACULTY COORDINATOR",
                icon: Users,
                color: "text-amber-400",
                bg: "bg-amber-500/10",
                border: "border-amber-500/20",
                tasks: ["Manage assigned events", "Participate in event execution", "Work with event reporting where permitted"],
              },
              {
                role: "PARTICIPANT",
                icon: Trophy,
                color: "text-purple-400",
                bg: "bg-purple-500/10",
                border: "border-purple-500/20",
                tasks: ["Register for events", "Participate in events", "Access participant functionality"],
              },
            ].map((role, i) => (
              <div key={i} className="flex flex-col rounded-3xl border border-slate-800 bg-slate-900/50 p-8 transition-shadow hover:shadow-lg hover:border-slate-700">
                <div className="mb-6 flex items-center gap-4">
                  <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${role.bg} ${role.color} ${role.border} border`}>
                    <role.icon className="h-7 w-7" />
                  </div>
                  <h3 className="text-xl font-bold text-white leading-tight">{role.role}</h3>
                </div>
                <ul className="flex-1 space-y-3">
                  {role.tasks.map((task, j) => (
                    <li key={j} className="flex items-start gap-3 text-slate-400">
                      <CheckCircle className={`mt-0.5 h-4 w-4 shrink-0 ${role.color}`} />
                      <span className="text-sm">{task}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Eventora Section */}
      <section className="py-24 bg-[#0a1128] border-t border-slate-800/50 relative overflow-hidden">
        <div className="absolute inset-0 bg-blue-900/5 pointer-events-none"></div>
        <div className="container relative mx-auto px-6 md:px-12 text-center max-w-5xl">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl mb-12">
            Why Choose Eventora?
          </h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 text-left">
            {[
              { title: "Centralized Event Management", desc: "Everything related to an event in one place." },
              { title: "Role-Based Access", desc: "Every role gets only the functionality they are authorized to use." },
              { title: "Structured Approval Workflow", desc: "Proposal → Manager → Principal → Event." },
              { title: "Transparent Event Execution", desc: "Track important event execution information." },
              { title: "Professional Reporting", desc: "Create structured final event reports." },
              { title: "AI-Assisted Reporting", desc: "Generate reports using verified event information rather than invented data." },
            ].map((benefit, i) => (
              <div key={i} className="rounded-2xl bg-slate-900/80 p-6 border border-slate-800 backdrop-blur-sm transition-colors hover:border-slate-700 hover:bg-slate-800/80">
                <h4 className="font-semibold text-white mb-2">{benefit.title}</h4>
                <p className="text-sm text-slate-400">{benefit.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-[#020817] border-t border-slate-800/50 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-600/10 to-transparent pointer-events-none"></div>
        <div className="container relative mx-auto px-6 text-center md:px-12">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Ready to Manage Your Next Event?
          </h2>
          <p className="mt-4 text-xl text-slate-400 mb-10 max-w-2xl mx-auto">
            Bring proposals, approvals, coordination, execution and reporting together in one platform.
          </p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            {isAuthenticated ? (
              <Button asChild size="lg" className="h-14 rounded-full bg-blue-600 px-8 text-base font-bold text-white hover:bg-blue-500">
                <Link to={dashboardUrl}>Go to Dashboard</Link>
              </Button>
            ) : (
              <>
                <Button asChild size="lg" className="h-14 rounded-full bg-blue-600 px-8 text-base font-bold text-white shadow-lg shadow-blue-900/20 hover:bg-blue-500">
                  <Link to="/signup">Create Account</Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="h-14 rounded-full border-slate-700 bg-slate-800/50 px-8 text-base font-bold text-white hover:bg-slate-700 hover:text-white">
                  <Link to="/login">Sign In</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0a1128] border-t border-slate-800 py-12">
        <div className="container mx-auto px-6 md:px-12">
          <div className="grid gap-8 md:grid-cols-4 lg:grid-cols-5">
            <div className="lg:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 shadow-sm shadow-blue-900/20">
                  <Trophy className="h-4 w-4 text-white" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xl font-bold leading-none text-white tracking-tight">EVENTORA</span>
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-blue-400">Event Management</span>
                </div>
              </div>
              <p className="text-sm text-slate-500 mb-6 max-w-xs">
                Plan, organize, and execute impactful events from one centralized platform.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-white mb-4">Quick Links</h4>
              <ul className="space-y-3 text-sm text-slate-400">
                <li><a href="#" className="hover:text-blue-400 transition-colors">Home</a></li>
                <li><a href="#features" className="hover:text-blue-400 transition-colors">Features</a></li>
                <li><a href="#how-it-works" className="hover:text-blue-400 transition-colors">How It Works</a></li>
                <li><a href="#roles" className="hover:text-blue-400 transition-colors">Roles</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-white mb-4">Account</h4>
              <ul className="space-y-3 text-sm text-slate-400">
                <li><Link to="/login" className="hover:text-blue-400 transition-colors">Sign In</Link></li>
                <li><Link to="/signup" className="hover:text-blue-400 transition-colors">Create Account</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="mt-12 pt-8 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-slate-500">
              © 2026 Eventora Event Management
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
