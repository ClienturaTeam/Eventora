import { useState } from "react";
import { createFileRoute, useRouter, Link } from "@tanstack/react-router";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { fetchApi, ApiError } from "@/lib/api-client";
import { toast } from "sonner";
import { Trophy } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/signup")({
  component: SignupPage,
});

const signupSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters long"),
  confirmPassword: z.string().min(8, "Password confirmation is required"),
  role: z.enum(["Participant", "Student Coordinator", "Faculty Coordinator"]),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type SignupFormValues = z.infer<typeof signupSchema>;

function SignupPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

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
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          password: data.password,
          role: data.role,
        }),
      });

      if (res.success) {
        if (data.role === "Faculty Coordinator") {
          toast.success("Your Faculty Coordinator request has been submitted. A Manager will review your request.");
        } else {
          toast.success("Account created successfully! Please log in.");
        }
        router.navigate({ to: "/login" });
      } else {
        toast.error("Failed to create account.");
      }
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(error.message || "Failed to sign up.");
      } else {
        toast.error("An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 sm:p-8">
      <div className="absolute left-8 top-8 flex items-center gap-2">
        <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Trophy className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold tracking-tight text-foreground">Eventora</span>
        </Link>
      </div>

      <Card className="w-full max-w-sm mt-8">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold tracking-tight">
            Create an Account
          </CardTitle>
          <CardDescription>
            Enter your details to register for an account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  placeholder="John"
                  {...register("firstName")}
                  disabled={isLoading}
                />
                {errors.firstName && <p className="text-sm text-destructive">{errors.firstName.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  placeholder="Doe"
                  {...register("lastName")}
                  disabled={isLoading}
                />
                {errors.lastName && <p className="text-sm text-destructive">{errors.lastName.message}</p>}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                {...register("email")}
                disabled={isLoading}
              />
              {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                {...register("password")}
                disabled={isLoading}
              />
              {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                {...register("confirmPassword")}
                disabled={isLoading}
              />
              {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>}
            </div>

            <div className="space-y-3 pt-2">
              <Label>Choose Account Type</Label>
              <div className="grid gap-3">
                <label className="flex items-start space-x-3 space-y-0 rounded-md border p-4 cursor-pointer hover:bg-muted/50 has-[:checked]:border-primary has-[:checked]:bg-primary/5 transition-colors">
                  <input 
                    type="radio" 
                    value="Participant" 
                    className="mt-1"
                    {...register("role")}
                  />
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">Participant</p>
                    <p className="text-sm text-muted-foreground">Register for events and participate in approved events.</p>
                  </div>
                </label>
                <label className="flex items-start space-x-3 space-y-0 rounded-md border p-4 cursor-pointer hover:bg-muted/50 has-[:checked]:border-primary has-[:checked]:bg-primary/5 transition-colors">
                  <input 
                    type="radio" 
                    value="Student Coordinator" 
                    className="mt-1"
                    {...register("role")}
                  />
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">Student Coordinator</p>
                    <p className="text-sm text-muted-foreground">Coordinate events when assigned by a Faculty Coordinator.</p>
                  </div>
                </label>
                <label className="flex items-start space-x-3 space-y-0 rounded-md border p-4 cursor-pointer hover:bg-muted/50 has-[:checked]:border-primary has-[:checked]:bg-primary/5 transition-colors">
                  <input 
                    type="radio" 
                    value="Faculty Coordinator" 
                    className="mt-1"
                    {...register("role")}
                  />
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">Faculty Coordinator</p>
                    <p className="text-sm text-muted-foreground">Manage Student Coordinators and coordinate assigned events. Faculty Coordinator accounts require Manager approval.</p>
                  </div>
                </label>
              </div>
              {errors.role && <p className="text-sm text-destructive">{errors.role.message}</p>}
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Creating Account..." : "Create Account"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col gap-4 text-center text-sm text-muted-foreground">
          <p>
            Already have an account?{" "}
            <Link to="/login" className="underline font-medium text-primary hover:text-primary/80">
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
