export type AppState =
  | "help"
  | "generating"
  | "confirming"
  | "executing"
  | "success"
  | "error"
  | "cancelled";

export interface ApplicationContext {
  state: AppState;
  intent: string;
  command: string | null;
  error: Error | null;
  exitCode: number;
}

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
