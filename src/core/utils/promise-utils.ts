/**
 * Executes multiple promises in parallel and waits for all to complete.
 * If any promise fails, throws the error AFTER all promises have settled.
 * This prevents race conditions in transactional contexts where operations
 * might complete after a rollback has been initiated.
 *
 * @param promises Array of promises to execute
 * @throws The first rejection reason encountered
 */
export async function executeAllOrFail<T>(
  promises: Promise<T>[],
): Promise<void> {
  const results = await Promise.allSettled(promises);

  const rejectedResult = results.find((r) => r.status === 'rejected');
  if (rejectedResult && rejectedResult.status === 'rejected') {
    throw rejectedResult.reason;
  }
}
