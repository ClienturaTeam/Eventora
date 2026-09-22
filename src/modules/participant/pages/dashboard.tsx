import { useParticipantDashboard } from "../hooks/participant.api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Users, CheckCircle2, CreditCard, FileCode, Upload, Bell, Award, Lock, ArrowUpRight } from "lucide-react";
import { Link } from "@tanstack/react-router";

export function ParticipantDashboard() {
  const { data: stats, isLoading, error } = useParticipantDashboard();

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-destructive">
        Failed to load team dashboard statistics.
      </div>
    );
  }

  const teamName = stats?.team?.name || "Participant Team";
  const teamSize = stats?.team?.size || stats?.team?.membersCount || 1;

  return (
    <div className="space-y-6">
      {/* Header displaying Hello [TEAM NAME] */}
      <div className="flex flex-col gap-1 border-b pb-4">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Hello {teamName}
        </h1>
        <p className="text-muted-foreground text-sm">
          Welcome to your Eventora Hackathon portal. Track your team status, problem statement selection, and project submission.
        </p>
      </div>

      {/* Grid of Hackathon Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Team */}
        <Card className="hover:border-primary/50 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Info</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold truncate">{teamName}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Size: <span className="font-semibold text-foreground">{teamSize} Members</span>
            </p>
            <Link to="/participant/teams" className="inline-flex items-center gap-1 text-xs text-primary font-medium mt-2 hover:underline">
              View Team Members <ArrowUpRight className="h-3 w-3" />
            </Link>
          </CardContent>
        </Card>

        {/* Card 2: Registration Status */}
        <Card className="hover:border-primary/50 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Registration</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
                {stats?.registration?.status || "REGISTERED"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Event: Eventora Hackathon 2026
            </p>
          </CardContent>
        </Card>

        {/* Card 3: Payment */}
        <Card className="hover:border-primary/50 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Payment Status</CardTitle>
            <CreditCard className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 font-bold">
                {stats?.payment?.status || "PAID"}
              </Badge>
              <span className="text-xs font-semibold text-foreground">{stats?.payment?.amount || "₹500"}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1 font-mono">
              Txn: {stats?.payment?.transactionId || "TXN-DEMO-001"}
            </p>
            <Link to="/participant/transactions" className="inline-flex items-center gap-1 text-xs text-primary font-medium mt-1 hover:underline">
              View Receipt <ArrowUpRight className="h-3 w-3" />
            </Link>
          </CardContent>
        </Card>

        {/* Card 4: Problem Statement */}
        <Card className="hover:border-primary/50 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Problem Statement</CardTitle>
            <FileCode className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            {stats?.problemStatement?.selected ? (
              <div>
                <div className="flex items-center gap-1.5">
                  <Badge variant="secondary" className="font-mono text-xs">
                    {stats.problemStatement.code}
                  </Badge>
                  {stats.problemStatement.locked && (
                    <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30 text-[10px] gap-1">
                      <Lock className="h-3 w-3" /> Locked
                    </Badge>
                  )}
                </div>
                <p className="text-xs font-medium text-foreground truncate mt-1">
                  {stats.problemStatement.title}
                </p>
              </div>
            ) : (
              <div>
                <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30">
                  Not Selected
                </Badge>
                <p className="text-xs text-muted-foreground mt-1">Select 1 problem statement</p>
              </div>
            )}
            <Link to="/participant/discover-events" className="inline-flex items-center gap-1 text-xs text-primary font-medium mt-2 hover:underline">
              Select Statement <ArrowUpRight className="h-3 w-3" />
            </Link>
          </CardContent>
        </Card>

        {/* Card 5: Submission */}
        <Card className="hover:border-primary/50 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Submission</CardTitle>
            <Upload className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Badge variant={stats?.submission?.isLocked ? "default" : "outline"} className={stats?.submission?.isLocked ? "bg-emerald-600" : ""}>
                {stats?.submission?.status || "DRAFT"}
              </Badge>
              {stats?.submission?.isLocked && (
                <span className="text-xs text-amber-600 font-medium flex items-center gap-1">
                  <Lock className="h-3 w-3" /> Finalized
                </span>
              )}
            </div>
            <Link to="/participant/submissions" className="inline-flex items-center gap-1 text-xs text-primary font-medium mt-3 hover:underline">
              Manage Uploads <ArrowUpRight className="h-3 w-3" />
            </Link>
          </CardContent>
        </Card>

        {/* Card 6: Notifications */}
        <Card className="hover:border-primary/50 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Notifications</CardTitle>
            <Bell className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.notifications?.unreadCount || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Unread Updates</p>
            <Link to="/participant/notifications" className="inline-flex items-center gap-1 text-xs text-primary font-medium mt-2 hover:underline">
              View Notifications <ArrowUpRight className="h-3 w-3" />
            </Link>
          </CardContent>
        </Card>

        {/* Card 7: Achievements */}
        <Card className="hover:border-primary/50 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Achievements</CardTitle>
            <Award className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.achievements?.count || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Badges Earned</p>
            <Link to="/participant/achievements" className="inline-flex items-center gap-1 text-xs text-primary font-medium mt-2 hover:underline">
              View Achievements <ArrowUpRight className="h-3 w-3" />
            </Link>
          </CardContent>
        </Card>

        {/* Card 8: Prize Money (Only when officially published) */}
        {stats?.prize?.published && (
          <Card className="border-amber-500/50 bg-amber-500/5 hover:border-amber-500 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-amber-600 dark:text-amber-400">Prize Money</CardTitle>
              <Award className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stats.prize.amount || "₹50,000"}</div>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className={stats.prize.status === "PAID" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30" : "bg-amber-500/10 text-amber-600 border-amber-500/30"}>
                  Status: {stats.prize.status}
                </Badge>
                <span className="text-xs font-medium text-muted-foreground">{stats.prize.result?.replace('_', ' ')}</span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
