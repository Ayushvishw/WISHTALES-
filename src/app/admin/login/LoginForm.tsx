"use client";

import { useActionState } from "react";
import { login, setupOwner } from "../actions";

export function LoginForm({ setup }: { setup: boolean }) {
  const [state, action, pending] = useActionState(setup ? setupOwner : login, {} as { error?: string; email?: string });
  return (
    <form action={action} className="panel">
      {setup && (
        <label className="fl" htmlFor="code"><span>Setup code</span><input id="code" name="code" required autoComplete="off" /></label>
      )}
      <label className="fl" htmlFor="email"><span>Email</span><input id="email" name="email" type="email" required autoComplete="username" defaultValue={state.email} key={state.email} /></label>
      <label className="fl" htmlFor="password"><span>Password</span><input id="password" name="password" type="password" required minLength={setup ? 12 : 1} autoComplete={setup ? "new-password" : "current-password"} /></label>
      {state.error && <p className="err" role="alert" style={{ margin: 0 }}>{state.error}</p>}
      <button className="btn" disabled={pending}>{pending ? "One moment…" : setup ? "Create account" : "Sign in"}</button>
    </form>
  );
}
