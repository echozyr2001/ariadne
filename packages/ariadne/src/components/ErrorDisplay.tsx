import React from "react";
import { Box, Text } from "ink";
import type { ErrorDisplayProps } from "./types";

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  type = "general",
}) => {
  const getMessage = () => {
    // Handle API key missing error
    if (
      error.message.includes("ANTHROPIC_API_KEY") ||
      error.message.includes("API key")
    ) {
      return (
        <Text>
          <Text color="red" bold>
            ❌ API Key Missing
          </Text>
          {"\n"}
          <Text>Please set your ANTHROPIC_API_KEY environment variable:</Text>
          {"\n"}
          <Text color="cyan">export ANTHROPIC_API_KEY='your-key-here'</Text>
        </Text>
      );
    }

    // Handle network errors
    if (
      error.message.includes("ECONNREFUSED") ||
      error.message.includes("ETIMEDOUT") ||
      error.message.includes("ENOTFOUND") ||
      error.message.includes("network") ||
      error.message.includes("fetch failed")
    ) {
      return (
        <Text>
          <Text color="red" bold>
            ❌ Network Error
          </Text>
          {"\n"}
          <Text>Unable to connect to the API service.</Text>
          {"\n"}
          <Text color="gray">Troubleshooting hints:</Text>
          {"\n"}
          <Text>• Check your internet connection</Text>
          {"\n"}
          <Text>• Verify the API service is available</Text>
          {"\n"}
          <Text>• Check for firewall or proxy issues</Text>
        </Text>
      );
    }

    // Handle execution errors with exit codes
    if (
      type === "execution" ||
      error.message.includes("exit code") ||
      error.message.includes("Command failed")
    ) {
      const exitCodeMatch = error.message.match(/exit code (\d+)/);
      const exitCode = exitCodeMatch ? exitCodeMatch[1] : "unknown";

      return (
        <Text>
          <Text color="red" bold>
            ❌ Command Execution Failed
          </Text>
          {"\n"}
          <Text>The command exited with code: {exitCode}</Text>
          {"\n"}
          <Text color="gray">{error.message}</Text>
        </Text>
      );
    }

    // Generic error handling - avoid exposing sensitive information
    return (
      <Text>
        <Text color="red" bold>
          ❌ Error
        </Text>
        {"\n"}
        <Text>{error.message}</Text>
      </Text>
    );
  };

  return (
    <Box marginY={1} paddingX={2} borderStyle="round" borderColor="red">
      {getMessage()}
    </Box>
  );
};

export default ErrorDisplay;
