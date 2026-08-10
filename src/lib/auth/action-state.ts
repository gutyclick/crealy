export type AuthField =
  | "name"
  | "email"
  | "password"
  | "confirmPassword"
  | "inviteCode"
  | "terms";

export type AuthActionState = {
  status: "idle" | "error" | "success";
  message?: string;
  fieldErrors?: Partial<Record<AuthField, string>>;
  values?: {
    name?: string;
    email?: string;
  };
};

export const initialAuthState: AuthActionState = {
  status: "idle",
};
