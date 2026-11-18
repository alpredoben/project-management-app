import { z } from "zod";

export const APP_ENVIRONMENTS = {
  DEVELOPMENT: "development",
  PRODUCTION: "production",
} as const;

export type AppEnvironment =
  (typeof APP_ENVIRONMENTS)[keyof typeof APP_ENVIRONMENTS];

export const ENV_FILE_BY_ENVIRONMENT: Record<
  AppEnvironment,
  ".env.dev" | ".env.prod"
> = {
  development: ".env.dev",
  production: ".env.prod",
} as const;

export type LogLevel = "debug" | "info" | "warn" | "error";

const rawEnvSchema = z.object({
  ENVIRONMENT: z.enum(["development", "production"]),
  NODE_ENV: z.enum(["development", "production"]),
  ENV_FILE: z.enum([".env.dev", ".env.prod"]),
  APP_NAME: z.string().min(1),
  APP_VERSION: z.string().min(1),
  APP_URL: z.string(),
  API_BASE_URL: z.string().min(1),
  API_TIMEOUT_MS: z.number().int().positive(),
  ENABLE_DEMO_AUTH: z.boolean(),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]),
  PORT: z.number().int().positive(),
});

export interface EnvironmentConfig extends z.infer<typeof rawEnvSchema> {
  readonly IS_DEVELOPMENT: boolean;
  readonly IS_PRODUCTION: boolean;
}

type RawEnvSource = Record<string, string | boolean | undefined>;
type RuntimeProcess = {
  env?: RawEnvSource;
  cwd?: () => string;
};

const getRuntimeProcess = (): RuntimeProcess | undefined =>
  (globalThis as typeof globalThis & { process?: RuntimeProcess }).process;

/**
 * Resolves the active environment ("development" | "production") from
 * ENVIRONMENT or NODE_ENV values.
 */
export function resolveAppEnvironment(rawValue?: string): AppEnvironment {
  const normalized = rawValue?.trim().toLowerCase();
  if (normalized === "production" || normalized === "prod") {
    return APP_ENVIRONMENTS.PRODUCTION;
  }
  return APP_ENVIRONMENTS.DEVELOPMENT;
}

/**
 * Returns ".env.prod" for production and ".env.dev" for development.
 */
export function resolveEnvFile(env: AppEnvironment): ".env.dev" | ".env.prod" {
  return ENV_FILE_BY_ENVIRONMENT[env];
}

const readRawEnvSource = (): RawEnvSource => {
  const metaEnv =
    typeof import.meta !== "undefined" &&
    typeof (import.meta as unknown as { env?: RawEnvSource }).env === "object"
      ? (import.meta as unknown as { env: RawEnvSource }).env
      : {};

  const procEnv = getRuntimeProcess()?.env ?? {};

  return {
    ...procEnv,
    ...metaEnv,
  };
};

const parseBoolean = (
  value: string | boolean | undefined,
  fallback: boolean,
): boolean => {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true" || normalized === "1") return true;
    if (normalized === "false" || normalized === "0") return false;
  }
  return fallback;
};

const parsePositiveInt = (
  value: string | boolean | undefined,
  fallback: number,
): number => {
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isInteger(parsed) && parsed > 0) return parsed;
  }
  return fallback;
};

const readString = (
  value: string | boolean | undefined,
  fallback: string,
): string => {
  return typeof value === "string" && value.trim() !== ""
    ? value.trim()
    : fallback;
};

/**
 * Initializes and validates all application environment constants using Zod.
 * On the client, values come from Vite's env loader (.env.dev / .env.prod).
 */
