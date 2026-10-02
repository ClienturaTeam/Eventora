import { useState, useMemo, useEffect } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  useMySubmissions,
  useParticipantSubmission,
  useUploadSubmissionFile,
  useFinalSubmitSubmission,
  useParticipantDashboard,
  useMyTeams,
  useMyRegistrations,
  useCreateParticipantSubmission,
  useEventAccessStatus,
  participantKeys,
} from "../hooks/participant.api";
import { useEventRounds } from "@/modules/events/services/events.api";
import { useAskMentorQuestion, useMentorQuestions } from "@/modules/mentors/services/mentors.api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Loader2, Upload, Lock, FileText, CheckCircle2, AlertCircle, AlertTriangle, Paperclip, MessageSquare, Award, Star, Eye, FileCode, Clock } from "lucide-react";
import { toast } from "sonner";

const ALLOWED_EXTENSIONS = ["png", "jpg", "jpeg", "pdf", "doc", "docx", "mp4", "mov", "avi"];
const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024; // 20 MB

export function ParticipantSubmissionsPage() {
  const search = useSearch({ strict: false }) as { eventId?: string };
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Dynamic server/live time ticker
  const [nowTime, setNowTime] = useState<Date>(new Date());
  useEffect(() => {
    const timer = setInterval(() => setNowTime(new Date()), 5000);
    return () => clearInterval(timer);
  }, []);

  const { data: dashboardData, isLoading: loadingDashboard } = useParticipantDashboard();
  const { data: myTeams = [], isLoading: loadingTeams } = useMyTeams();
  const { data: registrations = [], isLoading: loadingRegistrations } = useMyRegistrations();
  
  const uploadFileMutation = useUploadSubmissionFile();
  const finalSubmitMutation = useFinalSubmitSubmission();
  const createSubmissionMutation = useCreateParticipantSubmission();
  const askMentorMutation = useAskMentorQuestion();

  // Aggregate real eligible events from participant registrations & teams
  const eligibleEvents = useMemo(() => {
    const map = new Map<string, { id: string; name: string; status: string; event: any }>();

    (registrations || []).forEach((reg: any) => {
      const eventObj = reg.event;
      if (eventObj && eventObj.id) {
        map.set(eventObj.id, {
          id: eventObj.id,
          name: eventObj.name || eventObj.title || "Event",
          status: reg.status || "PENDING",
          event: eventObj
        });
      }
    });

    (myTeams || []).forEach((tMember: any) => {
      const team = tMember.team;
      const eventObj = team?.competition?.event;
      if (eventObj && eventObj.id && !map.has(eventObj.id)) {
        map.set(eventObj.id, {
          id: eventObj.id,
          name: eventObj.name || eventObj.title || "Event",
          status: "REGISTERED",
          event: eventObj
        });
      }
    });

    return Array.from(map.values());
  }, [registrations, myTeams]);

  // Determine active selected event ID
  const activeEventId = useMemo(() => {
    if (search.eventId && eligibleEvents.some(e => e.id === search.eventId)) {
      return search.eventId;
    }
    return eligibleEvents[0]?.id || dashboardData?.event?.id || "";
  }, [search.eventId, eligibleEvents, dashboardData]);

  // Access status gate & submissions for activeEventId
  const { data: accessStatus, isLoading: loadingAccess } = useEventAccessStatus(activeEventId);
  const { data: submissions = [], isLoading: loadingSubmissions } = useMySubmissions(activeEventId);

  // Find active team & event & selected Problem Statement for activeEventId
  const activeTeamMember = useMemo(() => {
    if (!activeEventId) return null;
    return (myTeams || []).find((m: any) =>
      m.team?.competition?.eventId === activeEventId ||
      m.team?.competition?.event?.id === activeEventId
    ) || null;
  }, [myTeams, activeEventId]);

  const activeTeam = activeTeamMember?.team;
  const activeCompetition = activeTeam?.competition;
  const activeEvent = useMemo(() => {
    const foundInEligible = eligibleEvents.find(e => e.id === activeEventId)?.event;
    return activeCompetition?.event || foundInEligible || dashboardData?.event;
  }, [activeCompetition, eligibleEvents, activeEventId, dashboardData]);

  // Check whether the participant's TEAM has permanently selected a Problem Statement for that event
  const isProblemStatementSelected = Boolean(
    activeTeam?.problemStatementId &&
    activeTeam?.problemStatementLocked &&
    activeTeam?.problemStatement
  );

  const selectedProblemStatement = isProblemStatementSelected ? activeTeam.problemStatement : null;

  // Fetch real rounds and mentor questions for activeEventId
  const { data: rounds = [], isLoading: loadingRounds } = useEventRounds(activeEventId);
  const { data: myQuestions = [] } = useMentorQuestions(activeEventId);

  // Modals & form state
  const [selectedRoundId, setSelectedRoundId] = useState<string | null>(null);
  const [viewSubmissionId, setViewSubmissionId] = useState<string | null>(null);
  const [viewSubmissionModalData, setViewSubmissionModalData] = useState<any | null>(null);
  const { data: fetchedSubmission, isLoading: loadingFetchedSub, isError: fetchSubError } = useParticipantSubmission(viewSubmissionId);
  const activeModalSub = fetchedSubmission || viewSubmissionModalData;

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [description, setDescription] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [showFinalSubmitModal, setShowFinalSubmitModal] = useState(false);
  const [showAskMentorModal, setShowAskMentorModal] = useState(false);
  const [mentorQuestionText, setMentorQuestionText] = useState("");

  const getFileViewUrl = (fileUrl: string) => {
    if (!fileUrl) return "#";
    if (fileUrl.startsWith("http://") || fileUrl.startsWith("https://") || fileUrl.startsWith("blob:") || fileUrl.startsWith("data:")) {
      return fileUrl;
    }
    const apiBase = import.meta.env['VITE_API_URL'] || "http://localhost:3000/api/v1";
    const backendOrigin = apiBase.replace(/\/api\/v1\/?$/, "");
    const normalizedPath = fileUrl.startsWith("/") ? fileUrl : `/${fileUrl}`;
    return `${backendOrigin}${normalizedPath}`;
  };

  useEffect(() => {
    setSelectedRoundId(null);
    setViewSubmissionId(null);
    setViewSubmissionModalData(null);
    setSelectedFile(null);
    setDescription("");
  }, [activeEventId]);

  // Filter submissions strictly for activeEventId
  const eventSubmissions = useMemo(() => {
    if (!activeEventId) return [];
    return submissions.filter((s: any) =>
      s.eventId === activeEventId ||
      s.competition?.eventId === activeEventId ||
      s.eventRound?.eventId === activeEventId
    );
  }, [submissions, activeEventId]);

  // Filter rounds dynamically by selected Problem Statement's applicable rounds
  // If NO problem statement is selected, NEVER render or fall back to any rounds
  const configuredRounds = useMemo(() => {
    if (!isProblemStatementSelected || !selectedProblemStatement) {
      return [];
    }
    if (!rounds || rounds.length === 0) return [];
    if (!selectedProblemStatement?.applicableRounds || selectedProblemStatement.applicableRounds.length === 0) {
      return rounds;
    }
    return rounds.filter((r: any) =>
      selectedProblemStatement.applicableRounds.some((appRound: any) => appRound.id === r.id)
    );
  }, [rounds, isProblemStatementSelected, selectedProblemStatement]);

  const formatScheduleDate = (dateVal: any) => {
    if (!dateVal) return "Schedule not configured";
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return "Schedule not configured";
    return d.toLocaleString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatOpenMessage = (dateVal: any) => {
    if (!dateVal) return "Submission opens soon.";
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return "Submission opens soon.";
    const datePart = d.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
    const timePart = d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
    return `Submission opens on ${datePart} at ${timePart}.`;
  };

  // Helper function to calculate exact state for any given round card
  // Strictly follows Section 11 Status Priority
  const getRoundState = (r: any) => {
    const existingSub = eventSubmissions.find(
      (s: any) =>
        s.roundId === r.id ||
        (s.roundNumber === r.roundNumber && (s.eventId === activeEventId || s.competition?.eventId === activeEventId))
    );

    // Database dates directly from PostgreSQL EventRound
    const startDate = r.submissionStart ? new Date(r.submissionStart) : null;
    const deadlineDate = r.submissionDeadline ? new Date(r.submissionDeadline) : null;

    // A submission is submitted/locked if isLocked is true or status is SUBMITTED/EVALUATED/IN_REVIEW
    const isSubmitted = Boolean(
      existingSub && (
        existingSub.isLocked ||
        existingSub.status === "SUBMITTED" ||
        existingSub.status === "EVALUATED" ||
        existingSub.status === "IN_REVIEW"
      )
    );

    const isNotStarted = Boolean(startDate ? nowTime < startDate : true);
    const isExpired = Boolean(deadlineDate ? nowTime > deadlineDate : false);
    const isOpen = Boolean(startDate && deadlineDate && nowTime >= startDate && nowTime <= deadlineDate);
    const isYetToSubmit = isOpen && !isSubmitted;

    // Determine status in exact required order:
    // 1. If registration/payment is not authorized: LOCKED
    // 2. If existing submission is permanently submitted/locked: SUBMITTED (even after deadline passes)
    // 3. If currentTime < submissionStart: UPCOMING
    // 4. If currentTime >= submissionStart AND currentTime <= submissionDeadline AND no submission: YET TO SUBMIT
    // 5. If currentTime > submissionDeadline AND no submission: CLOSED
    let statusKey: "LOCKED" | "SUBMITTED" | "UPCOMING" | "YET_TO_SUBMIT" | "CLOSED" = "UPCOMING";

    if (accessStatus && !accessStatus.allowed) {
      statusKey = "LOCKED";
    } else if (isSubmitted) {
      statusKey = "SUBMITTED";
    } else if (isNotStarted) {
      statusKey = "UPCOMING";
    } else if (isYetToSubmit) {
      statusKey = "YET_TO_SUBMIT";
    } else if (isExpired && !isSubmitted) {
      statusKey = "CLOSED";
    } else {
      statusKey = "UPCOMING";
    }

    return {
      existingSub,
      startDate,
      deadlineDate,
      isSubmitted,
      isNotStarted,
      isExpired,
      isOpen,
      isYetToSubmit,
      statusKey,
    };
  };

  // Determine active OPEN round whose submission form should be shown below
  const activeOpenRound = useMemo(() => {
    if (!isProblemStatementSelected || configuredRounds.length === 0) return null;

    // Check if user explicitly selected an OPEN, YET_TO_SUBMIT round card
    if (selectedRoundId) {
      const match = configuredRounds.find(r => r.id === selectedRoundId);
      if (match) {
        const state = getRoundState(match);
        if (state.statusKey === "YET_TO_SUBMIT") return match;
      }
    }

    // Default to the first open round that is strictly YET_TO_SUBMIT
    return configuredRounds.find(r => {
      const state = getRoundState(r);
      return state.statusKey === "YET_TO_SUBMIT";
    }) || null;
  }, [configuredRounds, selectedRoundId, eventSubmissions, nowTime, accessStatus, isProblemStatementSelected]);

  const activeOpenRoundState = activeOpenRound ? getRoundState(activeOpenRound) : null;
  const activeOpenRoundSub = activeOpenRoundState?.existingSub || null;
  const openRoundFilesList = activeOpenRoundSub?.files || [];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    if (!file) return;

    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      toast.error(`Invalid file format .${ext}. Allowed formats: PNG, JPG, JPEG, PDF, DOC, DOCX, MP4, MOV, AVI`);
      e.target.value = "";
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      toast.error(`File size (${(file.size / (1024 * 1024)).toFixed(2)} MB) exceeds 20 MB limit!`);
      e.target.value = "";
      return;
    }

    setSelectedFile(file);
  };

  const handleUploadOnly = async () => {
    if (!selectedFile) return;
    if (!isProblemStatementSelected || !selectedProblemStatement) {
      toast.error("Please select a Problem Statement before accessing round submissions.");
      return;
    }
    if (!activeOpenRound) return;
    if (!activeTeam) {
      toast.error("Active team required for upload.");
      return;
    }

    let targetSub = activeOpenRoundSub;

    try {
      setIsUploading(true);
      if (!targetSub) {
        targetSub = await createSubmissionMutation.mutateAsync({
          teamId: activeTeam.id,
          competitionId: activeCompetition?.id || activeTeam.competitionId,
          eventId: activeEventId,
          roundId: activeOpenRound.id,
          title: `${activeTeam.name} - ${activeOpenRound.name} Submission`,
          description: description.trim(),
          content: description.trim(),
        });
      }

      const fileData = {
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
        fileType: selectedFile.type || selectedFile.name.split(".").pop() || "document",
        fileUrl: `/uploads/${selectedFile.name}`,
        ...(description.trim() ? { description: description.trim() } : {})
      };

      await uploadFileMutation.mutateAsync({
        submissionId: targetSub.id,
        fileData
      });
      toast.success(`Uploaded '${selectedFile.name}' successfully!`);
      setSelectedFile(null);
    } catch (err: any) {
      toast.error(err.message || "File upload failed.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleFinalSubmitConfirm = async () => {
    if (!isProblemStatementSelected || !selectedProblemStatement) {
      toast.error("Please select a Problem Statement before accessing round submissions.");
      return;
    }
    if (!activeOpenRound) return;
    if (!activeTeam) {
      toast.error("You are not part of an active team for this event.");
      return;
    }

    let targetSub = activeOpenRoundSub;
    const finalDescription = description.trim();

    try {
      setIsUploading(true);
      // Create draft submission if not existing
      if (!targetSub) {
        targetSub = await createSubmissionMutation.mutateAsync({
          teamId: activeTeam.id,
          competitionId: activeCompetition?.id || activeTeam.competitionId,
          eventId: activeEventId,
          roundId: activeOpenRound.id,
          title: `${activeTeam.name} - Round ${activeOpenRound.roundNumber} Submission`,
          description: finalDescription,
          content: finalDescription,
        });
      }

      // If file selected, upload file
      if (selectedFile && targetSub) {
        const fileData = {
          fileName: selectedFile.name,
          fileSize: selectedFile.size,
          fileType: selectedFile.type || selectedFile.name.split(".").pop() || "document",
          fileUrl: `/uploads/${selectedFile.name}`,
          ...(finalDescription ? { description: finalDescription } : {})
        };
        await uploadFileMutation.mutateAsync({
          submissionId: targetSub.id,
          fileData
        });
      }

      // Lock submission permanently in backend with description
      await finalSubmitMutation.mutateAsync({
        submissionId: targetSub.id,
        description: finalDescription
      });
      toast.success(`Round ${activeOpenRound.roundNumber}: ${activeOpenRound.name} submission finalized and locked!`);
      
      // Invalidate queries immediately so UI and round cards update reactively
      queryClient.invalidateQueries({ queryKey: participantKeys.submissions(activeEventId) });
      queryClient.invalidateQueries({ queryKey: participantKeys.submissions() });
      queryClient.invalidateQueries({ queryKey: participantKeys.dashboard() });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['submissions'] });

      setSelectedFile(null);
      setDescription("");
      setSelectedRoundId(null);
      setShowFinalSubmitModal(false);
    } catch (err: any) {
      toast.error(err?.message || "Failed to finalize submission.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleAskMentor = async () => {
    if (!mentorQuestionText.trim()) return;
    if (!activeEventId) {
      toast.error("Please select an active event first.");
      return;
    }
    try {
      const roundId = activeOpenRound?.id || rounds[0]?.id;
      await askMentorMutation.mutateAsync({
        eventId: activeEventId,
        ...(roundId ? { roundId } : {}),
        question: mentorQuestionText.trim(),
      });
      toast.success("Question submitted to mentors!");
      setMentorQuestionText("");
      setShowAskMentorModal(false);
      queryClient.invalidateQueries({ queryKey: ["mentorQuestions"] });
    } catch (err: any) {
      toast.error(err?.message || "Failed to submit question to mentor.");
    }
  };

  if (loadingDashboard || loadingSubmissions || loadingRounds || loadingRegistrations || loadingTeams || loadingAccess) {
    return (
      <div className="flex h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Event Selector Dropdown */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-card rounded-xl border shadow-sm">
        <div className="flex items-center gap-3">
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
            Select Event:
          </label>
          {eligibleEvents.length > 0 ? (
            <Select
              value={activeEventId}
              onValueChange={(val) => {
                setSelectedRoundId(null);
                navigate({
                  to: "/participant/submissions",
                  search: { eventId: val },
                  replace: true,
                });
              }}
            >
              <SelectTrigger className="w-[300px] text-xs font-semibold">
                <SelectValue placeholder="Select an event..." />
              </SelectTrigger>
              <SelectContent>
                {eligibleEvents.map((item) => (
                  <SelectItem key={item.id} value={item.id} className="text-xs font-medium">
                    {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Badge variant="outline" className="text-xs">
              No Registered Events
            </Badge>
          )}
        </div>

        {activeTeam && (
          <div className="text-xs font-medium text-muted-foreground">
            Team: <span className="font-bold text-foreground">{activeTeam.name}</span>
          </div>
        )}
      </div>

      {/* ACCESS CONTROL GATE: Check Registration & Payment Status */}
      {accessStatus && !accessStatus.allowed ? (
        <Card className="p-6 border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 shadow-sm rounded-xl">
          <div className="flex flex-col items-center justify-center text-center space-y-4 py-8">
            <div className="p-4 bg-amber-100 dark:bg-amber-900/50 rounded-full">
              <Lock className="h-10 w-10 text-amber-600 dark:text-amber-400" />
            </div>
            <h2 className="text-xl font-bold tracking-tight text-foreground">🔒 Submissions Locked</h2>
            <p className="text-sm text-muted-foreground max-w-md">
              Complete your event registration and payment to access problem statements and round submissions.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 py-2">
              <Badge variant="outline" className="text-xs font-semibold px-3 py-1 bg-background">
                Registration: {accessStatus.registrationStatus === "PENDING_PAYMENT" ? "Pending Payment ⚠️" : (accessStatus.registrationStatus === "APPROVED" || accessStatus.registrationStatus === "CONFIRMED" || accessStatus.registrationStatus === "PAID" ? "Confirmed ✓" : (accessStatus.registrationStatus || "Pending"))}
              </Badge>
              {accessStatus.isPaidEvent && (
                <Badge variant="outline" className="text-xs font-semibold px-3 py-1 bg-background">
                  Payment: {accessStatus.paymentStatus === "SUCCEEDED" || accessStatus.paymentStatus === "PAID" ? "Paid ✓" : (accessStatus.paymentStatus || "Pending")}
                </Badge>
              )}
            </div>
            <Button
              className="gap-2 text-xs font-semibold"
              onClick={() => navigate({ to: "/participant/discover-events" })}
            >
              Complete Registration
            </Button>
          </div>
        </Card>
      ) : (
        <>
          {/* Header with Event Title & Status Badges */}
          <div className="flex flex-col gap-1 border-b pb-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Upload className="h-6 w-6 text-primary" />
                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                  {activeEvent?.name || activeEvent?.title || "Event Submissions"}
                </h1>
              </div>

              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-xs font-semibold gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Registration: Confirmed ✓
                </Badge>
                {accessStatus?.isPaidEvent ? (
                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-xs font-semibold gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Payment: Paid ✓
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/30 text-xs font-semibold gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Free Event ✓
                  </Badge>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAskMentorModal(true)}
                  className="gap-1.5 text-xs ml-2"
                >
                  <MessageSquare className="h-4 w-4 text-primary" />
                  Ask Mentor / Doubt
                </Button>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              View event rounds, manage round-wise project submissions, and upload project files.
            </p>
          </div>

          {/* PROBLEM STATEMENT SELECTION GATE: Check whether team has permanently selected a Problem Statement */}
          {!isProblemStatementSelected ? (
            <Card className="border-amber-500/30 bg-amber-500/5 shadow-sm p-6">
              <div className="flex flex-col items-center justify-center text-center space-y-4 py-8">
                <div className="p-3 bg-amber-500/10 rounded-full text-amber-600 dark:text-amber-400">
                  <AlertTriangle className="h-8 w-8" />
                </div>
                <h2 className="text-xl font-bold tracking-tight text-foreground">
                  Problem Statement Selection Required
                </h2>
                <p className="text-sm text-muted-foreground max-w-md">
                  Please select a Problem Statement before accessing round submissions.
                </p>
                <Button
                  size="sm"
                  variant="default"
                  className="text-xs font-semibold gap-1.5"
                  onClick={() => navigate({ to: "/participant/problem-statements", search: { eventId: activeEventId } })}
                >
                  <FileCode className="h-4 w-4" /> Go to Problem Statements
                </Button>
              </div>
            </Card>
          ) : (
            <>
              {/* Selected Problem Statement Banner */}
              {selectedProblemStatement && (
                <Card className="border-emerald-500/40 bg-emerald-500/5 shadow-sm">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm">
                        <CheckCircle2 className="h-5 w-5" /> Selected Problem Statement
                      </div>
                      <Badge variant="outline" className="bg-emerald-600/10 text-emerald-600 border-emerald-600/30 text-xs font-semibold gap-1">
                        <Lock className="h-3.5 w-3.5" /> 🔒 Permanently Selected
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2 text-xs text-foreground">
                    <div className="flex items-center gap-2 font-mono font-bold text-base text-primary">
                      <span>{selectedProblemStatement.code}</span>
                      <span>•</span>
                      <span>{selectedProblemStatement.title}</span>
                    </div>
                    <p className="text-muted-foreground leading-relaxed">{selectedProblemStatement.description}</p>
                  </CardContent>
                </Card>
              )}

              {/* ROUND-WISE CARDS ROSTER */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                    <Award className="h-4 w-4 text-primary" /> Configured Event Rounds ({configuredRounds.length})
                  </h3>
                  {activeTeam && (
                    <span className="text-xs text-muted-foreground font-medium">
                      Team: <span className="font-semibold text-foreground">{activeTeam.name}</span>
                    </span>
                  )}
                </div>

                {!selectedProblemStatement ? (
                  <div className="p-6 rounded-lg border bg-card text-center text-xs text-muted-foreground space-y-2">
                    <p className="font-medium text-foreground">Please select a problem statement to view your configured rounds.</p>
                  </div>
                ) : configuredRounds.length === 0 ? (
                  <div className="p-6 rounded-lg border bg-card text-center text-xs text-muted-foreground">
                    No rounds configured for your selected problem statement yet.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {configuredRounds.map((r: any) => {
                      const state = getRoundState(r);
                      const isCardSelectedForForm = activeOpenRound?.id === r.id;

                      let badgeText = "🟢 YET TO SUBMIT";
                      let badgeClass = "bg-emerald-500/10 text-emerald-600 border-emerald-500/30 font-bold";

                      if (state.statusKey === "SUBMITTED") {
                        badgeText = "🟢 SUBMITTED";
                        badgeClass = "bg-emerald-600 text-white font-bold border-transparent";
                      } else if (state.statusKey === "UPCOMING") {
                        badgeText = "🟡 UPCOMING";
                        badgeClass = "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 font-bold";
                      } else if (state.statusKey === "CLOSED") {
                        badgeText = "🔴 CLOSED";
                        badgeClass = "bg-destructive/10 text-destructive border-destructive/30 font-bold";
                      } else if (state.statusKey === "LOCKED") {
                        badgeText = "🔒 LOCKED";
                        badgeClass = "bg-muted text-muted-foreground border-muted-foreground/30 font-bold";
                      } else {
                        badgeText = "🟢 YET TO SUBMIT";
                        badgeClass = "bg-emerald-500/10 text-emerald-600 border-emerald-500/30 font-bold";
                      }

                      return (
                        <div
                          key={r.id}
                          className={`p-4 rounded-xl border transition-all space-y-3 flex flex-col justify-between ${
                            isCardSelectedForForm
                              ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary/30"
                              : "border-border bg-card/60 hover:border-border/80"
                          }`}
                        >
                          <div className="space-y-3">
                            <div className="flex items-center justify-between gap-1">
                              <Badge variant="outline" className={`text-[10px] px-2 py-0.5 ${badgeClass}`}>
                                Round {r.roundNumber}: {badgeText}
                              </Badge>
                              <span className="font-mono text-xs font-bold text-foreground shrink-0">
                                {r.maxMarks} Marks
                              </span>
                            </div>

                            <div>
                              <h4 className="font-bold text-sm text-foreground">Round {r.roundNumber} — {r.name}</h4>
                              <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                                {r.description || "No specific instructions provided."}
                              </p>
                            </div>

                            <div className="space-y-1.5 text-[11px] font-mono bg-muted/30 p-2.5 rounded-md border text-muted-foreground">
                              <div>
                                <span className="text-[10px] text-muted-foreground font-semibold uppercase block">OPENS:</span>
                                <span className="text-foreground font-medium">{formatScheduleDate(state.startDate)}</span>
                              </div>
                              <div className="pt-1 border-t border-border/40">
                                <span className="text-[10px] text-muted-foreground font-semibold uppercase block">DEADLINE:</span>
                                <span className="text-foreground font-medium">{formatScheduleDate(state.deadlineDate)}</span>
                              </div>
                            </div>
                          </div>

                          {/* INFORMATIONAL MESSAGE & CARD ACTIONS */}
                          <div className="pt-2 border-t flex flex-col gap-2">
                            {state.statusKey === "SUBMITTED" ? (
                              <div className="space-y-2">
                                <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center justify-center gap-1 bg-emerald-500/5 p-1.5 rounded border border-emerald-500/20">
                                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                                  <span>Submitted on: {formatScheduleDate(state.existingSub?.lockedAt || state.existingSub?.createdAt)}</span>
                                </div>
                                <Button
                                  size="sm"
                                  variant="default"
                                  className="w-full text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-1.5"
                                  onClick={() => {
                                    // Resolve exact submission for eventId + teamId + roundId + selectedProblemStatementId
                                    const subToView = state.existingSub || eventSubmissions.find((s: any) =>
                                      (s.roundId === r.id || s.roundNumber === r.roundNumber) &&
                                      s.teamId === activeTeam?.id &&
                                      (!s.problemStatementId || s.problemStatementId === selectedProblemStatement?.id)
                                    );
                                    if (subToView?.id) {
                                      setViewSubmissionModalData(subToView);
                                      setViewSubmissionId(subToView.id);
                                    } else {
                                      toast.error("Submission record not found for this round.");
                                    }
                                  }}
                                >
                                  <Eye className="h-3.5 w-3.5" /> View Submission
                                </Button>
                              </div>
                            ) : state.statusKey === "UPCOMING" ? (
                              <div className="text-center p-2.5 rounded bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-400 font-medium space-y-1">
                                <div className="flex items-center justify-center gap-1 font-semibold">
                                  <Clock className="h-3.5 w-3.5" /> 🟡 UPCOMING
                                </div>
                                <p className="text-[11px] text-muted-foreground">
                                  {formatOpenMessage(state.startDate)}
                                </p>
                              </div>
                            ) : state.statusKey === "CLOSED" ? (
                              <div className="text-center p-2.5 rounded bg-destructive/10 border border-destructive/20 text-xs text-destructive font-semibold space-y-0.5">
                                <p>🔴 CLOSED</p>
                                <p className="text-[11px] font-normal text-muted-foreground">Submission deadline has passed.</p>
                              </div>
                            ) : (
                              // OPEN / YET TO SUBMIT
                              <Button
                                size="sm"
                                variant={isCardSelectedForForm ? "default" : "outline"}
                                className={`w-full text-xs font-semibold gap-1.5 ${
                                  isCardSelectedForForm
                                    ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                                    : "border-emerald-600/40 text-emerald-600 hover:bg-emerald-50/50"
                                }`}
                                onClick={() => {
                                  setSelectedRoundId(r.id);
                                  const formElem = document.getElementById("submission-form-section");
                                  if (formElem) {
                                    formElem.scrollIntoView({ behavior: "smooth" });
                                  }
                                }}
                              >
                                <Upload className="h-3.5 w-3.5" /> Open Submission Form
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* UPLOAD FORM SECTION & GUIDELINES GRID */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
                {/* Upload Form Card - Rendered ONLY if an open, YET_TO_SUBMIT round exists */}
                <Card id="submission-form-section" className="lg:col-span-2 shadow-sm border-border">
                  {activeOpenRound && activeOpenRoundState?.statusKey === "YET_TO_SUBMIT" ? (
                    <>
                      <CardHeader>
                        <CardTitle className="text-base font-bold flex items-center justify-between">
                          <span className="flex items-center gap-2">
                            <Paperclip className="h-4 w-4 text-primary" /> Round {activeOpenRound.roundNumber} — {activeOpenRound.name} Submission
                          </span>
                          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-[10px] font-bold">
                            🟢 OPEN / YET TO SUBMIT
                          </Badge>
                        </CardTitle>
                        <CardDescription className="text-xs">
                          Upload project documentation, source code archives, or demo videos (Max 20 MB per file).
                        </CardDescription>

                        {/* Selected Problem Statement Details inside Form */}
                        {selectedProblemStatement && (
                          <div className="p-3 mt-2 bg-muted/40 border rounded-md text-xs space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-muted-foreground uppercase text-[10px]">Problem Statement:</span>
                              <Badge variant="secondary" className="font-mono text-[10px] font-bold">
                                {selectedProblemStatement.code}
                              </Badge>
                            </div>
                            <p className="font-bold text-foreground text-xs">{selectedProblemStatement.title}</p>
                          </div>
                        )}
                      </CardHeader>

                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="submissionFile">Select File to Upload</Label>
                          <Input
                            id="submissionFile"
                            type="file"
                            accept=".png,.jpg,.jpeg,.pdf,.doc,.docx,.mp4,.mov,.avi"
                            onChange={handleFileChange}
                            disabled={isUploading}
                          />
                          <p className="text-[11px] text-muted-foreground">
                            Supported: PNG, JPG, JPEG, PDF, DOC, DOCX, MP4, MOV, AVI (Max 20MB)
                          </p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="submissionDescription">File / Project Description</Label>
                          <Textarea
                            id="submissionDescription"
                            placeholder="Enter project description, repository links, architecture summary, or notes for judges..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            disabled={isUploading}
                            className="min-h-[90px] text-xs resize-y"
                          />
                        </div>

                        {selectedFile && (
                          <div className="p-3 border rounded-md bg-muted/30 flex items-center justify-between text-xs">
                            <div>
                              <p className="font-semibold">{selectedFile.name}</p>
                              <p className="text-muted-foreground">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                            </div>
                            <Button size="sm" variant="outline" onClick={handleUploadOnly} disabled={isUploading}>
                              {isUploading ? "Uploading..." : "Upload File"}
                            </Button>
                          </div>
                        )}

                        {/* Uploaded Files Roster */}
                        <div className="space-y-2 pt-4 border-t">
                          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            Uploaded Files ({openRoundFilesList.length})
                          </h4>

                          {openRoundFilesList.length > 0 ? (
                            <div className="divide-y border rounded-md">
                              {openRoundFilesList.map((file: any, idx: number) => (
                                <div key={file.id || idx} className="p-3 flex items-center justify-between text-xs">
                                  <div className="flex items-center gap-2">
                                    <FileText className="h-4 w-4 text-primary shrink-0" />
                                    <div>
                                      <p className="font-medium text-foreground">{file.fileName}</p>
                                      <p className="text-[10px] text-muted-foreground">
                                        {(file.fileSize / (1024 * 1024)).toFixed(2)} MB • {file.fileType}
                                      </p>
                                    </div>
                                  </div>
                                  <Badge variant="outline" className="text-[10px]">
                                    Uploaded
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-muted-foreground italic py-2">No files uploaded for this round yet.</p>
                          )}
                        </div>
                      </CardContent>

                      <CardFooter className="bg-muted/20 border-t flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">
                          Status: <span className="font-semibold text-foreground">YET TO SUBMIT</span>
                        </span>

                        <Button
                          variant="default"
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 text-xs font-semibold"
                          onClick={() => setShowFinalSubmitModal(true)}
                          disabled={isUploading || createSubmissionMutation.isPending || finalSubmitMutation.isPending}
                        >
                          <Lock className="h-3.5 w-3.5" /> Final Submit & Lock Round
                        </Button>
                      </CardFooter>
                    </>
                  ) : (
                    <CardContent className="p-8 text-center space-y-3">
                      <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
                        <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                      </div>
                      <h3 className="font-bold text-base text-foreground">No Open Round Requiring Submission</h3>
                      <p className="text-xs text-muted-foreground max-w-md mx-auto">
                        All configured rounds for your selected problem statement are either upcoming, closed, or already submitted. Click <strong>View Submission</strong> on any submitted round card to review your submission in read-only mode.
                      </p>
                    </CardContent>
                  )}
                </Card>

                {/* Guidelines & Mentor Questions Side Panel */}
                <div className="space-y-6">
                  {/* Doubts & Mentor Answers */}
                  <Card className="shadow-sm border-border">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-bold text-foreground flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <MessageSquare className="h-4 w-4 text-primary" /> My Doubts & Answers ({myQuestions.length})
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs text-primary font-medium hover:bg-primary/10"
                          onClick={() => setShowAskMentorModal(true)}
                        >
                          + Ask Doubt
                        </Button>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-xs">
                      {myQuestions.length === 0 ? (
                        <p className="text-muted-foreground italic py-2 text-center">No doubts submitted yet.</p>
                      ) : (
                        myQuestions.map((q: any) => {
                          const isAnswered = q.status === "ANSWERED" || (q.replies && q.replies.length > 0);
                          const mentorName = q.mentor
                            ? `${q.mentor.firstName || ''} ${q.mentor.lastName || ''}`.trim() || q.mentor.email
                            : q.replies?.[0]?.sender
                            ? `${q.replies[0].sender.firstName || ''} ${q.replies[0].sender.lastName || ''}`.trim()
                            : "Mentor";
                          const answerMessage = q.replies?.[0]?.message || q.replies?.[0]?.reply;

                          return (
                            <div key={q.id} className="p-3 rounded-lg border bg-muted/20 space-y-2">
                              <div className="flex items-center justify-between">
                                {q.round ? (
                                  <Badge variant="outline" className="text-[10px]">
                                    Round {q.round.roundNumber}: {q.round.name}
                                  </Badge>
                                ) : (
                                  <span className="font-semibold text-muted-foreground text-[10px]">General Question</span>
                                )}
                                <Badge variant={isAnswered ? "default" : "secondary"} className="text-[10px]">
                                  {isAnswered ? "ANSWERED" : "PENDING"}
                                </Badge>
                              </div>
                              <div>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-0.5">Question:</span>
                                <p className="text-foreground font-medium">{q.question}</p>
                              </div>
                              <p className="text-[10px] text-muted-foreground">
                                Asked: {new Date(q.createdAt).toLocaleString()}
                              </p>

                              {isAnswered && (
                                <div className="border-t pt-2 space-y-2">
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-primary block">Answer:</span>
                                  {q.replies && q.replies.length > 0 ? (
                                    q.replies.map((r: any) => {
                                      const rMentorName = r.sender
                                        ? `${r.sender.firstName || ''} ${r.sender.lastName || ''}`.trim() || r.sender.email
                                        : mentorName;
                                      const rMsg = r.message || r.reply;
                                      return (
                                        <div key={r.id} className="bg-card p-2.5 rounded-md border border-primary/20 space-y-1">
                                          <div className="flex items-center justify-between text-[11px]">
                                            <span className="font-semibold text-primary">{rMentorName}</span>
                                            <span className="text-[10px] text-muted-foreground">
                                              {new Date(r.createdAt).toLocaleString()}
                                            </span>
                                          </div>
                                          <p className="text-foreground text-xs leading-relaxed">
                                            {rMsg}
                                          </p>
                                        </div>
                                      );
                                    })
                                  ) : (
                                    <div className="bg-card p-2.5 rounded-md border border-primary/20">
                                      <p className="text-foreground text-xs italic">
                                        {answerMessage || "Answered by mentor."}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </CardContent>
                  </Card>

                  {/* Submission Guidelines */}
                  <Card className="shadow-sm border-amber-500/30 bg-amber-500/5">
                    <CardHeader>
                      <CardTitle className="text-sm font-bold text-amber-700 dark:text-amber-400 flex items-center gap-2">
                        <AlertCircle className="h-4 w-4" /> Submission Guidelines
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-xs text-muted-foreground">
                      <p>1. Make sure to submit your files before the specified round submission deadline.</p>
                      <p>2. Maximum file size allowed is <strong>20 MB per file</strong>.</p>
                      <p>3. Supported formats: PNG, JPG, JPEG, PDF, DOC, DOCX, MP4, MOV, AVI.</p>
                      <p>4. Clicking <strong>Final Submit & Lock</strong> permanently locks your round submission.</p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </>
          )}
        </>
      )}

      {/* Final Submit Confirmation Modal */}
      <Dialog open={showFinalSubmitModal} onOpenChange={setShowFinalSubmitModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-600">
              <AlertTriangle className="h-5 w-5" /> Confirm Final Submission
            </DialogTitle>
            <DialogDescription className="pt-2 text-sm text-foreground">
              Are you sure you want to finalize and lock your submission for Round {activeOpenRound?.roundNumber}: {activeOpenRound?.name}?
            </DialogDescription>
          </DialogHeader>

          <div className="p-3 bg-amber-500/10 rounded-md border border-amber-500/20 text-xs text-amber-700 dark:text-amber-400 space-y-1">
            <p className="font-semibold">⚠️ Permanent Lock Notice</p>
            <p>Once finalized, your submission becomes permanently locked. You will not be able to edit, replace, or upload further files.</p>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" size="sm" onClick={() => setShowFinalSubmitModal(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
              disabled={isUploading || createSubmissionMutation.isPending || finalSubmitMutation.isPending}
              onClick={handleFinalSubmitConfirm}
            >
              {isUploading || finalSubmitMutation.isPending ? "Finalizing..." : "Confirm & Lock Submission"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Ask Mentor Modal */}
      <Dialog open={showAskMentorModal} onOpenChange={setShowAskMentorModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" /> Ask Mentor a Doubt
            </DialogTitle>
            <DialogDescription className="pt-1 text-xs text-muted-foreground">
              Submit your question regarding problem statement or round requirements.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Your Question / Doubt</Label>
              <Textarea
                rows={4}
                placeholder="Describe your technical issue, question regarding problem statement, or round guidelines..."
                value={mentorQuestionText}
                onChange={(e) => setMentorQuestionText(e.target.value)}
                className="text-xs"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" size="sm" onClick={() => setShowAskMentorModal(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={!mentorQuestionText.trim() || askMentorMutation.isPending}
              onClick={handleAskMentor}
            >
              {askMentorMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
              Submit Question
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* STRICT READ-ONLY VIEW SUBMISSION DETAILS MODAL */}
      <Dialog
        open={Boolean(viewSubmissionId || viewSubmissionModalData)}
        onOpenChange={(open) => {
          if (!open) {
            setViewSubmissionId(null);
            setViewSubmissionModalData(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-[650px] w-[calc(100vw-24px)] max-h-[90vh] flex flex-col p-0 overflow-hidden border-border bg-card shadow-2xl">
          {loadingFetchedSub && !activeModalSub ? (
            <div className="p-12 flex flex-col items-center justify-center space-y-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-xs text-muted-foreground font-medium">Loading submission details...</p>
            </div>
          ) : fetchSubError && !activeModalSub ? (
            <div className="p-8 text-center space-y-4">
              <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto text-destructive">
                <AlertCircle className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-base text-foreground">Submission Not Found</h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  The requested submission details could not be retrieved or access is unauthorized.
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setViewSubmissionId(null);
                  setViewSubmissionModalData(null);
                }}
              >
                Close
              </Button>
            </div>
          ) : activeModalSub ? (
            <>
              {/* Modal Header */}
              <div className="p-5 sm:p-6 pb-4 border-b border-border flex items-start justify-between shrink-0 bg-muted/10">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 mt-0.5">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-primary">
                        {activeModalSub.team?.name || activeTeam?.name || "Team"}
                      </span>
                    </div>
                    <h2 className="text-lg font-bold tracking-tight text-foreground leading-tight mt-0.5">
                      Round {activeModalSub.roundNumber || activeModalSub.eventRound?.roundNumber || 1} — {activeModalSub.eventRound?.name || activeModalSub.title || "Round Submission"}
                    </h2>
                    <p className="text-xs text-muted-foreground font-mono mt-0.5 select-all">
                      Submission ID: {activeModalSub.id}
                    </p>
                  </div>
                </div>
              </div>

              {/* Modal Body - Scrollable Read-Only View */}
              <div className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1 text-xs">
                {/* Summary Grid */}
                <div className="p-4 rounded-xl border bg-muted/20 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Event</span>
                      <p className="font-semibold text-foreground mt-0.5">
                        {activeModalSub.event?.name || activeModalSub.competition?.event?.name || activeEvent?.name || "Event"}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Team</span>
                      <p className="font-semibold text-foreground mt-0.5">
                        {activeModalSub.team?.name || activeTeam?.name || "Team"}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Problem Statement Code</span>
                      <p className="font-mono font-bold text-primary mt-0.5">
                        {activeModalSub.problemStatement?.code || selectedProblemStatement?.code || "—"}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Problem Statement Name</span>
                      <p className="font-semibold text-foreground mt-0.5">
                        {activeModalSub.problemStatement?.title || selectedProblemStatement?.title || "—"}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Submission Status</span>
                      <div className="mt-0.5 flex items-center gap-1.5">
                        <Badge variant="default" className="bg-emerald-600 text-white text-[10px] gap-1 font-bold border-transparent">
                          <Lock className="h-3 w-3" /> 🟢 SUBMITTED & LOCKED
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Submitted Date / Time</span>
                      <p className="font-mono text-foreground font-medium mt-0.5">
                        {formatScheduleDate(activeModalSub.lockedAt || activeModalSub.createdAt)}
                      </p>
                    </div>
                    <div className="sm:col-span-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Submitted By</span>
                      <p className="font-semibold text-foreground mt-0.5">
                        {activeModalSub.submittedBy
                          ? `${activeModalSub.submittedBy.firstName || ''} ${activeModalSub.submittedBy.lastName || ''}`.trim() || activeModalSub.submittedBy.email
                          : "Team Member"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Submission Description */}
                <div className="space-y-1.5">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5 text-primary" /> SUBMISSION DESCRIPTION
                  </h4>
                  <div className="p-3.5 rounded-lg border bg-card text-foreground text-xs leading-relaxed whitespace-pre-line">
                    {(() => {
                      const descText =
                        activeModalSub.description ||
                        (activeModalSub.payload && typeof activeModalSub.payload === "object" && ((activeModalSub.payload as any).description || (activeModalSub.payload as any).content)) ||
                        activeModalSub.content;
                      return descText && String(descText).trim() ? String(descText).trim() : "No project description provided for this submission.";
                    })()}
                  </div>
                </div>

                {/* Uploaded Files Roster */}
                <div className="space-y-2">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Paperclip className="h-3.5 w-3.5 text-primary" /> UPLOADED FILES ({activeModalSub.files?.length || 0})
                    </span>
                  </h4>

                  {activeModalSub.files && activeModalSub.files.length > 0 ? (
                    <div className="divide-y border rounded-lg overflow-hidden bg-card">
                      {activeModalSub.files.map((file: any, idx: number) => (
                        <div key={file.id || idx} className="p-3 flex items-center justify-between gap-3 text-xs">
                          <div className="flex items-center gap-2.5 overflow-hidden">
                            <FileText className="h-4 w-4 text-primary shrink-0" />
                            <div className="truncate">
                              <p className="font-semibold text-foreground truncate">{file.fileName}</p>
                              <p className="text-[10px] text-muted-foreground">
                                {(file.fileSize / (1024 * 1024)).toFixed(2)} MB • {file.fileType}
                              </p>
                            </div>
                          </div>

                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-[11px] shrink-0 gap-1 font-medium hover:bg-primary/10"
                            onClick={() => window.open(getFileViewUrl(file.fileUrl || `/uploads/${file.fileName}`), "_blank", "noopener,noreferrer")}
                          >
                            <Eye className="h-3 w-3" /> View
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 border rounded-lg bg-card text-center text-xs text-muted-foreground italic">
                      No files uploaded for this submission.
                    </div>
                  )}
                </div>

                {/* Evaluation Progress */}
                <div className="space-y-2">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Star className="h-3.5 w-3.5 text-amber-500" /> EVALUATION PROGRESS
                  </h4>

                  {activeModalSub.evaluations && activeModalSub.evaluations.length > 0 ? (
                    <div className="space-y-2">
                      {activeModalSub.evaluations.map((ev: any, idx: number) => (
                        <div key={ev.id || idx} className="p-3 rounded-lg border bg-card space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-foreground">
                              Judge: {ev.judge?.user ? `${ev.judge.user.firstName || ''} ${ev.judge.user.lastName || ''}`.trim() || ev.judge.user.email : ev.judge?.name || "Assigned Judge"}
                            </span>
                            <span className="font-mono text-sm font-bold text-primary">
                              {ev.score ?? "—"} Marks
                            </span>
                          </div>
                          {ev.feedback && (
                            <div className="text-muted-foreground border-t pt-2 space-y-0.5">
                              <span className="font-medium text-[10px] uppercase tracking-wider text-foreground">Judge Feedback:</span>
                              <p className="italic text-xs leading-relaxed">{ev.feedback}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-3 border rounded-lg bg-card text-xs text-muted-foreground flex items-center justify-between">
                      <span>Status: <strong className="text-amber-600">Pending Evaluation</strong></span>
                      <span className="text-[11px] font-mono">No score assigned yet</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer - Strictly Read-Only, Close only */}
              <div className="p-4 border-t border-border shrink-0 bg-muted/20 flex justify-end">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setViewSubmissionId(null);
                    setViewSubmissionModalData(null);
                  }}
                >
                  Close
                </Button>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
