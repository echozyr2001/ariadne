import React from "react";
import { Box, Text } from "ink";
import type { CodeReviewDisplayProps } from "@/components";

const CodeReviewDisplay: React.FC<CodeReviewDisplayProps> = ({ result }) => {
  const getSeverityColor = (
    severity: "critical" | "warning" | "suggestion"
  ) => {
    switch (severity) {
      case "critical":
        return "red";
      case "warning":
        return "yellow";
      case "suggestion":
        return "cyan";
      default:
        return "gray";
    }
  };

  const getSeverityLabel = (
    severity: "critical" | "warning" | "suggestion"
  ) => {
    switch (severity) {
      case "critical":
        return "CRITICAL";
      case "warning":
        return "WARNING";
      case "suggestion":
        return "SUGGESTION";
      default:
        return "UNKNOWN";
    }
  };

  return (
    <Box flexDirection="column" marginY={1}>
      <Text color="green" bold>
        Code Review Results
      </Text>

      {/* Summary */}
      <Box
        flexDirection="column"
        borderStyle="round"
        borderColor="green"
        paddingX={1}
        paddingY={1}
        marginTop={1}
      >
        <Text bold color="green">
          Summary
        </Text>
        <Box marginTop={1}>
          <Text>{result.summary}</Text>
        </Box>
      </Box>

      {/* Issues */}
      {result.issues.length > 0 && (
        <Box flexDirection="column" marginTop={1}>
          <Text bold color="yellow">
            Issues Found ({result.issues.length})
          </Text>
          {result.issues.map((issue, index) => (
            <Box
              key={index}
              flexDirection="column"
              borderStyle="round"
              borderColor={getSeverityColor(issue.severity)}
              paddingX={1}
              paddingY={1}
              marginTop={1}
            >
              <Box flexDirection="row" gap={1}>
                <Text color={getSeverityColor(issue.severity)} bold>
                  [{getSeverityLabel(issue.severity)}]
                </Text>
                <Text color="gray">{issue.category}</Text>
                {issue.location && (
                  <Text color="gray" dimColor>
                    @ {issue.location}
                  </Text>
                )}
              </Box>
              <Box marginTop={1}>
                <Text>{issue.description}</Text>
              </Box>
            </Box>
          ))}
        </Box>
      )}

      {/* Positives */}
      {result.positives.length > 0 && (
        <Box flexDirection="column" marginTop={1}>
          <Text bold color="green">
            Positives ({result.positives.length})
          </Text>
          {result.positives.map((positive, index) => (
            <Box
              key={index}
              flexDirection="row"
              marginTop={1}
              marginLeft={2}
              gap={1}
            >
              <Text color="green">✓</Text>
              <Text>{positive}</Text>
            </Box>
          ))}
        </Box>
      )}

      {/* Suggestions */}
      {result.suggestions.length > 0 && (
        <Box flexDirection="column" marginTop={1}>
          <Text bold color="cyan">
            Suggestions ({result.suggestions.length})
          </Text>
          {result.suggestions.map((suggestion, index) => (
            <Box
              key={index}
              flexDirection="row"
              marginTop={1}
              marginLeft={2}
              gap={1}
            >
              <Text color="cyan">•</Text>
              <Text>{suggestion}</Text>
            </Box>
          ))}
        </Box>
      )}

      {/* Metadata */}
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
            Diff truncated to protect token budget—review may be incomplete.
          </Text>
        )}
      </Box>
    </Box>
  );
};

export default CodeReviewDisplay;
