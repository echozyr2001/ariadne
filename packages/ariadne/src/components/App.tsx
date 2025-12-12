import React, { useState, useEffect } from "react";
import { Box, Text, useApp } from "ink";
import { generateCommand } from "@/ai";
import { generateCommitMessage } from "@/commit";
import { execCommand } from "@/exec";
import {
  Header,
  IntentDisplay,
  LoadingSpinner,
  CommandDisplay,
  ConfirmPrompt,
  ExecutionStatus,
  ErrorDisplay,
  UsageHelp,
  CommitMessageDisplay,
} from "@/components";
import type { AppProps, AppState } from "@/components";
import type { CommitMessageResult } from "@/commit";
import { determineSkill } from "@/skills";
import type { SkillDecision, SkillName } from "@/skills";

const App: React.FC<AppProps> = ({ args }) => {
  // Determine initial state based on args
  const shouldShowHelp =
    args.length === 0 || args.includes("--help") || args.includes("-h");
  const initialIntent = shouldShowHelp ? "" : args.join(" ");

  const [state, setState] = useState<AppState>(
    shouldShowHelp ? "help" : "generating"
  );
  const [intent, setIntent] = useState<string>(initialIntent);
  const [command, setCommand] = useState<string>("");
  const [error, setError] = useState<Error | null>(null);
  const [activeSkill, setActiveSkill] =
    useState<SkillName | "routing">("routing");
  const [skillDecision, setSkillDecision] = useState<SkillDecision | null>(null);
  const [commitResult, setCommitResult] =
    useState<CommitMessageResult | null>(null);
  const { exit } = useApp();

  // Handle help state exit
  useEffect(() => {
    if (state === "help") {
      setTimeout(() => {
        exit();
      }, 100);
    }
  }, [state, exit]);

  // Handle command generation or commit message flow
  useEffect(() => {
    if (state !== "generating") return;

    setActiveSkill("routing");
    setSkillDecision(null);
    setCommitResult(null);

    const generate = async () => {
      try {
        const decision = await determineSkill(intent, {
          useRouterModel: true,
        });
        setSkillDecision(decision);

        if (decision.skill === "commit_message") {
          setActiveSkill("commit_message");
          const result = await generateCommitMessage(intent);
          setCommitResult(result);
          setState("commit_ready");
          return;
        }

        setActiveSkill("shell_command");
        const generatedCommand = await generateCommand(intent);
        setCommand(generatedCommand);
        setState("confirming");
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Unknown error"));
        setState("error");
        // Exit after showing error
        setTimeout(() => {
          exit();
        }, 100);
      }
    };

    generate();
  }, [state, intent, exit]);

  // Exit shortly after showing a commit message
  useEffect(() => {
    if (state !== "commit_ready") {
      return;
    }
    const timer = setTimeout(() => {
      exit();
    }, 250);
    return () => clearTimeout(timer);
  }, [state, exit]);

  // Handle confirmation
  const handleConfirm = async () => {
    if (activeSkill !== "shell_command") {
      return;
    }
    setState("executing");

    try {
      await execCommand(command);
      setState("success");
      // Exit immediately after successful execution
      // The command output is already in the terminal
      exit();
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Execution failed"));
      setState("error");
      // Exit after showing error
      setTimeout(() => {
        exit();
      }, 100);
    }
  };

  // Handle cancellation
  const handleCancel = () => {
    setState("cancelled");
    // Exit gracefully on cancellation
    setTimeout(() => {
      exit();
    }, 100);
  };

  const spinnerText =
    activeSkill === "routing"
      ? "Routing intent to the right skill..."
      : activeSkill === "commit_message"
        ? "Preparing commit message (reading git diff)..."
        : "Generating shell command...";

  // Render based on state
  return (
    <Box flexDirection="column">
      {state === "help" && <UsageHelp />}

      {state !== "help" && (
        <>
          <Header />
          <IntentDisplay intent={intent} />
          {skillDecision && (
            <Box marginBottom={1}>
              <Text color="gray">
                Skill: {skillDecision.skill} ({skillDecision.via}) ·{" "}
                {skillDecision.reason}
              </Text>
            </Box>
          )}
        </>
      )}

      {state === "generating" && <LoadingSpinner text={spinnerText} />}

      {state === "confirming" && (
        <>
          <CommandDisplay command={command} />
          <ConfirmPrompt onConfirm={handleConfirm} onCancel={handleCancel} />
        </>
      )}

      {state === "executing" && <ExecutionStatus command={command} />}

      {state === "error" && error && <ErrorDisplay error={error} />}

      {state === "commit_ready" && commitResult && (
        <CommitMessageDisplay result={commitResult} />
      )}

      {state === "cancelled" && (
        <Box marginY={1}>
          <Text color="gray">Operation cancelled.</Text>
        </Box>
      )}
    </Box>
  );
};

export default App;
