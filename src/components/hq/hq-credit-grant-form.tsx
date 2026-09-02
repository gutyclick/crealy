"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { BadgePlus, CheckCircle2, LoaderCircle, Mail, ShieldAlert, X } from "lucide-react";

import { grantUserCredits, sendCreditGrantEmail, type CreditEmailState, type CreditGrantState } from "@/app/(hq)/hq/users/actions";

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
      {state.status === "success" && state.grant ? <CreditEmailDialog key={state.grant.requestId} grant={state.grant} /> : null}
    </section>
  );
}

function CreditEmailDialog({ grant }: { grant: NonNullable<CreditGrantState["grant"]> }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [sending, startSending] = useTransition();
  const [emailState, setEmailState] = useState<CreditEmailState | null>(null);

  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  function closeDialog() {
    dialogRef.current?.close();
  }

  function sendEmail() {
    startSending(async () => {
      const result = await sendCreditGrantEmail({ userId: grant.userId, requestId: grant.requestId });
      setEmailState(result);
    });
  }

  return (
    <dialog ref={dialogRef} className="hq-credit-dialog" aria-labelledby="credit-email-title" aria-describedby="credit-email-description">
      <div className="hq-credit-dialog-head">
        <span className="grid size-10 place-items-center rounded-[0.7rem] bg-brand/10 text-brand"><Mail aria-hidden="true" className="size-5" /></span>
        <button type="button" onClick={closeDialog} aria-label="Cerrar sin enviar correo"><X aria-hidden="true" className="size-5" /></button>
      </div>
      <h2 id="credit-email-title">¿Avisamos al usuario?</h2>
      <p id="credit-email-description">Los créditos ya fueron acreditados. Puedes enviar una confirmación a <strong>{grant.email}</strong> o continuar sin correo.</p>
      <dl className="hq-credit-dialog-summary">
        <div><dt>Monto</dt><dd>+{grant.amount.toLocaleString("es-PA")} créditos</dd></div>
        <div><dt>Motivo</dt><dd>{grant.reason}</dd></div>
        <div><dt>Asunto</dt><dd>¡Has recibido créditos!</dd></div>
      </dl>

      {emailState ? (
        <p className={`hq-credit-email-state hq-credit-email-state-${emailState.status}`} role={emailState.status === "error" ? "alert" : "status"}>
          {emailState.status === "success" ? <CheckCircle2 aria-hidden="true" className="size-4" /> : <ShieldAlert aria-hidden="true" className="size-4" />}
          {emailState.message}
        </p>
      ) : null}

      <div className="hq-credit-dialog-actions">
        {emailState?.status === "success" ? (
          <button type="button" className="hq-credit-dialog-primary" onClick={closeDialog}>Cerrar</button>
        ) : (
          <>
            <button type="button" className="hq-credit-dialog-secondary" onClick={closeDialog} disabled={sending}>Omitir correo</button>
            <button type="button" className="hq-credit-dialog-primary" onClick={sendEmail} disabled={sending}>
              {sending ? <LoaderCircle aria-hidden="true" className="size-4 animate-spin" /> : <Mail aria-hidden="true" className="size-4" />}
              {sending ? "Enviando" : emailState?.status === "error" ? "Reintentar envío" : "Enviar correo"}
            </button>
          </>
        )}
      </div>
    </dialog>
  );
}
