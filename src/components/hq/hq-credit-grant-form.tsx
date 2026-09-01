"use client";

import { useActionState, useEffect, useRef } from "react";
import { BadgePlus, CheckCircle2, LoaderCircle, ShieldAlert } from "lucide-react";

import { grantUserCredits, type CreditGrantState } from "@/app/(hq)/hq/users/actions";

type UserOption = { id: string; label: string; email: string; credits: number };
const initialCreditGrantState: CreditGrantState = { status: "idle", message: "" };

export function HqCreditGrantForm({ users, requestId }: { users: UserOption[]; requestId: string }) {
  const [state, action, pending] = useActionState(grantUserCredits, initialCreditGrantState);
  const formRef = useRef<HTMLFormElement>(null);
  const requestIdRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (state.status !== "success") return;
    formRef.current?.reset();
    if (requestIdRef.current) requestIdRef.current.value = crypto.randomUUID();
  }, [state]);

  return (
    <section className="hq-credit-station" aria-labelledby="grant-credits-title">
      <div className="hq-credit-station-copy">
        <span className="grid size-10 shrink-0 place-items-center rounded-[0.7rem] bg-brand/10 text-brand">
          <BadgePlus aria-hidden="true" className="size-5" />
        </span>
        <div>
          <h2 id="grant-credits-title">Acreditar saldo</h2>
          <p>Entrega créditos permanentes a una cuenta. La operación queda registrada y no puede deshacerse desde HQ.</p>
        </div>
      </div>

      <form ref={formRef} action={action} className="hq-credit-form">
        <input ref={requestIdRef} type="hidden" name="requestId" defaultValue={requestId} />
        <label>
          <span>Cuenta</span>
          <select name="userId" required defaultValue="">
            <option value="" disabled>Selecciona un usuario</option>
            {users.map((user) => <option key={user.id} value={user.id}>{user.label} · {user.email} · {user.credits} créditos</option>)}
          </select>
        </label>
        <label>
          <span>Cantidad</span>
          <input name="amount" type="number" inputMode="numeric" min="1" max="1000" step="1" placeholder="5" required />
        </label>
        <label className="hq-credit-reason">
          <span>Motivo interno</span>
          <input name="reason" minLength={5} maxLength={100} placeholder="Ej. cortesía por incidencia" required />
        </label>
        <button type="submit" disabled={pending || users.length === 0}>
          {pending ? <LoaderCircle aria-hidden="true" className="size-4 animate-spin" /> : <BadgePlus aria-hidden="true" className="size-4" />}
          {pending ? "Acreditando" : "Dar créditos"}
        </button>
      </form>

      {state.status !== "idle" ? (
        <p className={`hq-credit-result hq-credit-result-${state.status}`} role={state.status === "error" ? "alert" : "status"}>
          {state.status === "success" ? <CheckCircle2 aria-hidden="true" className="size-4" /> : <ShieldAlert aria-hidden="true" className="size-4" />}
          {state.message}
        </p>
      ) : null}
    </section>
  );
}
