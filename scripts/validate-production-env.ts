import { loadEnvConfig } from "@next/env";

import { validateProductionEnv } from "../src/lib/env/validate-production-env";

loadEnvConfig(process.cwd());
const result = validateProductionEnv();

if (result.missing.length) {
  console.error(`Variables requeridas ausentes: ${result.missing.join(", ")}`);
}
if (result.invalid.length) {
  console.error(`Variables inválidas: ${result.invalid.join(", ")}`);
}
if (result.warnings.length) {
  console.warn(`Revisión manual pendiente: ${result.warnings.join(", ")}`);
}
if (!result.valid) process.exitCode = 1;
else console.log("La configuración de producción supera la validación estática.");
