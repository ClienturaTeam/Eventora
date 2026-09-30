import { useMyTeams } from "../hooks/participant.api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Users, UserCheck, ShieldCheck, Mail, Phone, Building, GraduationCap } from "lucide-react";

export function ParticipantTeamsPage() {
  const { data = [], isLoading } = useMyTeams();

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        No team information found.
      </div>
    );
  }

  const primaryMembership = data[0];
  const team = primaryMembership?.team;
  const members = team?.members || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1 border-b pb-4">
        <div className="flex items-center gap-2">
          <Users className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Team Details</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          View all registered team members and participant information for your team.
        </p>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="bg-muted/30 border-b">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle className="text-xl font-bold text-foreground">{team?.name || "Team Alpha"}</CardTitle>
              <CardDescription className="text-xs mt-1">
                Track: {team?.competition?.name || "Eventora Hackathon Main Track"}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                Team Size: {team?.size || members.length} Members
              </Badge>
              {team?.problemStatement && (
                <Badge variant="secondary" className="font-mono text-xs">
                  {team.problemStatement.code}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            Team Members Roster ({members.length})
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {members.map((member: any, idx: number) => {
              const isLead = member.isLead;
              const name = member.name || member.user?.firstName ? `${member.user?.firstName || ''} ${member.user?.lastName || ''}`.trim() : `Participant ${idx + 1}`;
              const email = member.email || member.user?.email || "—";
              const contactNumber = member.contactNumber || "—";
              const college = member.college || "—";
              const department = member.department || "—";

              return (
                <Card key={member.id || idx} className={`border ${isLead ? "border-primary/40 bg-primary/5" : "border-border"}`}>
                  <CardHeader className="p-4 pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className={`p-2 rounded-full ${isLead ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                          {isLead ? <ShieldCheck className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                        </div>
                        <div>
                          <CardTitle className="text-base font-bold">{name}</CardTitle>
                          <p className="text-xs text-muted-foreground font-medium">
                            {isLead ? "Team Lead (Captain)" : `Participant ${idx + 1}`}
                          </p>
                        </div>
                      </div>
                      <Badge variant={isLead ? "default" : "outline"} className="text-xs">
                        {isLead ? "Lead" : "Member"}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="p-4 pt-2 text-xs space-y-2">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span className="truncate font-mono">{email}</span>
                    </div>

                    {contactNumber !== "—" && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="h-3.5 w-3.5 text-primary shrink-0" />
                        <span>{contactNumber}</span>
                      </div>
                    )}

                    {college !== "—" && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Building className="h-3.5 w-3.5 text-primary shrink-0" />
                        <span>{college}</span>
                      </div>
                    )}

                    {department !== "—" && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <GraduationCap className="h-3.5 w-3.5 text-primary shrink-0" />
                        <span>{department}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