export function initializeEnvironment(
  overrideSource?: RawEnvSource,
): Readonly<EnvironmentConfig> {
  const source = overrideSource ?? readRawEnvSource();

  const rawEnvFlag =
    readString(source.ENVIRONMENT, "") ||
    readString(source.VITE_ENVIRONMENT, "") ||
    readString(source.NODE_ENV, "") ||
    readString(source.MODE, "");

  const environment = resolveAppEnvironment(rawEnvFlag);
  const envFile = resolveEnvFile(environment);
  const isProd = environment === APP_ENVIRONMENTS.PRODUCTION;

  const logLevelRaw = readString(
    source.VITE_LOG_LEVEL ?? source.LOG_LEVEL,
    isProd ? "warn" : "debug",
  ).toLowerCase();

  const logLevel: LogLevel =
    logLevelRaw === "info" || logLevelRaw === "warn" || logLevelRaw === "error"
      ? logLevelRaw
      : "debug";

  const validated = rawEnvSchema.parse({
    ENVIRONMENT: environment,
    NODE_ENV: environment,
    ENV_FILE: envFile,
    APP_NAME: readString(source.VITE_APP_NAME ?? source.APP_NAME, "MILE-DEV"),
    APP_VERSION: readString(
      source.VITE_APP_VERSION ?? source.APP_VERSION,
      isProd ? "1.0.0" : "1.0.0-dev",
    ),
    APP_URL: readString(source.VITE_APP_URL ?? source.APP_URL, ""),
    API_BASE_URL: readString(
      `${source.VITE_API_BASE_URL}/${source.VITE_API_PREFIX}`,
      `${source.VITE_API_BASE_URL}/api/v1`,
    ),
    API_TIMEOUT_MS: parsePositiveInt(
      source.VITE_API_TIMEOUT_MS ?? source.API_TIMEOUT_MS,
      isProd ? 10000 : 15000,
    ),
    ENABLE_DEMO_AUTH: parseBoolean(
      source.VITE_ENABLE_DEMO_AUTH ?? source.ENABLE_DEMO_AUTH,
      !isProd,
    ),
    LOG_LEVEL: logLevel,
    PORT: parsePositiveInt(source.PORT, 3000),
  });

  return Object.freeze({
    ...validated,
    IS_DEVELOPMENT: !isProd,
    IS_PRODUCTION: isProd,
  });
}

/**
 * Server/CLI helper: loads .env.dev or .env.prod from disk based on
 * process.env.ENVIRONMENT or process.env.NODE_ENV, then returns validated constants.
 * Safe to import in browser modules because Node modules are only resolved at runtime on Node.
 */
export async function initializeServerEnvironment(): Promise<
  Readonly<EnvironmentConfig>
> {
  const runtimeProcess = getRuntimeProcess();
  if (typeof window === "undefined" && runtimeProcess) {
    const rawFlag = runtimeProcess.env?.ENVIRONMENT ?? runtimeProcess.env?.NODE_ENV;
    const env = resolveAppEnvironment(
      typeof rawFlag === "string" ? rawFlag : undefined,
    );
    const envFile = resolveEnvFile(env);

    const dotenvModule = "dotenv";
    const pathModule = "node:path";
    const fsModule = "node:fs";

    const dotenv = (await import(/* @vite-ignore */ dotenvModule)) as {
      config: (opts: { path: string; override?: boolean }) => void;
    };
    const path = (await import(/* @vite-ignore */ pathModule)) as {
      resolve: (...segments: string[]) => string;
    };
    const fs = (await import(/* @vite-ignore */ fsModule)) as {
      existsSync: (filePath: string) => boolean;
    };

    const fullPath = path.resolve(runtimeProcess.cwd?.() ?? ".", envFile);
    if (fs.existsSync(fullPath)) {
      dotenv.config({ path: fullPath, override: false });
    }
  }

  return initializeEnvironment();
}

export const ENV: Readonly<EnvironmentConfig> = initializeEnvironment();
export const ENVIRONMENT_CONFIG = ENV;

export const {
  ENVIRONMENT,
  NODE_ENV,
  ENV_FILE,
  IS_DEVELOPMENT,
  IS_PRODUCTION,
  APP_NAME,
  APP_VERSION,
  APP_URL,
  API_BASE_URL,
  API_TIMEOUT_MS,
  ENABLE_DEMO_AUTH,
  LOG_LEVEL,
  PORT,
} = ENV;
