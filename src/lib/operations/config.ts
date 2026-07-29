import "server-only";

function integer(name: string, fallback: number, minimum = 1, maximum = 100_000) {
  const raw = process.env[name]?.trim();
  if (!raw) return fallback;
  const value = Number(raw);
  if (!Number.isSafeInteger(value) || value < minimum || value > maximum) {
    throw new Error(`[Crealy] ${name} tiene un valor inválido.`);
  }
  return value;
}

function optionalMoney(name: string) {
  const raw = process.env[name]?.trim();
  if (!raw) return null;
  const value = Number(raw);
  if (!Number.isFinite(value) || value <= 0 || value > 1_000_000) {
    throw new Error(`[Crealy] ${name} debe ser un monto positivo.`);
  }
  return value;
}

function estimatedCost(name: string) {
  const raw = process.env[name]?.trim();
  if (!raw) return null;
  const value = Number(raw);
  if (!Number.isFinite(value) || value < 0 || value > 10_000) {
    throw new Error(`[Crealy] ${name} debe ser un monto no negativo.`);
  }
  return value;
}

function enabled(name: string, fallback: boolean) {
  const raw = process.env[name]?.trim().toLowerCase();
  if (!raw) return fallback;
  if (raw === "true") return true;
  if (raw === "false") return false;
  throw new Error(`[Crealy] ${name} debe ser true o false.`);
}

export function getOperationsConfig() {
  return {
    queueProvider: "database" as const,
    workerEnabled: enabled("JOBS_WORKER_ENABLED", true),
    globalConcurrency: integer("JOBS_GLOBAL_CONCURRENCY", 3, 1, 20),
    userConcurrency: integer("JOBS_USER_CONCURRENCY", 1, 1, 5),
    visibilitySeconds: integer("JOBS_VISIBILITY_TIMEOUT_SECONDS", 300, 60, 3600),
    maxAttempts: integer("JOBS_MAX_ATTEMPTS", 4, 1, 10),
    dailyBudgetUsd: optionalMoney("OPENAI_DAILY_BUDGET_USD"),
    monthlyBudgetUsd: optionalMoney("OPENAI_MONTHLY_BUDGET_USD"),
    generationStandardCostUsd: estimatedCost(
      "OPENAI_GENERATION_STANDARD_ESTIMATED_COST_USD",
    ),
    generationHighCostUsd: estimatedCost(
      "OPENAI_GENERATION_HIGH_ESTIMATED_COST_USD",
    ),
    editCostUsd: estimatedCost("OPENAI_EDIT_ESTIMATED_COST_USD"),
    ipHashSalt:
      process.env.IP_HASH_SALT?.trim() ||
      process.env.CRON_SECRET?.trim() ||
      "crealy-local-only",
  };
}
