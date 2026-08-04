import type { AuthActionState, AuthField } from "@/lib/auth/action-state";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function readText(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function validateEmail(email: string): string | undefined {
  if (!email) return "Introduce tu correo electrónico.";
  if (email.length > 254 || !emailPattern.test(email)) {
    return "Introduce un correo electrónico válido.";
  }
}

export function validatePassword(password: string): string | undefined {
  if (!password) return "Introduce tu contraseña.";
  if (password.length < 8) {
    return "La contraseña debe tener al menos 8 caracteres.";
  }
  if (!/[A-Z]/.test(password) || !/\d/.test(password)) {
    return "Incluye al menos una mayúscula y un número.";
  }
}

export function errorState(
  message: string,
  fieldErrors?: Partial<Record<AuthField, string>>,
  values?: AuthActionState["values"],
): AuthActionState {
  return { status: "error", message, fieldErrors, values };
}
