import React from "react";
import { Box, Text } from "ink";
import { Spinner } from "@inkjs/ui";
import type { ExecutionStatusProps } from "./types";

const ExecutionStatus: React.FC<ExecutionStatusProps> = ({ command }) => {
  return (
    <Box flexDirection="column" marginY={1}>
      <Text>
        <Text color="green">⚡ Executing: </Text>
        <Text color="cyan">{command}</Text>
      </Text>
      <Box marginTop={1}>
        <Spinner label="Running..." />
      </Box>
    </Box>
  );
};

export default ExecutionStatus;
