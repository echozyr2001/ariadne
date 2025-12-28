import type { CommitMessageResult } from "@/commit";
import type { CodeReviewResult } from "@/codeReview";
import type { SkillDecision, SkillName } from "@/skills";

// New unified state type
export type AppScreen =
  | "help"
  | "routing"
  | "generating"
  | "confirming"
  | "executing"
  | "commit_ready"
  | "code_review_ready"
  | "error"
  | "cancelled"
  | "success";

export interface AriadneState {
  screen: AppScreen;
  intent: string;
  command: string;
  error: Error | null;
  activeSkill: SkillName | "routing" | null;
  skillDecision: SkillDecision | null;
  commitResult: CommitMessageResult | null;
  codeReviewResult: CodeReviewResult | null;
}

// Legacy AppState type for backward compatibility
export type AppState = AppScreen;

export interface AppProps {
  args: string[];
}

export interface HeaderProps {
  version?: string;
}

export interface IntentDisplayProps {
  intent: string;
}

export interface LoadingSpinnerProps {
  text?: string;
}

export interface CommandDisplayProps {
  command: string;
}

export interface ConfirmPromptProps {
  onConfirm: () => void;
  onCancel: () => void;
}

export interface ExecutionStatusProps {
  command: string;
}

export interface ErrorDisplayProps {
  error: Error;
  type?: "generation" | "execution" | "general";
}

export interface CommitMessageDisplayProps {
  result: CommitMessageResult;
}

export interface CodeReviewDisplayProps {
  result: CodeReviewResult;
}
