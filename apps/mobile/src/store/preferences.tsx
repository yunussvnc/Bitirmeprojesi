import React, { createContext, useContext, useMemo, useState } from "react";

export type Preferences = {
  budget?: "low" | "mid" | "high";
  vibe?: "quiet" | "lively";
  purpose?: "work" | "friends" | "date";
};

const defaultPrefs: Preferences = {
  budget: undefined,
  vibe: undefined,
  purpose: undefined,
};

type PreferencesContextValue = {
  prefs: Preferences;
  setPrefs: (p: Preferences) => void;
  patchPrefs: (patch: Partial<Preferences>) => void;
  resetPrefs: () => void;
};

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const [prefs, setPrefs] = useState<Preferences>(defaultPrefs);

  const value = useMemo<PreferencesContextValue>(
    () => ({
      prefs,
      setPrefs,
      patchPrefs: (patch) => setPrefs((prev) => ({ ...prev, ...patch })),
      resetPrefs: () => setPrefs(defaultPrefs),
    }),
    [prefs]
  );

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences() {
  const ctx = useContext(PreferencesContext);
  if (!ctx) throw new Error("usePreferences must be used within PreferencesProvider");
  return ctx;
}
