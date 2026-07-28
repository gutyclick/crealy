"use client";

import Link from "next/link";
import { useActionState } from "react";

import { signIn } from "@/app/(auth)/actions";
import { AuthMessage } from "@/components/auth/auth-message";
import { FormField } from "@/components/auth/form-field";
import { PasswordInput } from "@/components/auth/password-input";
import { SubmitButton } from "@/components/auth/submit-button";
import {
  initialAuthState,
  type AuthActionState,
} from "@/lib/auth/action-state";

type LoginFormProps = {
  nextPath: string;
  callbackError?: boolean;
};

export function LoginForm({
  nextPath,
  callbackError = false,
}: LoginFormProps) {
  const initialState: AuthActionState = callbackError
    ? {
        status: "error",
        message:
          "El enlace de autenticación no es válido o ya expiró. Inténtalo nuevamente.",
      }
    : initialAuthState;
  const [state, formAction] = useActionState(signIn, initialState);

  return (
    <form action={formAction} className="grid gap-5" noValidate>
      <input type="hidden" name="next" value={nextPath} />
      <AuthMessage state={state} />
      <FormField
        id="login-email"
        name="email"
        type="email"
        label="Correo electrónico"
        autoComplete="email"
        inputMode="email"
        required
        defaultValue={state.values?.email}
        error={state.fieldErrors?.email}
      />
      <div>
        <PasswordInput
          id="login-password"
          name="password"
          label="Contraseña"
          autoComplete="current-password"
          error={state.fieldErrors?.password}
        />
        <Link
          href="/forgot-password"
          className="mt-3 inline-flex text-sm font-medium text-white/68 transition-colors hover:text-brand"
        >
          ¿Olvidaste tu contraseña?
        </Link>
      </div>
      <SubmitButton pendingLabel="Iniciando sesión…">
        Iniciar sesión
      </SubmitButton>
      <p className="text-center text-sm text-muted">
        ¿Aún no tienes cuenta?{" "}
        <Link
          href="/signup"
          className="font-semibold text-foreground transition-colors hover:text-brand"
        >
          Crear una cuenta
        </Link>
      </p>
    </form>
  );
}
