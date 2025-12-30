import React from "react";
import { Box, Text, useInput } from "ink";
import type { ConfirmPromptProps } from "./types";

const ConfirmPrompt: React.FC<ConfirmPromptProps> = ({
  onConfirm,
  onCancel,
}) => {
  useInput((input, key) => {
    // Handle 'y' or 'Y' for confirmation
    if (input.toLowerCase() === "y") {
      onConfirm();
    }
    // Handle 'n', 'N', Enter, or Escape for cancellation
    else if (input.toLowerCase() === "n" || key.return || key.escape) {
      onCancel();
    }
    // Handle Ctrl+C
    else if (key.ctrl && input === "c") {
      onCancel();
    }
  });

  return (
    <Box>
      <Text>
        <Text color="yellow">❯ </Text>
        <Text>Execute this command? </Text>
        <Text color="gray">[y/</Text>
        <Text color="white" bold>
          N
        </Text>
        <Text color="gray">]</Text>
      </Text>
    </Box>
  );
};

export default ConfirmPrompt;
