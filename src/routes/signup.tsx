import { useState, useEffect } from "react";
import { createFileRoute, useRouter, Link } from "@tanstack/react-router";
import { z } from "zod";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { fetchApi, ApiError } from "@/lib/api-client";
import { toast } from "sonner";
import { Users, CheckCircle2, ArrowRight, ShieldCheck, UserCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ClienturaLogo } from "@/components/ds/clientura-logo";

export const Route = createFileRoute("/signup")({
  component: SignupPage,
});

const participantSchema = z.object({
  name: z.string().min(1, "Participant name is required"),
  email: z.string().email("Invalid email").or(z.literal("")).optional(),
  contactNumber: z.string().optional(),
  college: z.string().optional(),
  department: z.string().optional(),
});

const teamRegistrationSchema = z.object({
  teamName: z.string().min(2, "Team name must be at least 2 characters"),
  teamSize: z.coerce.number().min(2, "Minimum team size is 2").max(5, "Maximum team size is 5"),
  teamLead: z.object({
    name: z.string().min(2, "Team lead full name is required"),
    email: z.string().email("Please enter a valid email address"),
    contactNumber: z.string().min(10, "Contact number must be at least 10 digits"),
    password: z.string().min(8, "Password must be at least 8 characters long"),
    confirmPassword: z.string().min(8, "Password confirmation is required"),
  }),
  participants: z.array(participantSchema),
}).refine((data) => data.teamLead.password === data.teamLead.confirmPassword, {
  message: "Passwords do not match",
  path: ["teamLead", "confirmPassword"],
}).refine((data) => data.participants.length === data.teamSize - 1, {
  message: "Participant count must match team size minus team lead",
  path: ["teamSize"],
});

type TeamRegistrationValues = z.infer<typeof teamRegistrationSchema>;

function SignupPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState<any>(null);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<TeamRegistrationValues>({
    resolver: zodResolver(teamRegistrationSchema),
    defaultValues: {
      teamName: "",
      teamSize: 4,
      teamLead: {
        name: "",
        email: "",
        contactNumber: "",
        password: "",
        confirmPassword: "",
      },
      participants: [
        { name: "", email: "", contactNumber: "", college: "", department: "" },
        { name: "", email: "", contactNumber: "", college: "", department: "" },
        { name: "", email: "", contactNumber: "", college: "", department: "" },
      ],
    },
  });

  const { fields, replace } = useFieldArray({
    control,
    name: "participants",
  });

  const selectedTeamSize = watch("teamSize");

  // Dynamically update participant input fields when team size changes
  useEffect(() => {
    const requiredParticipantCount = selectedTeamSize - 1;
    const currentCount = fields.length;

    if (requiredParticipantCount !== currentCount) {
      const newParticipants = Array.from({ length: requiredParticipantCount }, (_, idx) => {
        return fields[idx] || { name: "", email: "", contactNumber: "", college: "", department: "" };
      });
      replace(newParticipants);
    }
  }, [selectedTeamSize]);

  const onSubmit = async (data: TeamRegistrationValues) => {
    try {
      setIsLoading(true);
      const res = await fetchApi("/registrations/team", {
        method: "POST",
        body: JSON.stringify({
          teamName: data.teamName,
          teamSize: Number(data.teamSize),
          teamLead: {
            name: data.teamLead.name,
            email: data.teamLead.email,
            contactNumber: data.teamLead.contactNumber,
            password: data.teamLead.password,
          },
          participants: data.participants,
        }),
      });

      if (res.success) {
        toast.success("Team registered successfully!");
        setRegistrationSuccess({
          teamName: data.teamName,
          teamSize: data.teamSize,
          teamLeadName: data.teamLead.name,
          teamLeadEmail: data.teamLead.email,
        });
      } else {
        toast.error(res.error?.message || "Failed to register team.");
      }
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(error.message || "Failed to register team.");
      } else {
        toast.error("An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (registrationSuccess) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 sm:p-8">
        <div className="absolute left-8 top-8 flex items-center gap-2">
          <Link to="/" className="hover:opacity-90 transition-opacity">
            <ClienturaLogo size="md" />
          </Link>
        </div>

        <Card className="w-full max-w-lg mt-8 border-emerald-500/30 shadow-lg">
          <CardHeader className="space-y-2 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
              <CheckCircle2 className="h-10 w-10" />
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight text-emerald-600">
              Registration Successful!
            </CardTitle>
            <CardDescription className="text-base">
              Your team has been officially registered for Eventora Hackathon.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="rounded-lg border bg-muted/40 p-4 space-y-3">
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground font-medium">Team Name:</span>
                <span className="font-bold text-foreground">{registrationSuccess.teamName}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground font-medium">Team Size:</span>
                <span className="font-semibold">{registrationSuccess.teamSize} Members</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground font-medium">Team Lead:</span>
                <span className="font-semibold">{registrationSuccess.teamLeadName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground font-medium">Login Email:</span>
                <span className="font-mono text-primary font-semibold">{registrationSuccess.teamLeadEmail}</span>
              </div>
            </div>

            <div className="p-3 bg-amber-500/10 rounded-md border border-amber-500/20 text-xs text-amber-700 dark:text-amber-400">
              <p className="font-semibold flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4" /> Team Lead Login Info
              </p>
              <p className="mt-1">
                Only the Team Lead ({registrationSuccess.teamLeadEmail}) can log into the student portal using their email and password.
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button className="w-full" size="lg" onClick={() => router.navigate({ to: "/login" })}>
              Go to Login <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 sm:p-8">
      <div className="absolute left-8 top-8 flex items-center gap-2">
        <Link to="/" className="hover:opacity-90 transition-opacity">
          <ClienturaLogo size="md" />
        </Link>
      </div>

      <Card className="w-full max-w-2xl mt-8">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Users className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">
            Eventora Hackathon Team Registration
          </CardTitle>
          <CardDescription>
            Register your team for the hackathon. Only the Team Lead will receive portal login credentials.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Section 1: Team Configuration */}
            <div className="space-y-4 rounded-lg border p-4 bg-muted/20">
              <h3 className="text-sm font-semibold text-primary flex items-center gap-2">
                <Users className="h-4 w-4" /> Team Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="teamName">Team Name *</Label>
                  <Input
                    id="teamName"
                    placeholder="e.g. Team Alpha"
                    {...register("teamName")}
                    disabled={isLoading}
                  />
                  {errors.teamName && <p className="text-xs text-destructive">{errors.teamName.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="teamSize">Team Size *</Label>
                  <Select
                    value={String(selectedTeamSize)}
                    onValueChange={(val) => setValue("teamSize", Number(val))}
                    disabled={isLoading}
                  >
                    <SelectTrigger id="teamSize">
                      <SelectValue placeholder="Select Team Size" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2">2 Members (Lead + 1 Participant)</SelectItem>
                      <SelectItem value="3">3 Members (Lead + 2 Participants)</SelectItem>
                      <SelectItem value="4">4 Members (Lead + 3 Participants)</SelectItem>
                      <SelectItem value="5">5 Members (Lead + 4 Participants)</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.teamSize && <p className="text-xs text-destructive">{errors.teamSize.message}</p>}
                </div>
              </div>
            </div>

            {/* Section 2: Team Lead Details */}
            <div className="space-y-4 rounded-lg border p-4 bg-primary/5 border-primary/20">
              <h3 className="text-sm font-semibold text-primary flex items-center gap-2">
                <UserCheck className="h-4 w-4" /> Team Lead Details (Login Account)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="leadName">Full Name *</Label>
                  <Input
                    id="leadName"
                    placeholder="Team Lead Full Name"
                    {...register("teamLead.name")}
                    disabled={isLoading}
                  />
                  {errors.teamLead?.name && <p className="text-xs text-destructive">{errors.teamLead.name.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="leadEmail">Login Email *</Label>
                  <Input
                    id="leadEmail"
                    type="email"
                    placeholder="lead@example.com"
                    {...register("teamLead.email")}
                    disabled={isLoading}
                  />
                  {errors.teamLead?.email && <p className="text-xs text-destructive">{errors.teamLead.email.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="leadPhone">Contact Number *</Label>
                  <Input
                    id="leadPhone"
                    placeholder="9876543210"
                    {...register("teamLead.contactNumber")}
                    disabled={isLoading}
                  />
                  {errors.teamLead?.contactNumber && <p className="text-xs text-destructive">{errors.teamLead.contactNumber.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="leadPassword">Password *</Label>
                  <Input
                    id="leadPassword"
                    type="password"
                    placeholder="••••••••"
                    {...register("teamLead.password")}
                    disabled={isLoading}
                  />
                  {errors.teamLead?.password && <p className="text-xs text-destructive">{errors.teamLead.password.message}</p>}
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="leadConfirmPassword">Confirm Password *</Label>
                  <Input
                    id="leadConfirmPassword"
                    type="password"
                    placeholder="••••••••"
                    {...register("teamLead.confirmPassword")}
                    disabled={isLoading}
                  />
                  {errors.teamLead?.confirmPassword && <p className="text-xs text-destructive">{errors.teamLead.confirmPassword.message}</p>}
                </div>
              </div>
            </div>

            {/* Section 3: Dynamically Generated Participants */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b pb-2">
                <h3 className="text-sm font-semibold text-foreground">
                  Participant Details ({fields.length} Participants)
                </h3>
                <span className="text-xs text-muted-foreground">Generated based on Team Size = {selectedTeamSize}</span>
              </div>

              {fields.map((field, index) => (
                <div key={field.id} className="p-4 border rounded-lg space-y-3 bg-card">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Participant {index + 2}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor={`p-name-${index}`} className="text-xs">Participant Name *</Label>
                      <Input
                        id={`p-name-${index}`}
                        placeholder={`Participant ${index + 2} Name`}
                        {...register(`participants.${index}.name` as const)}
                        disabled={isLoading}
                      />
                      {errors.participants?.[index]?.name && (
                        <p className="text-xs text-destructive">{errors.participants[index]?.name?.message}</p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor={`p-email-${index}`} className="text-xs">Email (Optional)</Label>
                      <Input
                        id={`p-email-${index}`}
                        type="email"
                        placeholder="email@example.com"
                        {...register(`participants.${index}.email` as const)}
                        disabled={isLoading}
                      />
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor={`p-college-${index}`} className="text-xs">College (Optional)</Label>
                      <Input
                        id={`p-college-${index}`}
                        placeholder="e.g. NIT Warangal"
                        {...register(`participants.${index}.college` as const)}
                        disabled={isLoading}
                      />
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor={`p-dept-${index}`} className="text-xs">Department (Optional)</Label>
                      <Input
                        id={`p-dept-${index}`}
                        placeholder="e.g. Computer Science"
                        {...register(`participants.${index}.department` as const)}
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
              {isLoading ? "Registering Team..." : "Submit Team Registration"}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex flex-col gap-4 text-center text-sm text-muted-foreground border-t pt-4">
          <p>
            Already registered?{" "}
            <Link to="/login" className="underline font-medium text-primary hover:text-primary/80">
              Team Lead Sign in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
