import React from "react";
import { Box, Text } from "ink";
import type { IntentDisplayProps } from "./types";

const IntentDisplay: React.FC<IntentDisplayProps> = ({ intent }) => {
  return (
    <Box marginBottom={1}>
      <Text>
        <Text color="gray">🔍 Processing: </Text>
        <Text color="white">"{intent}"</Text>
      </Text>
    </Box>
  );
};

export default IntentDisplay;
