import React from "react";
import { Box, Text } from "ink";
import type { CommitMessageDisplayProps } from "@/components";

const CommitMessageDisplay: React.FC<CommitMessageDisplayProps> = ({
  result,
}) => {
  const bodyLines = result.body
    ? result.body.split("\n").filter((line) => line.trim().length > 0)
    : [];

  return (
    <Box flexDirection="column" marginY={1}>
      <Text color="green">Suggested commit message</Text>

      <Box
        flexDirection="column"
        borderStyle="round"
        borderColor="green"
        paddingX={1}
        paddingY={1}
        marginTop={1}
      >
        <Text>{result.subject}</Text>
        {bodyLines.length > 0 && (
          <Box flexDirection="column" marginTop={1}>
            {bodyLines.map((line, index) => (
              <Text key={`${line}-${index}`}>{line}</Text>
            ))}
          </Box>
        )}
      </Box>

      <Box flexDirection="column" marginTop={1}>
        <Text color="gray">
          Source:{" "}
          {result.diffSource === "staged"
            ? "staged changes"
            : "working tree changes"}
        </Text>
        <Text color="gray">Git status: {result.statusSummary}</Text>
        <Text color="gray">Diff stats: {result.statSummary}</Text>
        {result.truncated && (
          <Text color="yellow">
            Diff truncated to protect token budget—focus on high-level summary.
          </Text>
        )}
      </Box>
    </Box>
  );
};

export default CommitMessageDisplay;
