import { expect, test } from "bun:test";
import { execCommand } from "@/exec";

test("execCommand runs a simple command", async () => {
  await expect(execCommand("echo 'Hello, World!'")).resolves.toBeUndefined();
});

test("execCommand throws on empty command", async () => {
  await expect(execCommand("   ")).rejects.toThrow(
    "No command provided to execute."
  );
});

test("execCommand runs a listing command", async () => {
  await expect(execCommand("ls -l")).resolves.toBeUndefined();
});

test("execCommand throws on command failure", async () => {
  await expect(execCommand("nonexistentcommand")).rejects.toThrow(
    "Command failed with exit code"
  );
});
