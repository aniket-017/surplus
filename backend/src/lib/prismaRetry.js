const TRANSIENT_CODES = new Set(["P2034", "P2010"]);

function isTransientPrismaError(error) {
  if (!error || typeof error !== "object") return false;
  if (TRANSIENT_CODES.has(error.code)) return true;

  const message = String(error.message || "");
  return (
    message.includes("TransientTransactionError") ||
    message.includes("write conflict") ||
    message.includes("Please retry your transaction")
  );
}

/**
 * Retries Prisma ops that hit MongoDB transient write conflicts / dropped connections.
 */
export async function withPrismaRetry(operation, { retries = 3, baseDelayMs = 50 } = {}) {
  let lastError;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (!isTransientPrismaError(error) || attempt === retries) {
        throw error;
      }
      const delay = baseDelayMs * 2 ** attempt;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}
