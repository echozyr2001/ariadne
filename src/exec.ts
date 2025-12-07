import { $ } from "bun";

export async function execCommand(cmd: string): Promise<void> {
  const trimmed = cmd.trim();

  if (!trimmed) {
    throw new Error("No command provided to execute.");
  }

  try {
    const shell = process.platform === "win32" ? "cmd.exe" : "/bin/sh";
    const shellFlag = process.platform === "win32" ? "/c" : "-c";

    await $`${shell} ${shellFlag} ${trimmed}`;
  } catch (error) {
    if (error instanceof $.ShellError) {
      const exitCode = error.exitCode ?? "unknown";
      throw new Error(`Command failed with exit code ${exitCode}: ${trimmed}`);
    }
    if (error instanceof Error) {
      throw new Error(
        `Failed to execute command "${trimmed}": ${error.message}`
      );
    }
    throw new Error(`Failed to execute command: ${trimmed}`);
  }
}
