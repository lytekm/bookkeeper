import type { DemoState } from "./types";

const STORAGE_KEY = "bookkeeper-demo-state-v1";

export const loadState = (): DemoState | null => {
  if (typeof window === "undefined") {
    return null;
  }
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as DemoState;
  } catch {
    return null;
  }
};

export const saveState = (state: DemoState) => {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

export const clearState = () => {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.removeItem(STORAGE_KEY);
};
