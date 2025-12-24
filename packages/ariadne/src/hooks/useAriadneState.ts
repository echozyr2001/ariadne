import { useReducer, useCallback } from "react";
import type { SkillDecision, SkillName } from "@/skills";
import type { CommitMessageResult } from "@/commit";

// State types
export type AppScreen =
  | "help"
  | "routing"
  | "generating"
  | "confirming"
  | "executing"
  | "commit_ready"
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
}

// Action types
type Action =
  | { type: "INITIALIZE"; intent: string; showHelp: boolean }
  | { type: "START_ROUTING" }
  | { type: "SKILL_DECIDED"; decision: SkillDecision }
  | { type: "COMMAND_GENERATED"; command: string }
  | { type: "COMMIT_GENERATED"; result: CommitMessageResult }
  | { type: "CONFIRM" }
  | { type: "EXECUTING" }
  | { type: "EXECUTION_SUCCESS" }
  | { type: "EXECUTION_FAILED"; error: Error }
  | { type: "GENERATION_FAILED"; error: Error }
  | { type: "CANCEL" }
  | { type: "RESET" };

// Reducer - exported for testing
export function reducer(state: AriadneState, action: Action): AriadneState {
  switch (action.type) {
    case "INITIALIZE":
      return {
        ...state,
        intent: action.intent,
        screen: action.showHelp ? "help" : "routing",
      };

    case "START_ROUTING":
      return {
        ...state,
        screen: "generating",
        activeSkill: "routing",
        skillDecision: null,
        commitResult: null,
        error: null,
      };

    case "SKILL_DECIDED":
      return {
        ...state,
        skillDecision: action.decision,
        activeSkill: action.decision.skill,
        screen: "generating",
      };

    case "COMMAND_GENERATED":
      return {
        ...state,
        command: action.command,
        screen: "confirming",
      };

    case "COMMIT_GENERATED":
      return {
        ...state,
        commitResult: action.result,
        screen: "commit_ready",
      };

    case "CONFIRM":
      return {
        ...state,
        screen: "executing",
      };

    case "EXECUTING":
      return {
        ...state,
        screen: "executing",
      };

    case "EXECUTION_SUCCESS":
      return {
        ...state,
        screen: "success",
      };

    case "EXECUTION_FAILED":
      return {
        ...state,
        error: action.error,
        screen: "error",
      };

    case "GENERATION_FAILED":
      return {
        ...state,
        error: action.error,
        screen: "error",
      };

    case "CANCEL":
      return {
        ...state,
        screen: "cancelled",
      };

    case "RESET":
      return {
        ...state,
        screen: "routing",
        command: "",
        error: null,
        skillDecision: null,
        commitResult: null,
        activeSkill: "routing",
      };

    default:
      return state;
  }
}

// Initial state factory - exported for testing
export function createInitialState(args: string[]): AriadneState {
  const shouldShowHelp =
    args.length === 0 || args.includes("--help") || args.includes("-h");
  const initialIntent = shouldShowHelp ? "" : args.join(" ");

  return {
    screen: shouldShowHelp ? "help" : "routing",
    intent: initialIntent,
    command: "",
    error: null,
    activeSkill: "routing",
    skillDecision: null,
    commitResult: null,
  };
}

// Spinner text helper - exported for testing
export function getSpinnerText(state: AriadneState): string {
  if (state.activeSkill === "routing") {
    return "Routing intent to the right skill...";
  }
  if (state.activeSkill === "commit_message") {
    return "Preparing commit message (reading git diff)...";
  }
  return "Generating shell command...";
}

// Custom hook
export function useAriadneState(args: string[]) {
  const [state, dispatch] = useReducer(
    reducer,
    args,
    createInitialState
  );

  // Action creators
  const startRouting = useCallback(() => {
    dispatch({ type: "START_ROUTING" });
  }, []);

  const skillDecided = useCallback((decision: SkillDecision) => {
    dispatch({ type: "SKILL_DECIDED", decision });
  }, []);

  const commandGenerated = useCallback((command: string) => {
    dispatch({ type: "COMMAND_GENERATED", command });
  }, []);

  const commitGenerated = useCallback((result: CommitMessageResult) => {
    dispatch({ type: "COMMIT_GENERATED", result });
  }, []);

  const confirm = useCallback(() => {
    dispatch({ type: "CONFIRM" });
  }, []);

  const executing = useCallback(() => {
    dispatch({ type: "EXECUTING" });
  }, []);

  const executionSuccess = useCallback(() => {
    dispatch({ type: "EXECUTION_SUCCESS" });
  }, []);

  const executionFailed = useCallback((error: Error) => {
    dispatch({ type: "EXECUTION_FAILED", error });
  }, []);

  const generationFailed = useCallback((error: Error) => {
    dispatch({ type: "GENERATION_FAILED", error });
  }, []);

  const cancel = useCallback(() => {
    dispatch({ type: "CANCEL" });
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: "RESET" });
  }, []);

  // Derived state
  const spinnerText = useCallback(() => {
    return getSpinnerText(state);
  }, [state]);

  return {
    // State
    state,

    // Actions
    startRouting,
    skillDecided,
    commandGenerated,
    commitGenerated,
    confirm,
    executing,
    executionSuccess,
    executionFailed,
    generationFailed,
    cancel,
    reset,

    // Derived
    spinnerText,
  };
}
