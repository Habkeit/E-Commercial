// app/store/languageStore.ts
import { create } from "zustand";

interface LanguageState {
  lang: "en" | "vi";
  toggleLang: () => void;
}

export const useLanguageStore = create<LanguageState>((set, get) => ({
  lang: "en",
  toggleLang: () => set({ lang: get().lang === "en" ? "vi" : "en" }),
}));