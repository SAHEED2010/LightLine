import "server-only";
import { z } from "zod";
import { AppError } from "./http";

const secretSchema = z
  .string()
  .min(32)
  .max(512)
  .regex(/^[\x21-\x7E]+$/)
  .refine((value) => !value.startsWith("replace-"));
const databaseSchema = z
  .string()
  .url()
  .refine((value) =>
    ["postgres:", "postgresql:"].includes(new URL(value).protocol),
  );

function required(name: string, schema: z.ZodType<string>): string {
  const result = schema.safeParse(process.env[name]);
  if (!result.success) {
    console.error("Missing or invalid server configuration", {
      variable: name,
    });
    throw new AppError(
      503,
      "CONFIGURATION_REQUIRED",
      "This service is not configured. Contact the LightLine operator.",
    );
  }
  return result.data;
}
export const getDatabaseUrl = () => required("DATABASE_URL", databaseSchema);

function distinctSecrets() {
  const tool = required("LIGHTLINE_TOOL_API_KEY", secretSchema);
  const operator = required("OPERATOR_ACCESS_SECRET", secretSchema);
  if (tool === operator) {
    console.error("Tool and operator secrets must differ");
    throw new AppError(
      503,
      "CONFIGURATION_REQUIRED",
      "This service is not configured. Contact the LightLine operator.",
    );
  }
  return { tool, operator };
}

export const getToolSecret = () => distinctSecrets().tool;
export const getOperatorSecret = () => distinctSecrets().operator;
