import { createContext, useContext, useState, useEffect } from "react";

interface JudgeProfileContextType {
  selectedProfileId: string | null;
  setSelectedProfileId: (id: string | null) => void;
}

const JudgeProfileContext = createContext<JudgeProfileContextType | undefined>(undefined);

export function JudgeProfileProvider({ children }: { children: React.ReactNode }) {
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);

  // Persist selected profile ID to local storage
  useEffect(() => {
    const saved = localStorage.getItem("ascent_judge_profile_id");
    if (saved) setSelectedProfileId(saved);
  }, []);

  const handleSetProfile = (id: string | null) => {
    setSelectedProfileId(id);
    if (id) {
      localStorage.setItem("ascent_judge_profile_id", id);
    } else {
      localStorage.removeItem("ascent_judge_profile_id");
    }
  };

  return (
    <JudgeProfileContext.Provider value={{ selectedProfileId, setSelectedProfileId: handleSetProfile }}>
      {children}
    </JudgeProfileContext.Provider>
  );
}

export function useJudgeProfile() {
  const context = useContext(JudgeProfileContext);
  if (context === undefined) {
    throw new Error("useJudgeProfile must be used within a JudgeProfileProvider");
  }
  return context;
}
