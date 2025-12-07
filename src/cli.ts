import React from "react";
import { render } from "ink";
import App from "./components/App";

export async function cli() {
  const args = process.argv.slice(2);

  const { waitUntilExit } = render(React.createElement(App, { args }));

  await waitUntilExit();
}
