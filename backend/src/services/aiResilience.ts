/** Resiliência para falhas transitórias do provedor Gemini. */

export type RetryNotice = {
  model: string;
  attempt: number;
  nextModel?: string;
  delayMs?: number;
  status?: number;
};

export class AIProviderUnavailableError extends Error {
  readonly code = 'AI_TEMPORARILY_UNAVAILABLE';
  readonly statusCode = 503;
  readonly attemptedModels: string[];
  readonly attempts: number;

  constructor(attemptedModels: string[], attempts: number) {
    super('O provedor de IA está temporariamente indisponível após as tentativas configuradas.');
    this.name = 'AIProviderUnavailableError';
    this.attemptedModels = [...attemptedModels];
    this.attempts = attempts;
  }
}

export class AIProviderConfigurationError extends Error {
  readonly code = 'AI_PROVIDER_CONFIGURATION_ERROR';
  readonly statusCode = 502;

  constructor() {
    super('A configuração do provedor Gemini foi recusada. Verifique a chave e o nome do modelo no backend.');
    this.name = 'AIProviderConfigurationError';
  }
}

export function providerStatus(error: unknown): number | undefined {
  if (!error || typeof error !== 'object') return undefined;
  const candidate = error as { status?: unknown; statusCode?: unknown; message?: unknown };
  for (const value of [candidate.status, candidate.statusCode]) {
    const parsed = typeof value === 'number' ? value : Number(value);
    if (Number.isInteger(parsed) && parsed >= 100 && parsed <= 599) return parsed;
  }
  if (typeof candidate.message === 'string') {
    const match = candidate.message.match(/\[(\d{3})\s+[A-Z][A-Za-z ]*\]/);
    if (match) return Number(match[1]);
  }
  return undefined;
}

export function isRetryableProviderError(error: unknown): boolean {
  const status = providerStatus(error);
  if (status !== undefined) return status === 408 || status === 425 || status === 429 || status >= 500;
  if (!error || typeof error !== 'object') return false;
  const code = (error as { code?: unknown }).code;
  return typeof code === 'string' && [
    'ECONNRESET', 'ETIMEDOUT', 'EAI_AGAIN', 'ECONNREFUSED', 'UND_ERR_CONNECT_TIMEOUT',
  ].includes(code);
}

export function isProviderConfigurationError(error: unknown): boolean {
  const status = providerStatus(error);
  return status === 400 || status === 401 || status === 403 || status === 404 || status === 422;
}

export function getTextModelCandidates(env: NodeJS.ProcessEnv = process.env): string[] {
  const primary = (env.GEMINI_TEXT_MODEL || 'gemini-3.6-flash').trim();
  const fallbackValue = env.GEMINI_TEXT_FALLBACK_MODELS === undefined
    ? 'gemini-3.8-flash,gemini-3.5-flash-lite'
    : env.GEMINI_TEXT_FALLBACK_MODELS;
  const fallbacks = fallbackValue.split(',').map(model => model.trim()).filter(Boolean);
  return [...new Set([primary, ...fallbacks].filter(Boolean))];
}

export type ModelFallbackOptions = {
  models: string[];
  /** Number of retries after the first request, for the primary model only. */
  maxRetries?: number;
  baseDelayMs?: number;
  sleep?: (ms: number) => Promise<void>;
  random?: () => number;
  onRetry?: (notice: RetryNotice) => void;
};

/**
 * Tries the primary model with bounded exponential backoff, then each fallback once.
 * Client/configuration errors are not retried because repeating them cannot fix the cause.
 */
export async function withModelFallback<T>(
  call: (model: string) => Promise<T>,
  options: ModelFallbackOptions,
): Promise<{ value: T; model: string; attempts: number }> {
  const models = [...new Set(options.models.map(value => value.trim()).filter(Boolean))];
  if (!models.length) throw new Error('Nenhum modelo Gemini foi configurado.');

  const maxRetries = Number.isInteger(options.maxRetries) && (options.maxRetries as number) >= 0
    ? Math.min(options.maxRetries as number, 5)
    : 2;
  const baseDelayMs = Number.isFinite(options.baseDelayMs) && (options.baseDelayMs as number) >= 0
    ? Math.min(options.baseDelayMs as number, 10000)
    : 1000;
  const sleep = options.sleep || ((ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms)));
  const random = options.random || Math.random;
  let attempts = 0;
  const attemptedModels: string[] = [];
  let lastError: unknown;

  // Hard cap: at most three upstream requests per logical stage, regardless of
  // the number of configured fallback models. When fallback exists, reserve one
  // attempt for it so a transient primary-model outage can still recover.
  const maxTotalAttempts = 3;
  const primaryAttemptBudget = models.length > 1
    ? Math.min(maxRetries + 1, maxTotalAttempts - 1)
    : Math.min(maxRetries + 1, maxTotalAttempts);

  for (let modelIndex = 0; modelIndex < models.length && attempts < maxTotalAttempts; modelIndex += 1) {
    const model = models[modelIndex];
    const attemptsForModel = modelIndex === 0 ? primaryAttemptBudget : 1;

    for (let attempt = 1; attempt <= attemptsForModel && attempts < maxTotalAttempts; attempt += 1) {
      attempts += 1;
      attemptedModels.push(model);
      try {
        return { value: await call(model), model, attempts };
      } catch (error) {
        lastError = error;
        if (isProviderConfigurationError(error)) throw new AIProviderConfigurationError();
        if (!isRetryableProviderError(error)) throw error;

        const hasAnotherAttempt = attempt < attemptsForModel;
        const hasAnotherModel = modelIndex < models.length - 1 && attempts < maxTotalAttempts;
        if (hasAnotherAttempt) {
          const jitter = Math.floor(Math.max(0, Math.min(0.999999, random())) * 250);
          const delayMs = Math.min(baseDelayMs * (2 ** (attempt - 1)), 10000) + jitter;
          options.onRetry?.({ model, attempt, delayMs, status: providerStatus(error) });
          await sleep(delayMs);
        } else if (hasAnotherModel) {
          options.onRetry?.({ model, attempt, nextModel: models[modelIndex + 1], status: providerStatus(error) });
        }
      }
    }
  }

  // The final error is retained as cause for server-side debugging only.
  const unavailable = new AIProviderUnavailableError(attemptedModels, attempts);
  (unavailable as Error & { cause?: unknown }).cause = lastError;
  throw unavailable;
}
