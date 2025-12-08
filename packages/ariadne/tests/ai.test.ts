import { expect, test } from "bun:test";
import { generateCommand } from "@/ai";

test("generate a simple command", async () => {
  const command = await generateCommand(`Say "Hello, World!" in the terminal`);
  expect(command).toBe(`echo 'Hello, World!'`);
});

test("generate a file listing command", async () => {
  const command = await generateCommand(`List all files with details`);
  expect(command).toBe(`ls -l`);
});

test("generate a disk usage command", async () => {
  const command = await generateCommand(`Show disk usage`);
  expect(command).toBe(`df -h`);
});

test("generate a search command", async () => {
  const command = await generateCommand(`Search for text "error" in files`);
  expect(command).toBe(`grep -r 'error' .`);
});

test("generate a glob search command", async () => {
  const command = await generateCommand(
    `Find all TypeScript files in the current directory`
  );
  expect(command).toBe(`find . -name '*.ts'`);
});
