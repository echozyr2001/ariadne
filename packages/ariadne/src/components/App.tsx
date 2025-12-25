import React, { useEffect } from "react";
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
import type { AppProps } from "@/components";
import { determineSkill } from "@/skills";
import { useAriadneState } from "@/hooks/useAriadneState";

const App: React.FC<AppProps> = ({ args }) => {
  const { exit } = useApp();
  const {
    state,
    startRouting,
    skillDecided,
    commandGenerated,
    commitGenerated,
    confirm,
    executionFailed,
    generationFailed,
    cancel,
    spinnerText,
  } = useAriadneState(args);

  // Handle help screen exit
  useEffect(() => {
    if (state.screen === "help") {
      const timer = setTimeout(() => exit(), 100);
      return () => clearTimeout(timer);
    }
  }, [state.screen, exit]);

  // Handle commit ready screen exit
  useEffect(() => {
    if (state.screen === "commit_ready") {
      const timer = setTimeout(() => exit(), 250);
      return () => clearTimeout(timer);
    }
  }, [state.screen, exit]);

  // Handle error screen exit
  useEffect(() => {
    if (state.screen === "error") {
      const timer = setTimeout(() => exit(), 100);
      return () => clearTimeout(timer);
    }
  }, [state.screen, exit]);

  // Handle cancelled screen exit
  useEffect(() => {
    if (state.screen === "cancelled") {
      const timer = setTimeout(() => exit(), 100);
      return () => clearTimeout(timer);
    }
  }, [state.screen, exit]);

  // Handle skill routing and generation flow
  useEffect(() => {
    if (state.screen !== "routing") return;

    const generate = async () => {
      startRouting();

      try {
        const decision = await determineSkill(state.intent, {
          useRouterModel: true,
        });
        skillDecided(decision);

        if (decision.skill === "commit_message") {
          const result = await generateCommitMessage(state.intent);
          commitGenerated(result);
          return;
        }

        const generatedCommand = await generateCommand(state.intent);
        commandGenerated(generatedCommand);
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Unknown error");
        generationFailed(error);
      }
    };

    generate();
  }, [state.screen, state.intent]);

  // Note: Command execution is handled in handleConfirm when user confirms

  // User interaction handlers
  const handleConfirm = async () => {
    if (state.activeSkill !== "shell_command") return;

    confirm();

    try {
      await execCommand(state.command);
      exit(); // Exit immediately after successful execution
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Execution failed");
      executionFailed(error);
    }
  };

  const handleCancel = () => {
    cancel();
  };

  // Render based on screen
  return (
    <Box flexDirection="column">
      {state.screen === "help" && <UsageHelp />}

      {state.screen !== "help" && (
        <>
          <Header />
          <IntentDisplay intent={state.intent} />
          {state.skillDecision && (
            <Box marginBottom={1}>
              <Text color="gray">
                Skill: {state.skillDecision.skill} ({state.skillDecision.via}) ·{" "}
                {state.skillDecision.reason}
              </Text>
            </Box>
          )}
        </>
      )}

      {(state.screen === "routing" || state.screen === "generating") && (
        <LoadingSpinner text={spinnerText} />
      )}

      {state.screen === "confirming" && (
        <>
          <CommandDisplay command={state.command} />
          <ConfirmPrompt onConfirm={handleConfirm} onCancel={handleCancel} />
        </>
      )}

      {state.screen === "executing" && (
        <ExecutionStatus command={state.command} />
      )}

      {state.screen === "error" && state.error && (
        <ErrorDisplay error={state.error} />
      )}

      {state.screen === "commit_ready" && state.commitResult && (
        <CommitMessageDisplay result={state.commitResult} />
      )}

      {state.screen === "cancelled" && (
        <Box marginY={1}>
          <Text color="gray">Operation cancelled.</Text>
        </Box>
      )}
    </Box>
  );
};

export default App;
