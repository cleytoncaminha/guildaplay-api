import { z } from "zod";

const corsOriginsSchema = z
  .string()
  .trim()
  .min(1, "CORS_ALLOWED_ORIGINS é obrigatória.")
  .transform((value) =>
    value
      .split(",")
      .map((origin) => origin.trim())
      .filter(Boolean),
  )
  .refine((origins) => origins.length > 0, {
    message: "CORS_ALLOWED_ORIGINS deve conter ao menos uma origin.",
  })
  .refine((origins) => !origins.includes("*"), {
    message: "CORS_ALLOWED_ORIGINS não aceita wildcard.",
  })
  .refine(
    (origins) => origins.every((origin) => z.url().safeParse(origin).success),
    {
      message:
        "CORS_ALLOWED_ORIGINS deve conter URLs válidas separadas por vírgula.",
    },
  );

const environmentSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]),
  PORT: z.coerce.number().int().min(1).max(65535),
  CORS_ALLOWED_ORIGINS: corsOriginsSchema,
  DATABASE_URL: z.url(),
  JWT_ACCESS_SECRET: z.string().min(32),
  ACCESS_TOKEN_TTL: z.string().min(1).default("15m"),
  REFRESH_TOKEN_TTL: z.string().min(1).default("30d"),
  R2_ACCOUNT_ID: z.string().min(1),
  R2_ACCESS_KEY_ID: z.string().min(1),
  R2_SECRET_ACCESS_KEY: z.string().min(1),
  R2_BUCKET_NAME: z.string().min(1),
});

export type EnvironmentVariables = z.infer<typeof environmentSchema>;

export function validateEnvironment(
  config: Record<string, unknown>,
): EnvironmentVariables {
  const result = environmentSchema.safeParse(config);

  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");

    throw new Error(`Configuração de ambiente inválida: ${issues}`);
  }

  return result.data;
}
