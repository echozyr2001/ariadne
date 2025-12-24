import { expect, test, describe } from "bun:test";
import {
  reducer,
  createInitialState,
  getSpinnerText,
  type AriadneState,
} from "@/hooks/useAriadneState";

// Test initial state creation
describe("createInitialState", () => {
  test("should initialize with help screen when no args provided", () => {
    const state = createInitialState([]);
    expect(state.screen).toBe("help");
    expect(state.intent).toBe("");
  });

  test("should initialize with routing screen when args provided", () => {
    const state = createInitialState(["list", "files"]);
    expect(state.screen).toBe("routing");
    expect(state.intent).toBe("list files");
  });

  test("should initialize with help screen when --help flag provided", () => {
    const state = createInitialState(["--help"]);
    expect(state.screen).toBe("help");
    expect(state.intent).toBe("");
  });

  test("should handle help flag with other args", () => {
    const state = createInitialState(["list", "--help"]);
    expect(state.screen).toBe("help");
    // When help flag is present, intent is empty regardless of other args
    expect(state.intent).toBe("");
  });

  test("should handle -h flag", () => {
    const state = createInitialState(["-h"]);
    expect(state.screen).toBe("help");
  });
});

// Test reducer state transitions
describe("reducer", () => {
  test("should transition from routing to generating", () => {
    const initialState: AriadneState = {
      screen: "routing",
      intent: "test",
      command: "",
      error: null,
      activeSkill: "routing",
      skillDecision: null,
      commitResult: null,
    };

    const newState = reducer(initialState, { type: "START_ROUTING" });

    expect(newState.screen).toBe("generating");
    expect(newState.activeSkill).toBe("routing");
    expect(newState.skillDecision).toBeNull();
    expect(newState.error).toBeNull();
  });

  test("should handle skill decision action", () => {
    const initialState: AriadneState = {
      screen: "generating",
      intent: "test",
      command: "",
      error: null,
      activeSkill: "routing",
      skillDecision: null,
      commitResult: null,
    };

    const decision = {
      skill: "shell_command" as const,
      reason: "test reason",
      confidence: 0.8,
      via: "heuristic" as const,
    };

    const newState = reducer(initialState, { type: "SKILL_DECIDED", decision });

    expect(newState.skillDecision).toEqual(decision);
    expect(newState.activeSkill).toBe("shell_command");
    expect(newState.screen).toBe("generating");
  });

  test("should handle command generation action", () => {
    const initialState: AriadneState = {
      screen: "generating",
      intent: "test",
      command: "",
      error: null,
      activeSkill: "shell_command",
      skillDecision: null,
      commitResult: null,
    };

    const newState = reducer(initialState, { type: "COMMAND_GENERATED", command: "ls -l" });

    expect(newState.command).toBe("ls -l");
    expect(newState.screen).toBe("confirming");
  });

  test("should handle commit generation action", () => {
    const initialState: AriadneState = {
      screen: "generating",
      intent: "test",
      command: "",
      error: null,
      activeSkill: "commit_message",
      skillDecision: null,
      commitResult: null,
    };

    const commitResult = {
      subject: "feat: add new feature",
      body: "Detailed description",
      diffSource: "staged" as const,
      statSummary: "1 file changed",
      statusSummary: "M file.ts",
      truncated: false,
    };

    const newState = reducer(initialState, { type: "COMMIT_GENERATED", result: commitResult });

    expect(newState.commitResult).toEqual(commitResult);
    expect(newState.screen).toBe("commit_ready");
  });

  test("should handle confirmation action", () => {
    const initialState: AriadneState = {
      screen: "confirming",
      intent: "test",
      command: "ls -l",
      error: null,
      activeSkill: "shell_command",
      skillDecision: null,
      commitResult: null,
    };

    const newState = reducer(initialState, { type: "CONFIRM" });

    expect(newState.screen).toBe("executing");
  });

  test("should handle execution failed action", () => {
    const initialState: AriadneState = {
      screen: "executing",
      intent: "test",
      command: "ls -l",
      error: null,
      activeSkill: "shell_command",
      skillDecision: null,
      commitResult: null,
    };

    const error = new Error("Command failed");
    const newState = reducer(initialState, { type: "EXECUTION_FAILED", error });

    expect(newState.error).toEqual(error);
    expect(newState.screen).toBe("error");
  });

  test("should handle generation failed action", () => {
    const initialState: AriadneState = {
      screen: "generating",
      intent: "test",
      command: "",
      error: null,
      activeSkill: "routing",
      skillDecision: null,
      commitResult: null,
    };

    const error = new Error("Generation failed");
    const newState = reducer(initialState, { type: "GENERATION_FAILED", error });

    expect(newState.error).toEqual(error);
    expect(newState.screen).toBe("error");
  });

  test("should handle cancel action", () => {
    const initialState: AriadneState = {
      screen: "confirming",
      intent: "test",
      command: "ls -l",
      error: null,
      activeSkill: "shell_command",
      skillDecision: null,
      commitResult: null,
    };

    const newState = reducer(initialState, { type: "CANCEL" });

    expect(newState.screen).toBe("cancelled");
  });

  test("should handle reset action", () => {
    const initialState: AriadneState = {
      screen: "confirming",
      intent: "test",
      command: "ls -l",
      error: new Error("test"),
      activeSkill: "shell_command",
      skillDecision: { skill: "shell_command", reason: "test", confidence: 0.8, via: "heuristic" },
      commitResult: null,
    };

    const newState = reducer(initialState, { type: "RESET" });

    expect(newState.screen).toBe("routing");
    expect(newState.command).toBe("");
    expect(newState.error).toBeNull();
    expect(newState.skillDecision).toBeNull();
  });
});

// Test spinner text logic
describe("getSpinnerText", () => {
  test("should return correct text for routing", () => {
    const state: AriadneState = {
      screen: "generating",
      intent: "test",
      command: "",
      error: null,
      activeSkill: "routing",
      skillDecision: null,
      commitResult: null,
    };

    expect(getSpinnerText(state)).toBe("Routing intent to the right skill...");
  });

  test("should return correct text for commit message", () => {
    const state: AriadneState = {
      screen: "generating",
      intent: "test",
      command: "",
      error: null,
      activeSkill: "commit_message",
      skillDecision: null,
      commitResult: null,
    };

    expect(getSpinnerText(state)).toBe("Preparing commit message (reading git diff)...");
  });

  test("should return correct text for shell command", () => {
    const state: AriadneState = {
      screen: "generating",
      intent: "test",
      command: "",
      error: null,
      activeSkill: "shell_command",
      skillDecision: null,
      commitResult: null,
    };

    expect(getSpinnerText(state)).toBe("Generating shell command...");
  });
});