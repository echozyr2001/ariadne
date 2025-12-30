import React from "react";
import { Box, Text } from "ink";
import type { HeaderProps } from "./types";

const Header: React.FC<HeaderProps> = ({ version = "0.1.0" }) => {
  return (
    <Box marginBottom={1}>
      <Text bold color="cyan">
        Ariadne
      </Text>
      {version && <Text dimColor> v{version}</Text>}
    </Box>
  );
};

export default Header;
