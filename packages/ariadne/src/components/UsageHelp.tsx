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
      </Box>

      <Box marginY={1}>
        <Text bold>Options:</Text>
      </Box>
      <Box flexDirection="column" marginLeft={2}>
        <Text>
          <Text color="cyan">--help, -h</Text>
          <Text> Show this help message</Text>
        </Text>
      </Box>
    </Box>
  );
};

export default UsageHelp;
