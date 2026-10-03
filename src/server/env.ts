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
export const getToolSecret = () =>
  required("LIGHTLINE_TOOL_API_KEY", secretSchema);
export const getOperatorSecret = () =>
  required("OPERATOR_ACCESS_SECRET", secretSchema);
