import type { CleanupResult } from "./types.js";

export const errorFrom = (error: unknown): Error =>
  error instanceof Error ? error : new Error(String(error));

export async function bounded<T>(operation: Promise<T>, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} exceeded 5 seconds`)), 5_000);
  });
  try {
    return await Promise.race([operation, timeout]);
  } finally {
    clearTimeout(timer!);
  }
}

export async function collectError(
  result: CleanupResult,
  operation: () => Promise<unknown>,
): Promise<void> {
  try {
    await operation();
  } catch (error) {
    result.ok = false;
    result.errors.push(errorFrom(error));
  }
}
