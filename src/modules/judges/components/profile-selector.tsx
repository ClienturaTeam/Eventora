import { useJudgeProfiles } from "../services/judges.api";
import { useJudgeProfile } from "../hooks/use-judge-profile";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function JudgeProfileSelector({ children }: { children: React.ReactNode }) {
  const { selectedProfileId, setSelectedProfileId } = useJudgeProfile();
  const { data: profiles, isLoading, error } = useJudgeProfiles();

  if (selectedProfileId) {
    return (
      <>
        {/* Render a floating "switch profile" or we can put it in the sidebar. For now, a top banner. */}
        <div className="bg-primary/10 px-4 py-2 flex items-center justify-between">
          <span className="text-sm font-medium">
            Judging as: {profiles?.find((p) => p.id === selectedProfileId)?.name || "Unknown Profile"}
          </span>
          <Button variant="ghost" size="sm" onClick={() => setSelectedProfileId(null)}>
            Switch Profile
          </Button>
        </div>
        {children}
      </>
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !profiles) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <p className="text-destructive">Failed to load judge profiles.</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Who are you?</CardTitle>
          <CardDescription>Select your judge profile to continue</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {profiles.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">No judge profiles created for this organization.</p>
          ) : (
            profiles.map((profile) => (
              <Button
                key={profile.id}
                variant="outline"
                className="w-full justify-start h-auto p-4 flex flex-col items-start gap-1"
                onClick={() => setSelectedProfileId(profile.id)}
              >
                <span className="font-semibold">{profile.name}</span>
                <span className="text-xs text-muted-foreground font-normal">{profile.email}</span>
                {profile.expertise && (
                  <span className="text-xs bg-muted px-2 py-0.5 rounded-full mt-1">
                    {profile.expertise}
                  </span>
                )}
              </Button>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
