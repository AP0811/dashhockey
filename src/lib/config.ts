type EnvConfig = {
  databaseUrl: string;
  authSecret: string;
  storageProvider: string;
  storageBucket: string;
};

function readEnv(name: string): string {
  const value = process.env[name];
  return value?.trim() ?? "";
}

export function getEnvConfig(): EnvConfig {
  return {
    databaseUrl: readEnv("DATABASE_URL"),
    authSecret: readEnv("AUTH_SECRET"),
    storageProvider: readEnv("STORAGE_PROVIDER"),
    storageBucket: readEnv("STORAGE_BUCKET"),
  };
}

export function getMissingEnvKeys(config = getEnvConfig()): string[] {
  return Object.entries(config)
    .filter(([, value]) => !value)
    .map(([key]) => key);
}
