import { cli } from "@/cli";

cli().catch((error) => {
  console.error(
    `Fatal error: ${error instanceof Error ? error.message : String(error)}`
  );
  process.exit(1);
});
