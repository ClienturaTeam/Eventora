import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRegisterTeamForEvent } from "../hooks/participant.api";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { Users, ChevronRight, ChevronLeft, Check, ShieldCheck, UserCheck, CreditCard, Loader2 } from "lucide-react";
import { ApiEvent } from "@/modules/events/services/events.api";

export interface TeamMemberInput {
  name: string;
  email: string;
  contactNumber: string;
  college?: string;
}

interface TeamRegistrationWizardProps {
  event: ApiEvent;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onContinueToPayment: (event: ApiEvent) => void;
  onFreeRegistrationSuccess: (event: ApiEvent, details: { teamName: string; leaderName: string; members: TeamMemberInput[] }) => void;
  initialValues?: {
    teamName?: string;
    teamSize?: number;
    members?: TeamMemberInput[];
  };
}

export function TeamRegistrationWizard({
  event,
  open,
  onOpenChange,
  onContinueToPayment,
  onFreeRegistrationSuccess,
  initialValues,
}: TeamRegistrationWizardProps) {
  const { user } = useAuth();
  const registerTeamMutation = useRegisterTeamForEvent();

  const maxTeamSize = event.maxTeamSize ?? 4;

  const [step, setStep] = useState<1 | 2>(1);
  const [teamName, setTeamName] = useState(initialValues?.teamName || "");
  const [competitionId, setCompetitionId] = useState<string>("");
  const [additionalMembers, setAdditionalMembers] = useState<TeamMemberInput[]>(
    initialValues?.members || []
  );

  const currentTotalParticipants = 1 + additionalMembers.length;
  const isMaxReached = currentTotalParticipants >= maxTeamSize;

  // Calculate fees
  const registrationFee = (event.price && event.price > 0) ? event.price : (event.revenue || 0);
  const isPaidEvent = registrationFee > 0;
  const formattedFee = isPaidEvent ? `₹${registrationFee.toLocaleString("en-IN")}` : "Free";

  const leaderName = user ? `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email : "Team Leader";
  const leaderEmail = user?.email || "";

  // Set default competition / track
  useEffect(() => {
    if (event.competitions && event.competitions.length > 0) {
      setCompetitionId(event.competitions[0].id);
    }
  }, [event]);

  // Initialize from props if available
  useEffect(() => {
    if (initialValues) {
      if (initialValues.teamName) setTeamName(initialValues.teamName);
      if (initialValues.members) setAdditionalMembers(initialValues.members);
    }
  }, [initialValues]);

  const handleAddMember = () => {
    if (currentTotalParticipants >= maxTeamSize) {
      toast.error(`Maximum team size reached (${maxTeamSize} participants).`);
      return;
    }
    setAdditionalMembers((prev) => [
      ...prev,
      { name: "", email: "", contactNumber: "", college: "" },
    ]);
  };

  const handleRemoveMember = (indexToRemove: number) => {
    setAdditionalMembers((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const validateStep1 = (): boolean => {
    if (!teamName.trim()) {
      toast.error("Team name is required.");
      return false;
    }

    if (currentTotalParticipants > maxTeamSize) {
      toast.error(`Team cannot have more than ${maxTeamSize} participants for this event.`);
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const seenEmails = new Set<string>();
    seenEmails.add(leaderEmail.toLowerCase());

    for (let i = 0; i < additionalMembers.length; i++) {
      const m = additionalMembers[i];
      if (!m) continue;

      const memberIndexStr = `Member #${i + 2}`;

      if (!m.name.trim()) {
        toast.error(`Full name is required for ${memberIndexStr}.`);
        return false;
      }

      if (!m.email.trim()) {
        toast.error(`Email address is required for ${memberIndexStr}.`);
        return false;
      }

      if (!emailRegex.test(m.email.trim())) {
        toast.error(`Invalid email format for ${memberIndexStr}.`);
        return false;
      }

      const lowerEmail = m.email.trim().toLowerCase();
      if (lowerEmail === leaderEmail.toLowerCase()) {
        toast.error(`${memberIndexStr} cannot use the Team Leader's email.`);
        return false;
      }

      if (seenEmails.has(lowerEmail)) {
        toast.error(`Duplicate email address detected: ${m.email}`);
        return false;
      }
      seenEmails.add(lowerEmail);
    }

    return true;
  };

  const handleNextToReview = () => {
    if (validateStep1()) {
      setStep(2);
    }
  };

  const handleBackToDetails = () => {
    setStep(1);
  };

  const handleSubmitRegistration = async () => {
    if (!validateStep1()) return;

    try {
      await registerTeamMutation.mutateAsync({
        eventId: event.id,
        teamName: teamName.trim(),
        competitionId: competitionId || undefined,
        members: additionalMembers.map((m) => ({
          name: m.name.trim(),
          email: m.email.trim(),
          contactNumber: m.contactNumber.trim(),
          college: m.college?.trim(),
        })) as any,
      });

      onOpenChange(false);

      if (isPaidEvent) {
        onContinueToPayment(event);
      } else {
        toast.success("Registration confirmed!");
        onFreeRegistrationSuccess(event, {
          teamName: teamName.trim(),
          leaderName,
          members: additionalMembers,
        });
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to submit team registration.");
    }
  };

  const deadlineFormatted = event.registrationEnd || event.endTime
    ? new Date(event.registrationEnd || event.endTime).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "N/A";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[620px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="border-b pb-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <DialogTitle className="text-xl font-bold tracking-tight">
                {step === 1 ? "Team Details" : "Review Registration"}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Step {step} of 2 • {event.name}
              </DialogDescription>
            </div>
            <Badge variant={isPaidEvent ? "default" : "secondary"} className="text-sm font-semibold px-3 py-1">
              {formattedFee}
            </Badge>
          </div>
        </DialogHeader>

        {/* Event Header Details Card */}
        <div className="bg-muted/30 border rounded-lg p-3 text-xs grid grid-cols-2 sm:grid-cols-4 gap-2 my-1">
          <div>
            <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Event</span>
            <span className="font-semibold text-foreground truncate block">{event.name}</span>
          </div>
          <div>
            <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Fee</span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">{formattedFee}</span>
          </div>
          <div>
            <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Max Team Size</span>
            <span className="font-semibold text-foreground">
              {maxTeamSize} Participants
            </span>
          </div>
          <div>
            <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Deadline</span>
            <span className="font-semibold text-foreground">{deadlineFormatted}</span>
          </div>
        </div>

        {/* STEP 1: TEAM DETAILS */}
        {step === 1 && (
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="teamName" className="text-xs font-semibold">
                  Team Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="teamName"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="e.g. Code Warriors"
                  className="h-9 text-sm"
                  autoFocus
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Team Size Counter</Label>
                <div className="h-9 border rounded-md px-3 flex items-center justify-between bg-muted/20 text-xs font-mono">
                  <span className="text-muted-foreground">Participants:</span>
                  <Badge variant={isMaxReached ? "secondary" : "outline"} className="font-bold">
                    {currentTotalParticipants} / {maxTeamSize}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Track / Competition selection if available */}
            {event.competitions && event.competitions.length > 1 && (
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Competition Track</Label>
                <Select value={competitionId} onValueChange={setCompetitionId}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Select track" />
                  </SelectTrigger>
                  <SelectContent>
                    {event.competitions.map((c: any) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Team Leader Section */}
            <div className="rounded-lg border bg-surface/50 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                  <UserCheck className="w-4 h-4 text-primary" />
                  <span>Team Leader (Captain)</span>
                </div>
                <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/30">
                  Logged-in User (1 / {maxTeamSize})
                </Badge>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-muted/40 p-2.5 rounded border">
                <div>
                  <span className="text-muted-foreground block text-[10px]">Name</span>
                  <span className="font-semibold">{leaderName}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px]">Email</span>
                  <span className="font-semibold">{leaderEmail}</span>
                </div>
              </div>
            </div>

            {/* Additional Team Members */}
            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" />
                  Additional Team Members ({additionalMembers.length})
                </h4>

                {!isMaxReached ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddMember}
                    className="h-7 text-xs gap-1 text-primary hover:text-primary"
                  >
                    + Add Member
                  </Button>
                ) : (
                  <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                    Maximum team size reached ({maxTeamSize} participants).
                  </span>
                )}
              </div>

              {additionalMembers.length === 0 ? (
                <div className="p-3 border border-dashed rounded-lg text-center text-xs text-muted-foreground space-y-1">
                  <p>No additional members added yet.</p>
                  {!isMaxReached && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleAddMember}
                      className="text-xs text-primary font-medium"
                    >
                      + Add Member ({currentTotalParticipants}/{maxTeamSize})
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {additionalMembers.map((member, idx) => (
                    <div key={idx} className="rounded-lg border bg-card p-3 space-y-2 text-xs shadow-xs relative">
                      <div className="font-semibold text-primary text-xs pb-1 border-b flex justify-between items-center">
                        <span>Member #{idx + 2} Details</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveMember(idx)}
                          className="h-6 px-2 text-xs text-destructive hover:text-destructive hover:bg-destructive/10 gap-1"
                        >
                          Remove Member
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label className="text-[11px]">Full Name *</Label>
                          <Input
                            value={member.name}
                            onChange={(e) => {
                              const val = e.target.value;
                              setAdditionalMembers((prev) =>
                                prev.map((item, i) => (i === idx ? { ...item, name: val } : item))
                              );
                            }}
                            placeholder="John Doe"
                            className="h-8 text-xs"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[11px]">Email Address *</Label>
                          <Input
                            type="email"
                            value={member.email}
                            onChange={(e) => {
                              const val = e.target.value;
                              setAdditionalMembers((prev) =>
                                prev.map((item, i) => (i === idx ? { ...item, email: val } : item))
                              );
                            }}
                            placeholder="john@example.com"
                            className="h-8 text-xs"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[11px]">Phone Number</Label>
                          <Input
                            value={member.contactNumber}
                            onChange={(e) => {
                              const val = e.target.value;
                              setAdditionalMembers((prev) =>
                                prev.map((item, i) => (i === idx ? { ...item, contactNumber: val } : item))
                              );
                            }}
                            placeholder="+91 9876543210"
                            className="h-8 text-xs"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[11px]">College / Institute</Label>
                          <Input
                            value={member.college || ""}
                            onChange={(e) => {
                              const val = e.target.value;
                              setAdditionalMembers((prev) =>
                                prev.map((item, i) => (i === idx ? { ...item, college: val } : item))
                              );
                            }}
                            placeholder="University / College"
                            className="h-8 text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 2: REVIEW TEAM DETAILS */}
        {step === 2 && (
          <div className="space-y-4 py-2">
            <div className="rounded-xl border bg-card/70 p-4 space-y-3 text-xs shadow-sm">
              <div className="flex justify-between items-center pb-2 border-b">
                <span className="text-muted-foreground font-medium">Event Name</span>
                <span className="font-bold text-foreground">{event.name}</span>
              </div>

              <div className="flex justify-between items-center pb-2 border-b">
                <span className="text-muted-foreground font-medium">Team Name</span>
                <span className="font-bold text-primary text-sm">{teamName}</span>
              </div>

              <div className="flex justify-between items-center pb-2 border-b">
                <span className="text-muted-foreground font-medium">Total Team Participants</span>
                <span className="font-semibold text-foreground">{currentTotalParticipants} / {maxTeamSize} Participants</span>
              </div>

              <div className="flex justify-between items-center pb-2 border-b">
                <span className="text-muted-foreground font-medium">Registration Fee</span>
                <span className="font-bold text-base text-emerald-600 dark:text-emerald-400">
                  {formattedFee}
                </span>
              </div>

              {/* Roster Summary */}
              <div className="pt-1 space-y-2">
                <span className="font-semibold text-xs text-foreground block">Team Roster:</span>
                
                {/* Leader */}
                <div className="flex items-center justify-between p-2 rounded bg-muted/40 border">
                  <div>
                    <span className="font-semibold block">{leaderName}</span>
                    <span className="text-[10px] text-muted-foreground">{leaderEmail}</span>
                  </div>
                  <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary">
                    Leader
                  </Badge>
                </div>

                {/* Additional members */}
                {additionalMembers.map((m, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 rounded bg-muted/20 border">
                    <div>
                      <span className="font-semibold block">{m.name}</span>
                      <span className="text-[10px] text-muted-foreground">{m.email} {m.contactNumber ? `• ${m.contactNumber}` : ""}</span>
                    </div>
                    <Badge variant="outline" className="text-[10px] text-muted-foreground">
                      Member #{idx + 2}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg bg-muted/30 p-3 border text-xs text-muted-foreground flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
              <span>
                {isPaidEvent
                  ? "Clicking 'Continue to Payment' will open secure Stripe payment checkout."
                  : "Clicking 'Confirm Registration' will confirm your team registration."}
              </span>
            </div>
          </div>
        )}

        <DialogFooter className="flex items-center justify-between sm:justify-between border-t pt-3">
          {step === 1 ? (
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          ) : (
            <Button variant="outline" onClick={handleBackToDetails} disabled={registerTeamMutation.isPending}>
              <ChevronLeft className="w-4 h-4 mr-1" /> Back
            </Button>
          )}

          {step === 1 ? (
            <Button onClick={handleNextToReview}>
              Next: Review Team <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmitRegistration}
              disabled={registerTeamMutation.isPending}
              className="bg-primary text-primary-foreground font-semibold"
            >
              {registerTeamMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...
                </>
              ) : isPaidEvent ? (
                <>
                  <CreditCard className="w-4 h-4 mr-2" /> Continue to Payment
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" /> Confirm Registration
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
