import React from "react";
import { Box, Text } from "ink";
import Header from "./Header.js";

const UsageHelp: React.FC = () => {
  return (
    <Box flexDirection="column">
      <Header />

      <Box marginY={1}>
        <Text bold>Usage:</Text>
      </Box>
      <Box marginLeft={2} marginBottom={1}>
        <Text color="cyan">ari</Text>
        <Text> "</Text>
        <Text color="gray">your intent in natural language</Text>
        <Text>"</Text>
      </Box>

      <Box marginY={1}>
        <Text bold>Examples:</Text>
      </Box>
      <Box flexDirection="column" marginLeft={2} marginBottom={1}>
        <Text>
          <Text color="cyan">ari</Text>
          <Text> "list all files with details"</Text>
        </Text>
        <Text>
          <Text color="cyan">ari</Text>
          <Text> "check which process is using port 8080"</Text>
        </Text>
        <Text>
          <Text color="cyan">ari</Text>
          <Text> "find all python files"</Text>
        </Text>
        <Text>
          <Text color="cyan">ari</Text>
          <Text> "write a commit message for the current changes"</Text>
        </Text>
      </Box>

      <Box marginY={1}>
        <Text bold>Skills:</Text>
      </Box>
      <Box flexDirection="column" marginLeft={2} marginBottom={1}>
        <Text color="green">shell_command</Text>
        <Text color="gray">
          Converts natural language into a single safe Unix command.
        </Text>
        <Text> </Text>
        <Text color="green">commit_message</Text>
        <Text color="gray">
          Reads your latest git diff and suggests a conventional commit message.
        </Text>
        <Text> </Text>
        <Text color="green">code_review</Text>
        <Text color="gray">
          Reviews your code changes and provides feedback, issues, and suggestions.
        </Text>
      </Box>

      <Box marginY={1}>
        <Text bold>Options:</Text>
      </Box>
      <Box flexDirection="column" marginLeft={2} marginBottom={1}>
        <Text>
          <Text color="cyan">--help, -h</Text>
          <Text> Show this help message</Text>
        </Text>
      </Box>
      <Text>{""}</Text>
    </Box>
  );
};

export default UsageHelp;
