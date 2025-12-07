import React, { useState, useEffect } from "react";
import { Box, Text, useApp } from "ink";
import { generateCommand } from "@/ai";
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
} from "@/components";
import type { AppProps, AppState } from "@/components";

const App: React.FC<AppProps> = ({ args }) => {
  const [state, setState] = useState<AppState>("help");
  const [intent, setIntent] = useState<string>("");
  const [command, setCommand] = useState<string>("");
  const [error, setError] = useState<Error | null>(null);
  const { exit } = useApp();

  // Parse arguments and determine initial state
  useEffect(() => {
    // Check for help flags or empty args
    if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
      setState("help");
      // Exit after showing help
      setTimeout(() => {
        exit();
      }, 100);
      return;
    }

    // Extract user intent from args
    const userIntent = args.join(" ");
    setIntent(userIntent);
    setState("generating");
  }, [args, exit]);

  // Handle command generation
  useEffect(() => {
    if (state !== "generating") return;

    const generate = async () => {
      try {
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

  // Handle confirmation
  const handleConfirm = async () => {
    setState("executing");

    try {
      await execCommand(command);
      setState("success");
      // Exit after successful execution
      setTimeout(() => {
        exit();
      }, 100);
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

  // Render based on state
  return (
    <Box flexDirection="column">
      {state === "help" && <UsageHelp />}

      {state !== "help" && (
        <>
          <Header />
          <IntentDisplay intent={intent} />
        </>
      )}

      {state === "generating" && <LoadingSpinner />}

      {state === "confirming" && (
        <>
          <CommandDisplay command={command} />
          <ConfirmPrompt onConfirm={handleConfirm} onCancel={handleCancel} />
        </>
      )}

      {state === "executing" && <ExecutionStatus command={command} />}

      {state === "error" && error && <ErrorDisplay error={error} />}

      {state === "cancelled" && (
        <Box marginY={1}>
          <Text color="gray">Operation cancelled.</Text>
        </Box>
      )}
    </Box>
  );
};

export default App;
