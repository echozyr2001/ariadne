import React from "react";
import { render, Box, Text } from "ink";
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

// Demo section wrapper component
const DemoSection: React.FC<{ title: string; children: React.ReactNode }> = ({
  title,
  children,
}) => (
  <Box flexDirection="column" marginBottom={2}>
    <Box marginBottom={1}>
      <Text bold color="yellow">
        {"═".repeat(50)}
      </Text>
    </Box>
    <Box marginBottom={1}>
      <Text bold color="cyan">
        📦 {title}
      </Text>
    </Box>
    <Box paddingLeft={2}>{children}</Box>
  </Box>
);

// Main demo component
const ComponentsVisualDemo: React.FC = () => {
  return (
    <Box flexDirection="column" padding={1}>
      {/* Title */}
      <Box marginBottom={2}>
        <Text bold color="magenta">
          🎨 Ariadne UI Components Visual Demo
        </Text>
      </Box>
      <Box marginBottom={2}>
        <Text dimColor>
          Showcasing all implemented components for the Ink-based TUI
        </Text>
      </Box>

      {/* 1. Header Component */}
      <DemoSection title="Header Component">
        <Box flexDirection="column">
          <Text dimColor>With default version (0.1.0):</Text>
          <Header />
          <Box marginTop={1}>
            <Text dimColor>With custom version (1.2.3):</Text>
          </Box>
          <Header version="1.2.3" />
        </Box>
      </DemoSection>

      {/* 2. IntentDisplay Component */}
      <DemoSection title="IntentDisplay Component">
        <Box flexDirection="column">
          <Text dimColor>Displays user's natural language intent:</Text>
          <IntentDisplay intent="list all files with details" />
          <Box marginTop={1}>
            <IntentDisplay intent="find all Python files modified in the last 7 days" />
          </Box>
        </Box>
      </DemoSection>

      {/* 3. LoadingSpinner Component */}
      <DemoSection title="LoadingSpinner Component">
        <Box flexDirection="column">
          <Text dimColor>Default loading text:</Text>
          <LoadingSpinner />
          <Box marginTop={1}>
            <Text dimColor>Custom loading text:</Text>
          </Box>
          <LoadingSpinner text="Analyzing your request..." />
        </Box>
      </DemoSection>

      {/* 4. CommandDisplay Component */}
      <DemoSection title="CommandDisplay Component">
        <Box flexDirection="column">
          <Text dimColor>Shows the generated command:</Text>
          <CommandDisplay command="ls -la" />
          <Box marginTop={1}>
            <CommandDisplay command="find . -name '*.py' -mtime -7" />
          </Box>
        </Box>
      </DemoSection>

      {/* 5. ConfirmPrompt Component */}
      <DemoSection title="ConfirmPrompt Component">
        <Box flexDirection="column">
          <Text dimColor>Interactive confirmation prompt:</Text>
          <ConfirmPrompt
            onConfirm={() => console.log("✓ User confirmed")}
            onCancel={() => console.log("✗ User cancelled")}
          />
          <Box marginTop={1}>
            <Text dimColor color="gray">
              (Press 'y' to confirm, 'n'/Enter/Esc to cancel)
            </Text>
          </Box>
        </Box>
      </DemoSection>

      {/* 6. ExecutionStatus Component */}
      <DemoSection title="ExecutionStatus Component">
        <Box flexDirection="column">
          <Text dimColor>Shows command execution in progress:</Text>
          <ExecutionStatus command="ls -la" />
          <Box marginTop={1}>
            <ExecutionStatus command="npm install" />
          </Box>
        </Box>
      </DemoSection>

      {/* 7. ErrorDisplay Component */}
      <DemoSection title="ErrorDisplay Component">
        <Box flexDirection="column">
          <Text dimColor>API Key Missing Error:</Text>
          <ErrorDisplay
            error={new Error("ANTHROPIC_API_KEY not found")}
            type="general"
          />
          <Box marginTop={1}>
            <Text dimColor>Network Error:</Text>
          </Box>
          <ErrorDisplay
            error={new Error("ECONNREFUSED: Connection refused")}
            type="general"
          />
          <Box marginTop={1}>
            <Text dimColor>Execution Error:</Text>
          </Box>
          <ErrorDisplay
            error={new Error("Command failed with exit code 1")}
            type="execution"
          />
          <Box marginTop={1}>
            <Text dimColor>Generic Error:</Text>
          </Box>
          <ErrorDisplay
            error={new Error("Something unexpected happened")}
            type="general"
          />
        </Box>
      </DemoSection>

      {/* 8. UsageHelp Component */}
      <DemoSection title="UsageHelp Component">
        <Box flexDirection="column">
          <Text dimColor>Complete usage information:</Text>
          <UsageHelp />
        </Box>
      </DemoSection>

      {/* Footer */}
      <Box marginTop={2} paddingTop={1} borderStyle="single" borderColor="gray">
        <Text dimColor>💡 Press Ctrl+C to exit | Ariadne Component Demo</Text>
      </Box>
    </Box>
  );
};

// Render the demo
console.log("\n");
const { waitUntilExit } = render(<ComponentsVisualDemo />);

// Keep the demo running until user exits
await waitUntilExit();
console.log("\n✨ Demo completed!\n");
