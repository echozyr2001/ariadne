import React from "react";
import { Box, Text } from "ink";
import type { CommandDisplayProps } from "./types.js";

const CommandDisplay: React.FC<CommandDisplayProps> = ({ command }) => {
  return (
    <Box marginY={1} paddingX={2} borderStyle="round" borderColor="cyan">
      <Text>
        <Text color="gray">💡 Suggested command:</Text>
        {"\n"}
        <Text color="cyan" bold>
          {command}
        </Text>
      </Text>
    </Box>
  );
};

export default CommandDisplay;
