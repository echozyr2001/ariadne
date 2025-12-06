import { generateCommand } from "./ai";
import { execCommand } from "./exec";

function showUsage() {
  console.log("");
  console.log("Ariadne - Your terminal command guide");
  console.log("");
  console.log('Usage: ari "<your intent in natural language>"');
  console.log("");
  console.log("Examples:");
  console.log('  ari "list all files with details"');
  console.log('  ari "check which process is using port 8080"');
  console.log('  ari "find all python files"');
  console.log('  ari "show disk usage"');
  console.log("");
}

function restoreStdin(stdin: NodeJS.ReadStream) {
  try {
    stdin.setRawMode(false);
    stdin.pause();
  } catch {
    // Ignore errors when restoring stdin
  }
}

export async function cli() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    showUsage();
    process.exit(1);
  }

  if (args[0] === "--help" || args[0] === "-h") {
    showUsage();
    process.exit(0);
  }

  const userIntent = args.join(" ");
  const stdin = process.stdin;
  let stdinRestored = false;

  try {
    console.log(`🔍 Processing: "${userIntent}"`);
    const command = await generateCommand(userIntent);

    console.log(`\n💡 Suggested command: \x1b[36m${command}\x1b[0m`);
    process.stdout.write(`\n> Execute this command? [y/N] `);

    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding("utf8");

    return new Promise<void>((resolve, reject) => {
      const cleanup = () => {
        if (!stdinRestored) {
          restoreStdin(stdin);
          stdinRestored = true;
        }
      };

      const handler = async (key: string) => {
        try {
          if (key === "\u0003") {
            cleanup();
            stdin.removeListener("data", handler);
            console.log("\n\n❌ Cancelled.");
            process.exit(0);
            return;
          }

          if (key === "\r" || key === "\n") {
            cleanup();
            stdin.removeListener("data", handler);
            console.log("\n❌ Cancelled.");
            process.exit(0);
            return;
          }

          const lowerKey = key.toLowerCase();
          if (lowerKey === "y") {
            cleanup();
            stdin.removeListener("data", handler);
            console.log(`\n⚡ Executing: \x1b[36m${command}\x1b[0m`);
            console.log("");
            try {
              await execCommand(command);
              console.log("");
              console.log("✅ Command executed successfully.");
              resolve();
            } catch (error) {
              console.log("");
              console.error(
                `❌ Error executing command: ${
                  error instanceof Error ? error.message : String(error)
                }`
              );
              reject(error);
            }
          } else if (lowerKey === "n" || lowerKey === "\u001b") {
            cleanup();
            stdin.removeListener("data", handler);
            console.log("\n❌ Cancelled.");
            process.exit(0);
          }
        } catch (error) {
          cleanup();
          stdin.removeListener("data", handler);
          reject(error);
        }
      };

      stdin.on("data", handler);
    });
  } catch (error) {
    // Ensure stdin is restored even if generateCommand fails
    if (!stdinRestored) {
      restoreStdin(stdin);
    }
    console.error(
      `\n❌ Error: ${error instanceof Error ? error.message : String(error)}`
    );
    process.exit(1);
  }
}
