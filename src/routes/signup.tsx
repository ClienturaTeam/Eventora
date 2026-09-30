import { useState } from "react";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { fetchApi, ApiError } from "@/lib/api-client";
import { UserPlus, Eye, EyeOff } from "lucide-react";
import { ClienturaLogo } from "@/components/ds/clientura-logo";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Sign Up · Eventora" },
      { name: "description", content: "Create an account on Eventora." },
    ],
  }),
  component: SignupPage,
});

const signupSchema = z
  .object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    email: z.string().trim().toLowerCase().email("Please enter a valid email address"),
    mobileNumber: z
      .string()
      .optional()
      .refine(
        (val) => !val || /^[0-9+\s-]{10,15}$/.test(val),
        "Please enter a valid mobile number (10-15 digits)"
      ),
    password: z.string().min(8, "Password must be at least 8 characters long"),
    confirmPassword: z.string().min(8, "Password confirmation is required"),
    role: z.enum(["Participant", "Student Coordinator", "Faculty Coordinator", "Judge"]),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type SignupFormValues = z.infer<typeof signupSchema>;

function SignupPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      mobileNumber: "",
      password: "",
      confirmPassword: "",
      role: "Participant",
    },
  });

  const onSubmit = async (data: SignupFormValues) => {
    try {
      setIsLoading(true);

      const res = await fetchApi("/auth/register", {
        method: "POST",
        body: JSON.stringify({
          email: data.email.trim().toLowerCase(),
          password: data.password,
          firstName: data.firstName.trim(),
          lastName: data.lastName.trim(),
          mobileNumber: data.mobileNumber?.trim() || undefined,
          role: data.role || "Participant",
        }),
      });

      if (res.success) {
        if (data.role === "Faculty Coordinator") {
          toast.success(
            "Your Faculty Coordinator request has been submitted. A Manager will review your request."
          );
        } else {
          toast.success("Account created successfully! Please sign in.");
        }
        router.navigate({ to: "/login" });
      } else {
        toast.error(res.error?.message || "Failed to create account. Please try again.");
      }
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(error.message || "Failed to create account. Please check your details.");
      } else {
        toast.error("An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 sm:p-8 relative">
      <div className="absolute left-8 top-8">
        <Link to="/" className="hover:opacity-90 transition-opacity">
          <ClienturaLogo size="md" />
        </Link>
      </div>

      <Card className="w-full max-w-md my-12">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <UserPlus className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">Create an Account</CardTitle>
          <CardDescription>
            Enter your details below to register for an account
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  placeholder="John"
                  {...register("firstName")}
                  disabled={isLoading}
                />
                {errors.firstName && (
                  <p className="text-xs text-destructive">{errors.firstName.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  placeholder="Doe"
                  {...register("lastName")}
                  disabled={isLoading}
                />
                {errors.lastName && (
                  <p className="text-xs text-destructive">{errors.lastName.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                {...register("email")}
                disabled={isLoading}
              />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="mobileNumber">Mobile Number (Optional)</Label>
              <Input
                id="mobileNumber"
                type="tel"
                placeholder="9876543210"
                {...register("mobileNumber")}
                disabled={isLoading}
              />
              {errors.mobileNumber && (
                <p className="text-xs text-destructive">{errors.mobileNumber.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="pr-10"
                  {...register("password")}
                  disabled={isLoading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                  <span className="sr-only">
                    {showPassword ? "Hide password" : "Show password"}
                  </span>
                </Button>
              </div>
              {errors.password && (
                <p className="text-xs text-destructive">{errors.password.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password *</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="pr-10"
                  {...register("confirmPassword")}
                  disabled={isLoading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={isLoading}
                  tabIndex={-1}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                  <span className="sr-only">
                    {showConfirmPassword ? "Hide password" : "Show password"}
                  </span>
                </Button>
              </div>
              {errors.confirmPassword && (
                <p className="text-xs text-destructive">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            <div className="space-y-3 pt-2">
              <Label>Choose Account Type</Label>
              <div className="grid gap-3">
                <label className="flex items-start space-x-3 space-y-0 rounded-md border p-3 cursor-pointer hover:bg-muted/50 has-[:checked]:border-primary has-[:checked]:bg-primary/5 transition-colors">
                  <input
                    type="radio"
                    value="Participant"
                    className="mt-1"
                    {...register("role")}
                  />
                  <div className="space-y-0.5">
                    <p className="text-xs font-semibold leading-none">Participant</p>
                    <p className="text-xs text-muted-foreground">
                      Register for events and participate in approved hackathons.
                    </p>
                  </div>
                </label>
                <label className="flex items-start space-x-3 space-y-0 rounded-md border p-3 cursor-pointer hover:bg-muted/50 has-[:checked]:border-primary has-[:checked]:bg-primary/5 transition-colors">
                  <input
                    type="radio"
                    value="Student Coordinator"
                    className="mt-1"
                    {...register("role")}
                  />
                  <div className="space-y-0.5">
                    <p className="text-xs font-semibold leading-none">Student Coordinator</p>
                    <p className="text-xs text-muted-foreground">
                      Coordinate events when assigned by a Faculty Coordinator.
                    </p>
                  </div>
                </label>
                <label className="flex items-start space-x-3 space-y-0 rounded-md border p-3 cursor-pointer hover:bg-muted/50 has-[:checked]:border-primary has-[:checked]:bg-primary/5 transition-colors">
                  <input
                    type="radio"
                    value="Faculty Coordinator"
                    className="mt-1"
                    {...register("role")}
                  />
                  <div className="space-y-0.5">
                    <p className="text-xs font-semibold leading-none">Faculty Coordinator</p>
                    <p className="text-xs text-muted-foreground">
                      Manage Student Coordinators and coordinate assigned events. Requires Manager approval.
                    </p>
                  </div>
                </label>
                <label className="flex items-start space-x-3 space-y-0 rounded-md border p-3 cursor-pointer hover:bg-muted/50 has-[:checked]:border-primary has-[:checked]:bg-primary/5 transition-colors">
                  <input
                    type="radio"
                    value="Judge"
                    className="mt-1"
                    {...register("role")}
                  />
                  <div className="space-y-0.5">
                    <p className="text-xs font-semibold leading-none">Judge</p>
                    <p className="text-xs text-muted-foreground">
                      Access the grading and evaluation portal for assigned competitions.
                    </p>
                  </div>
                </label>
              </div>
              {errors.role && <p className="text-xs text-destructive">{errors.role.message}</p>}
            </div>

            <Button type="submit" className="w-full mt-2" disabled={isLoading}>
              {isLoading ? "Creating Account..." : "Create Account"}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex flex-col gap-4 text-center text-sm text-muted-foreground">
          <p>
            Already have an account?{" "}
            <Link
              to="/login"
              className="underline font-medium text-primary hover:text-primary/80"
            >
              Sign in
            </Link>
          </p>
          <p className="text-xs">
            By registering, you agree to our{" "}
            <a href="#" className="underline hover:text-foreground">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="#" className="underline hover:text-foreground">
              Privacy Policy
            </a>
            .
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
