import React from "react";
import { Box } from "ink";
import { Spinner } from "@inkjs/ui";
import type { LoadingSpinnerProps } from "./types";

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  text = "Generating command...",
}) => {
  return (
    <Box>
      <Spinner label={text} />
    </Box>
  );
};

export default LoadingSpinner;
