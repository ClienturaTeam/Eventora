import { FormPageTemplate } from "@/components/templates/form-page";
import { DatePicker, MultiSelect, TagInput, TimePicker } from "@/components/ds/form-controls";
import { FileUpload, RichTextEditor } from "@/components/ds/file-upload";
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
import { useState, useEffect } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fetchApi } from "@/lib/api-client";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";

export function CreateEventPage() {
  const { proposalId } = useSearch({ from: '/events/new' });
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const orgId = user?.memberships?.[0]?.organization?.id;

  const { data: membersRes } = useQuery({
    queryKey: ["organization", orgId, "members"],
    queryFn: async () => {
      if (!orgId) return [];
      const res = await fetchApi(`/organizations/${orgId}/members`);
      return res.data as any[];
    },
    enabled: !!orgId,
  });

  const members = membersRes || [];
  const facultyCoordinators = members.filter((m: any) => m.role.name === "Faculty Coordinator");
  const studentCoordinators = members.filter((m: any) => m.role.name === "Student Coordinator");

  const [facultyCoordinatorId, setFacultyCoordinatorId] = useState<string>("");
  const [studentCoordinatorId, setStudentCoordinatorId] = useState<string>("");
  
  const { data: proposalRes, isLoading: isLoadingProposal } = useQuery({
    queryKey: ['hackathon-proposal', proposalId],
    queryFn: () => fetchApi(`/hackathon-proposals/${proposalId}`),
    enabled: !!proposalId,
  });

  const proposal = proposalRes?.data;
  const [tags, setTags] = useState<string[]>(["AI", "Accessibility"]);
  const [tracks, setTracks] = useState<string[]>(["Hackathon"]);
  const [start, setStart] = useState<Date | undefined>(undefined);
  const [end, setEnd] = useState<Date | undefined>(undefined);
  const [time, setTime] = useState("09:00");
  
  const [eventName, setEventName] = useState("");
  const [category, setCategory] = useState("hackathon");
  const [description, setDescription] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  
  const [rules, setRules] = useState("");
  const [isGeneratingRules, setIsGeneratingRules] = useState(false);
  
  const [registrationType, setRegistrationType] = useState<"INDIVIDUAL" | "TEAM">("INDIVIDUAL");
  const [minTeamSize, setMinTeamSize] = useState<string>("");
  const [maxTeamSize, setMaxTeamSize] = useState<string>("");
  const [regStart, setRegStart] = useState<Date | undefined>(undefined);
  const [regEnd, setRegEnd] = useState<Date | undefined>(undefined);

  // Rounds configuration state
  const [rounds, setRounds] = useState<any[]>([
    { roundNumber: 1, name: "Round 1 — Idea Submission", description: "Submit your project idea", maxMarks: 20, submissionType: "FILE", status: "ACTIVE" },
    { roundNumber: 2, name: "Round 2 — Prototype Submission", description: "Submit working prototype", maxMarks: 30, submissionType: "FILE", status: "UPCOMING" },
    { roundNumber: 3, name: "Round 3 — Final Presentation", description: "Final project presentation", maxMarks: 50, submissionType: "FILE", status: "UPCOMING" },
  ]);

  const addRound = () => {
    const nextNum = rounds.length + 1;
    setRounds([
      ...rounds,
      {
        roundNumber: nextNum,
        name: `Round ${nextNum} — Evaluation`,
        description: "",
        maxMarks: 50,
        submissionType: "FILE",
        status: "UPCOMING"
      }
    ]);
  };

  const removeRound = (index: number) => {
    if (rounds.length <= 1) return;
    const updated = rounds.filter((_, i) => i !== index).map((r, i) => ({ ...r, roundNumber: i + 1 }));
    setRounds(updated);
  };

  const updateRoundField = (index: number, field: string, value: any) => {
    const updated = [...rounds];
    updated[index] = { ...updated[index], [field]: value };
    setRounds(updated);
  };

  const [isPublishing, setIsPublishing] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (proposal) {
      if (proposal.title) setEventName(proposal.title);
      if (proposal.description) setDescription(proposal.description);
      if (proposal.requirements) setRules(proposal.requirements);
      if (proposal.startDate) setStart(new Date(proposal.startDate));
      if (proposal.endDate) setEnd(new Date(proposal.endDate));
      if (proposal.submittedById) setStudentCoordinatorId(proposal.submittedById);
    }
  }, [proposal]);

  useEffect(() => {
    if (!facultyCoordinatorId && facultyCoordinators.length > 0) {
      setFacultyCoordinatorId(facultyCoordinators[0].user.id);
    }
    if (!studentCoordinatorId && studentCoordinators.length > 0 && !proposal?.submittedById) {
      setStudentCoordinatorId(studentCoordinators[0].user.id);
    }
  }, [facultyCoordinators, studentCoordinators, facultyCoordinatorId, studentCoordinatorId, proposal]);

  const handleGenerateAI = async () => {
    try {
      setIsGenerating(true);
      const res = await fetchApi("/ai-copilot/generate/event-description", {
        method: "POST",
        body: JSON.stringify({
          eventName,
          category,
          audience: "General",
          theme: tags.join(", "),
          duration: start && end ? `${Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))} days` : "Unknown",
        })
      });
      if (res.data?.text) {
        setDescription(res.data.text);
      }
    } catch (e: any) {
      console.error("Failed to generate description", e);
      toast.error(e.message || "Failed to generate description");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateRulesAI = async () => {
    try {
      setIsGeneratingRules(true);
      const res = await fetchApi("/ai-copilot/generate/event-rules", {
        method: "POST",
        body: JSON.stringify({
          eventName,
          category,
          audience: "General",
          theme: tags.join(", "),
          duration: start && end ? `${Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))} days` : "Unknown",
        })
      });
      if (res.data?.text) {
        setRules(res.data.text);
      }
    } catch (e: any) {
      console.error("Failed to generate rules", e);
      toast.error(e.message || "Failed to generate rules");
    } finally {
      setIsGeneratingRules(false);
    }
  };

  const handlePublish = async () => {
    if (!eventName) {
      toast.error("Event name is required");
      return;
    }
    
    // Calculate final dates correctly or fallback to current
    const startTime = start || new Date();
    // Default end time to 7 days from start if missing
    const endTime = end || new Date(startTime.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    try {
      setIsPublishing(true);
      
      const payload = {
        name: eventName,
        description: description,
        rules: rules,
        status: "PUBLISHED",
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        registrationType: registrationType,
        minTeamSize: registrationType === "TEAM" && minTeamSize ? parseInt(minTeamSize) : null,
        maxTeamSize: registrationType === "TEAM" && maxTeamSize ? parseInt(maxTeamSize) : null,
        registrationStart: regStart ? regStart.toISOString() : null,
        registrationEnd: regEnd ? regEnd.toISOString() : null,
        price: 0,
        currency: "INR",
        facultyCoordinatorId: facultyCoordinatorId || null,
        studentCoordinatorId: studentCoordinatorId || null,
        rounds: rounds,
      };

      if (proposalId) {
        const response = await fetchApi(`/hackathon-proposals/${proposalId}/create-event`, {
          method: "POST",
          body: JSON.stringify(payload)
        });
        toast.success("Event successfully created from proposal!");
        queryClient.invalidateQueries({ queryKey: ['events'] });
        queryClient.invalidateQueries({ queryKey: ['hackathon-proposals'] });
        queryClient.invalidateQueries({ queryKey: ['hackathon-proposal', proposalId] });
        
        // Navigate to the newly created event details page
        const newEventId = response.data?.event?.id;
        if (newEventId) {
          navigate({ to: `/events/${newEventId}` });
        } else {
          navigate({ to: `/events` });
        }
      } else {
        await fetchApi("/events", {
          method: "POST",
          body: JSON.stringify(payload)
        });
        toast.success("Event successfully published!");
        queryClient.invalidateQueries({ queryKey: ['events'] });
        navigate({ to: "/events" });
      }
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Failed to publish event");
    } finally {
      setIsPublishing(false);
    }
  };

  if (isLoadingProposal) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <FormPageTemplate
      title={proposalId ? "Create event from proposal" : "Create event"}
      onPublish={handlePublish}
      description="Set up an event, its schedule, competitions and publishing rules."
      crumbs={[
        { label: "Programs" },
        { label: "Events", to: "/events" },
        { label: "Create event" },
      ]}
      steps={[
        {
          title: "Basics",
          description: "Name, category and visibility of the event",
          content: (
            <div className="grid gap-5 lg:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="event-name">Event name</Label>
                <Input id="event-name" placeholder="Global AI Innovation Summit 2026" value={eventName} onChange={(e) => setEventName(e.target.value)} />
                <p className="text-xs text-muted-foreground">
                  Displayed publicly on the listing page.
                </p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="event-category">Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger id="event-category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hackathon">Hackathon</SelectItem>
                    <SelectItem value="summit">Summit</SelectItem>
                    <SelectItem value="case">Case study</SelectItem>
                    <SelectItem value="fellowship">Fellowship</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <MultiSelect
                label="Tracks"
                options={["Hackathon", "Design", "Case Study", "Research", "Pitch"]}
                value={tracks}
                onChange={setTracks}
              />
              <TagInput label="Tags" tags={tags} onChange={setTags} />
              <div className="lg:col-span-2">
                <div className="flex items-center justify-between mb-1.5">
                  <Label className="text-xs text-muted-foreground invisible">Description</Label>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    className="h-7 text-xs bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 hover:from-violet-500/20 hover:to-fuchsia-500/20 border-violet-200 dark:border-violet-900 text-violet-700 dark:text-violet-300"
                    onClick={handleGenerateAI}
                    disabled={isGenerating || !eventName}
                  >
                    {isGenerating ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Sparkles className="mr-1.5 h-3.5 w-3.5" />}
                    Generate with AI
                  </Button>
                </div>
                <RichTextEditor value={description} onChange={setDescription} />
              </div>

              <div className="lg:col-span-2">
                <div className="flex items-center justify-between mb-1.5">
                  <Label className="text-xs text-muted-foreground invisible">Rules</Label>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    className="h-7 text-xs bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 hover:from-violet-500/20 hover:to-fuchsia-500/20 border-violet-200 dark:border-violet-900 text-violet-700 dark:text-violet-300"
                    onClick={handleGenerateRulesAI}
                    disabled={isGeneratingRules || !eventName}
                  >
                    {isGeneratingRules ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Sparkles className="mr-1.5 h-3.5 w-3.5" />}
                    Generate Rules with AI
                  </Button>
                </div>
                <RichTextEditor label="Rules & Guidelines" placeholder="Describe eligibility, IP rules, code of conduct..." value={rules} onChange={setRules} />
              </div>
              
              <div className="flex items-center justify-between rounded-lg border border-border bg-surface/60 p-4 lg:col-span-2">
                <div>
                  <p className="text-sm font-medium">Public listing</p>
                  <p className="text-xs text-muted-foreground">
                    Show this event in the global discovery feed.
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
            </div>
          ),
        },
        {
          title: "Schedule",
          description: "Dates, timezone and registration windows",
          content: (
            <div className="grid gap-5 lg:grid-cols-3">
              <DatePicker label="Start date" date={start} onSelect={setStart} />
              <DatePicker label="End date" date={end} onSelect={setEnd} />
              <TimePicker label="Daily start time" value={time} onChange={setTime} />
              <DatePicker label="Registration Start" date={regStart} onSelect={setRegStart} />
              <DatePicker label="Registration End" date={regEnd} onSelect={setRegEnd} />
              
              <div className="space-y-1.5">
                <Label htmlFor="capacity">Capacity</Label>
                <Input id="capacity" type="number" defaultValue={2000} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tz">Timezone</Label>
                <Select defaultValue="utc">
                  <SelectTrigger id="tz">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="utc">UTC</SelectItem>
                    <SelectItem value="ist">Asia/Kolkata</SelectItem>
                    <SelectItem value="cet">Europe/Berlin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="mode">Mode</Label>
                <Select defaultValue="hybrid">
                  <SelectTrigger id="mode">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="onsite">Onsite</SelectItem>
                    <SelectItem value="online">Online</SelectItem>
                    <SelectItem value="hybrid">Hybrid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          ),
        },
        {
          title: "Registration Settings",
          description: "Configure how participants join the event.",
          content: (
            <div className="grid gap-5 lg:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="regType">Registration Type</Label>
                <Select value={registrationType} onValueChange={(val: any) => setRegistrationType(val)}>
                  <SelectTrigger id="regType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INDIVIDUAL">Individual</SelectItem>
                    <SelectItem value="TEAM">Team</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {registrationType === "TEAM" && (
                <div className="space-y-1.5">
                  <Label htmlFor="maxTeamSize">Team Size / Maximum Team Participants</Label>
                  <Select value={maxTeamSize || "4"} onValueChange={(val) => setMaxTeamSize(val)}>
                    <SelectTrigger id="maxTeamSize">
                      <SelectValue placeholder="Select max team size" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2">2 Participants</SelectItem>
                      <SelectItem value="3">3 Participants</SelectItem>
                      <SelectItem value="4">4 Participants</SelectItem>
                      <SelectItem value="5">5 Participants</SelectItem>
                      <SelectItem value="6">6 Participants</SelectItem>
                      <SelectItem value="7">7 Participants</SelectItem>
                      <SelectItem value="8">8 Participants</SelectItem>
                      <SelectItem value="10">10 Participants</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          ),
        },
        {
          title: "Event Rounds",
          description: "Configure competition rounds, maximum marks, deadlines, and submission rules.",
          content: (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium">Rounds Configuration ({rounds.length} rounds)</h4>
                  <p className="text-xs text-muted-foreground">Define each round's parameters and evaluation weight.</p>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={addRound}>
                  + Add Round
                </Button>
              </div>

              <div className="space-y-4">
                {rounds.map((round, idx) => (
                  <div key={idx} className="p-4 rounded-lg border border-border bg-card/60 space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="h-6 w-6 rounded-full bg-primary/10 text-primary text-xs font-semibold flex items-center justify-center">
                          {round.roundNumber}
                        </span>
                        <Input
                          value={round.name}
                          onChange={(e) => updateRoundField(idx, "name", e.target.value)}
                          placeholder="Round Name"
                          className="h-8 font-medium max-w-xs text-sm"
                        />
                      </div>
                      {rounds.length > 1 && (
                        <Button type="button" variant="ghost" size="sm" className="h-8 text-xs text-red-500 hover:text-red-600 hover:bg-red-500/10" onClick={() => removeRound(idx)}>
                          Remove
                        </Button>
                      )}
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3">
                      <div>
                        <Label className="text-xs">Description</Label>
                        <Input
                          value={round.description || ""}
                          onChange={(e) => updateRoundField(idx, "description", e.target.value)}
                          placeholder="e.g. Submit project deck"
                          className="h-8 text-xs mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Maximum Marks</Label>
                        <Input
                          type="number"
                          value={round.maxMarks}
                          onChange={(e) => updateRoundField(idx, "maxMarks", Number(e.target.value))}
                          className="h-8 text-xs mt-1"
                          min={1}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Submission Type</Label>
                        <Select value={round.submissionType || "FILE"} onValueChange={(val) => updateRoundField(idx, "submissionType", val)}>
                          <SelectTrigger className="h-8 text-xs mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="FILE">File Upload</SelectItem>
                            <SelectItem value="LINK">URL / Repository Link</SelectItem>
                            <SelectItem value="TEXT">Text Summary</SelectItem>
                            <SelectItem value="ALL">All (Files + Links + Text)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ),
        },
        {
          title: "Media",
          description: "Banner, brand assets and supporting documents",
          content: (
            <FileUpload label="Event assets" hint="Banner 1600×600, rules PDF, sponsor kit" />
          ),
        },
        {
          title: "Coordinators",
          description: "Assign faculty and student coordinators for event execution",
          content: (
            <div className="grid gap-5 lg:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="facultyCoordinator">Faculty Coordinator</Label>
                <Select value={facultyCoordinatorId} onValueChange={setFacultyCoordinatorId}>
                  <SelectTrigger id="facultyCoordinator">
                    <SelectValue placeholder="Select Faculty Coordinator" />
                  </SelectTrigger>
                  <SelectContent>
                    {facultyCoordinators.map((m: any) => (
                      <SelectItem key={m.user.id} value={m.user.id}>
                        {m.user.firstName} {m.user.lastName} ({m.user.email})
                      </SelectItem>
                    ))}
                    {facultyCoordinators.length === 0 && (
                      <SelectItem value="none" disabled>
                        No Faculty Coordinators found in organization
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Responsible for faculty approvals and event oversight.</p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="studentCoordinator">Student Coordinator</Label>
                <Select value={studentCoordinatorId} onValueChange={setStudentCoordinatorId}>
                  <SelectTrigger id="studentCoordinator">
                    <SelectValue placeholder="Select Student Coordinator" />
                  </SelectTrigger>
                  <SelectContent>
                    {studentCoordinators.map((m: any) => (
                      <SelectItem key={m.user.id} value={m.user.id}>
                        {m.user.firstName} {m.user.lastName} ({m.user.email})
                      </SelectItem>
                    ))}
                    {studentCoordinators.length === 0 && (
                      <SelectItem value="none" disabled>
                        No Student Coordinators found in organization
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {proposal ? "Pre-assigned from hackathon proposal submitter." : "Lead student coordinator for day-to-day operations."}
                </p>
              </div>
            </div>
          ),
        },
        {
          title: "Review",
          description: "Confirm configuration before publishing",
          content: (
            <div className="space-y-3">
              <dl className="divide-y divide-border rounded-lg border border-border">
                {[
                  { k: "Event", v: eventName || "Untitled Event" },
                  { k: "Category", v: `${category} · Hybrid` },
                  { k: "Schedule", v: start && end ? `${start.toLocaleDateString()} – ${end.toLocaleDateString()}` : "Not configured" },
                  { k: "Registration Type", v: registrationType },
                  {
                    k: "Faculty Coordinator",
                    v: facultyCoordinators.find((m: any) => m.user.id === facultyCoordinatorId)
                      ? `${facultyCoordinators.find((m: any) => m.user.id === facultyCoordinatorId)?.user.firstName} ${facultyCoordinators.find((m: any) => m.user.id === facultyCoordinatorId)?.user.lastName}`
                      : "Not assigned"
                  },
                  {
                    k: "Student Coordinator",
                    v: studentCoordinators.find((m: any) => m.user.id === studentCoordinatorId)
                      ? `${studentCoordinators.find((m: any) => m.user.id === studentCoordinatorId)?.user.firstName} ${studentCoordinators.find((m: any) => m.user.id === studentCoordinatorId)?.user.lastName}`
                      : "Not assigned"
                  },
                  { k: "Visibility", v: "Public listing enabled" },
                ].map((row) => (
                  <div key={row.k} className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 px-4 py-3">
                    <dt className="text-sm text-muted-foreground">{row.k}</dt>
                    <dd className="text-sm font-medium">{row.v}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ),
        },
      ]}
    />
  );
}
