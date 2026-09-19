import { useState } from "react";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/lib/auth";
import { fetchApi, ApiError } from "@/lib/api-client";
import { toast } from "sonner";
import { Trophy } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

const mfaSchema = z.object({
  code: z.string().min(6, "Code must be at least 6 characters"),
});

type LoginFormValues = z.infer<typeof loginSchema>;
type MfaFormValues = z.infer<typeof mfaSchema>;

function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [mfaChallenge, setMfaChallenge] = useState<{ challengeToken: string } | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "participant@gmail.com",
      password: "password123",
    },
  });

  const {
    register: registerMfa,
    handleSubmit: handleMfaSubmit,
    formState: { errors: mfaErrors },
  } = useForm<MfaFormValues>({
    resolver: zodResolver(mfaSchema),
  });

  const handleRedirect = (user: any) => {
    if (!user || !user.memberships || user.memberships.length === 0) {
      router.navigate({ to: "/events" });
      return;
    }
    const roleName = user.memberships[0]?.role?.name;
    const memberStatus = user.memberships[0]?.status;

    if (memberStatus === "PENDING") {
      router.navigate({ to: "/pending-approval" });
      return;
    }

    if (roleName === "Sudo Admin" || roleName === "Platform Admin") {
      router.navigate({ to: "/platform-admin" });
    } else if (roleName === "Admin" || roleName === "Organization Admin" || roleName === "Manager") {
      router.navigate({ to: "/manager" });
    } else if (roleName === "Student Coordinator") {
      router.navigate({ to: "/coordinator" });
    } else if (roleName === "Participant") {
      router.navigate({ to: "/participant" });
    } else if (roleName === "Judge") {
      router.navigate({ to: "/evaluations" });
    } else if (roleName === "Mentor") {
      router.navigate({ to: "/teams" });
    } else if (roleName === "Volunteer") {
      router.navigate({ to: "/volunteers" });
    } else {
      router.navigate({ to: "/events" }); // Fallback
    }
  };

  const onSubmit = async (data: LoginFormValues) => {
    try {
      setIsLoading(true);
      const cleanData = {
        ...data,
        email: data.email.trim().toLowerCase(),
      };
      const res = await fetchApi("/auth/login", {
        method: "POST",
        body: JSON.stringify(cleanData),
      });

      if (res.success && res.data?.mfaRequired) {
        setMfaChallenge({ challengeToken: res.data.challengeToken });
        return;
      }

      if (res.success && res.data?.token) {
        login(res.data.token);
        toast.success("Successfully logged in!");
        handleRedirect(res.data.user);
      } else {
        toast.error("Invalid response from server.");
      }
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(error.message || "Failed to log in. Please check your credentials.");
      } else {
        toast.error("An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const onMfaSubmit = async (data: MfaFormValues) => {
    if (!mfaChallenge) return;
    try {
      setIsLoading(true);
      const res = await fetchApi("/auth/mfa/verify", {
        method: "POST",
        body: JSON.stringify({
          challengeToken: mfaChallenge.challengeToken,
          code: data.code,
        }),
      });

      if (res.success && res.data?.token) {
        login(res.data.token);
        toast.success("Successfully logged in!");
        handleRedirect(res.data.user);
      } else {
        toast.error("Invalid response from server.");
      }
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(error.message || "Invalid MFA code.");
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
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
          <Trophy className="h-4 w-4 text-primary-foreground" />
        </div>
        <span className="text-xl font-bold tracking-tight">Eventora</span>
      </div>

      <Card className="w-full max-w-sm">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold tracking-tight">
            {mfaChallenge ? "Two-Factor Authentication" : "Welcome back"}
          </CardTitle>
          <CardDescription>
            {mfaChallenge
              ? "Enter the verification code generated by your authenticator app."
              : "Enter your credentials to access your account"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!mfaChallenge ? (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  {...register("password")}
                  disabled={isLoading}
                />
                {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Signing in..." : "Sign in"}
              </Button>

              <div className="pt-2">
                <p className="text-xs text-muted-foreground mb-2 text-center">Quick Demo Login:</p>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs h-8"
                    onClick={() => {
                      setValue("email", "participant@gmail.com");
                      setValue("password", "password123");
                    }}
                  >
                    Participant
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs h-8"
                    onClick={() => {
                      setValue("email", "admin@ascent.dev");
                      setValue("password", "password123");
                    }}
                  >
                    Admin
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs h-8"
                    onClick={() => {
                      setValue("email", "manager@contoso.com");
                      setValue("password", "password123");
                    }}
                  >
                    Manager
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs h-8"
                    onClick={() => {
                      setValue("email", "elena@ascent.dev");
                      setValue("password", "password123");
                    }}
                  >
                    Judge
                  </Button>
                </div>
              </div>
            </form>
          ) : (
            <form onSubmit={handleMfaSubmit(onMfaSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code">Authentication Code</Label>
                <Input
                  id="code"
                  type="text"
                  placeholder="6-digit code or recovery code"
                  {...registerMfa("code")}
                  disabled={isLoading}
                />
                {mfaErrors.code && <p className="text-sm text-destructive">{mfaErrors.code.message}</p>}
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Verifying..." : "Verify"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                disabled={isLoading}
                onClick={() => setMfaChallenge(null)}
              >
                Back to login
              </Button>
            </form>
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-4 text-center text-sm text-muted-foreground">
          <p>
            By clicking continue, you agree to our{" "}
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
