import { create } from 'zustand';
import type { WorkspaceRole } from '../types/workspace.types';
import { parseWorkspaceRole } from '../lib/workspace/workspaceSelection';

// The dashboard (Business admin / Manager / Driver) each person chose last,
// shared by every useWorkspace() caller. Remembered per user in localStorage
// so it survives reloads and tab closes; every storage access is wrapped in
// try/catch (private windows, blocked site data) and the app works without it
// — it then falls back to the default dashboard. Not zustand `persist`: the
// value is keyed by user id, and only the chosen role is stored.

// '' stands for "signed in, but this tab doesn't know who yet" (a new tab:
// the auth store lives in sessionStorage while the session cookies don't) —
// the choice is then kept in memory only.
const storageKey = (userId: string) => `kerayego.workspace.${userId}`;

function readRememberedWorkspace(userId: string): WorkspaceRole | null {
  if (!userId) return null;
  try {
    return parseWorkspaceRole(window.localStorage.getItem(storageKey(userId)));
  } catch {
    return null;
  }
}

function writeRememberedWorkspace(userId: string, role: WorkspaceRole) {
  if (!userId) return;
  try {
    window.localStorage.setItem(storageKey(userId), role);
  } catch {
    // Not remembered across reloads; the in-memory choice still applies.
  }
}

interface Remembered {
  userId: string;
  role: WorkspaceRole | null;
}

interface WorkspaceSelectionState {
  /** The choice for `userId`, once read from storage (null before). */
  remembered: Remembered | null;
  /** Load `userId`'s stored choice, unless it's already loaded. */
  load: (userId: string) => void;
  /** Work in `role` from now on, remembered for `userId`. */
  choose: (userId: string, role: WorkspaceRole) => void;
}

export const useWorkspaceSelectionStore = create<WorkspaceSelectionState>()((set, get) => ({
  remembered: null,
  load: (userId) => {
    if (get().remembered?.userId === userId) return;
    set({ remembered: { userId, role: readRememberedWorkspace(userId) } });
  },
  choose: (userId, role) => {
    writeRememberedWorkspace(userId, role);
    set({ remembered: { userId, role } });
  },
}));
