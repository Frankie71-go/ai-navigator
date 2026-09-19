import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { UserProfile } from "@/lib/types";

/** 生成匿名用户 ID（如 anon-7f3a9c），不收集任何个人信息 */
function generateAnonId(): string {
  const rand =
    typeof crypto !== "undefined" && "getRandomValues" in crypto
      ? crypto.getRandomValues(new Uint8Array(3)).join("")
      : Math.random().toString(36).slice(2, 8);
  return `anon-${rand}`;
}

interface ProfileState {
  profile: UserProfile;
  userId?: string; // 匿名 ID，提交时生成，持久化于 localStorage
  setProfile: (p: UserProfile) => void;
  updateProfile: (patch: Partial<UserProfile>) => void;
  ensureUserId: () => string; // 返回已有或新生成的匿名 ID
  reset: () => void;
}

const EMPTY: UserProfile = {
  skillRatings: { Coding: 0, Research: 0, Product: 0, Presentation: 0 },
  goals: [],
  experiences: [],
};

export const useProfileStore = create<ProfileState>()(
  persist(
    (set, get) => ({
      profile: EMPTY,
      userId: undefined,
      setProfile: (p) => set({ profile: p }),
      updateProfile: (patch) =>
        set((s) => ({ profile: { ...s.profile, ...patch } })),
      ensureUserId: () => {
        const existing = get().userId;
        if (existing) return existing;
        const id = generateAnonId();
        set({ userId: id });
        return id;
      },
      reset: () => set({ profile: EMPTY }),
    }),
    { name: "ai-navigator-profile" }
  )
);
