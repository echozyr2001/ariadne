function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export function isModelAccessError(error: unknown): boolean {
  const message = getErrorMessage(error);

  return (
    /not allowed/i.test(message) ||
    /forbidden/i.test(message) ||
    /permission denied/i.test(message) ||
    /access denied/i.test(message) ||
    /does not have access/i.test(message) ||
    /model.*not found/i.test(message) ||
    /not found.*model/i.test(message) ||
    /invalid model/i.test(message) ||
    /model.*does not exist/i.test(message) ||
    /未找到项目配置/.test(message)
  );
}

export function isBudgetLimitError(error: unknown): boolean {
  const message = getErrorMessage(error);

  return (
    /budget limit exceeded/i.test(message) || /quota exceeded/i.test(message)
  );
}
