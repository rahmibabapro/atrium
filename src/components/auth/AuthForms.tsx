"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { authClient } from "@/lib/atriumid/auth-client";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="mt-4 block text-sm font-medium">
      {label}
      <div className="mt-1">{children}</div>
    </label>
  );
}

const inputClass =
  "w-full rounded-xl border border-[var(--atr-border)] bg-white px-3 py-2 outline-none focus:border-[var(--atr-brand)]";

export function RegisterForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const username = String(fd.get("username") || "").trim();
    const email = String(fd.get("email") || "").trim();
    const password = String(fd.get("password") || "");

    const { error: err } = await authClient.signUp.email({
      email,
      password,
      name: username,
      username,
    });

    setLoading(false);
    if (err) {
      setError(err.message || "Registration failed");
      return;
    }
    router.push("/account");
    router.refresh();
  }

  return (
    <form
      onSubmit={onSubmit}
      className="w-full max-w-md rounded-3xl border border-[var(--atr-border)] bg-white p-8"
    >
      <h1 className="text-2xl font-bold tracking-tight">Create Atrium ID</h1>
      <p className="mt-2 text-sm text-[var(--atr-sub)]">
        One account for web and game. Username: 3–16 chars, letters/numbers/_
        only.
      </p>
      <Field label="Username">
        <input
          name="username"
          required
          minLength={3}
          maxLength={16}
          pattern="[A-Za-z0-9_]+"
          className={inputClass}
          autoComplete="username"
        />
      </Field>
      <Field label="Email">
        <input
          name="email"
          type="email"
          required
          className={inputClass}
          autoComplete="email"
        />
      </Field>
      <Field label="Password">
        <input
          name="password"
          type="password"
          required
          minLength={8}
          className={inputClass}
          autoComplete="new-password"
        />
      </Field>
      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
      <button
        disabled={loading}
        type="submit"
        className="btn btn-primary mt-6 w-full"
      >
        {loading ? "Creating…" : "Create account"}
      </button>
      <p className="mt-4 text-sm text-[var(--atr-muted)]">
        Already have an account?{" "}
        <Link href="/login" className="text-[var(--atr-brand)]">
          Log in
        </Link>
      </p>
    </form>
  );
}

export function LoginForm({ next = "/account" }: { next?: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"username" | "email">("username");

  async function finishOk() {
    router.push(next);
    router.refresh();
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const password = String(fd.get("password") || "");

    let errMsg: string | null = null;
    if (mode === "username") {
      const username = String(fd.get("username") || "").trim();
      const { error: err } = await authClient.signIn.username({
        username,
        password,
      });
      if (err) errMsg = err.message || "Login failed";
    } else {
      const email = String(fd.get("email") || "").trim();
      const { error: err } = await authClient.signIn.email({
        email,
        password,
      });
      if (err) errMsg = err.message || "Login failed";
    }

    setLoading(false);
    if (errMsg) {
      setError(errMsg);
      return;
    }
    await finishOk();
  }

  async function onPasskey() {
    setError(null);
    setLoading(true);
    const { error: err } = await authClient.signIn.passkey();
    setLoading(false);
    if (err) {
      setError(err.message || "Passkey sign-in failed");
      return;
    }
    await finishOk();
  }

  return (
    <form
      onSubmit={onSubmit}
      className="w-full max-w-md rounded-3xl border border-[var(--atr-border)] bg-white p-8 shadow-[0_20px_60px_rgba(15,23,42,0.06)]"
    >
      <h1 className="text-2xl font-bold tracking-tight">Atrium ID Login</h1>
      <p className="mt-2 text-sm text-[var(--atr-sub)]">
        One account for the website and optional game clients.
      </p>
      <div className="mt-4 flex gap-2 text-xs font-semibold">
        <button
          type="button"
          onClick={() => setMode("username")}
          className={`rounded-full px-3 py-1 ${mode === "username" ? "bg-[var(--atr-brand)] text-white" : "bg-[var(--atr-p-slate-100)]"}`}
        >
          Username
        </button>
        <button
          type="button"
          onClick={() => setMode("email")}
          className={`rounded-full px-3 py-1 ${mode === "email" ? "bg-[var(--atr-brand)] text-white" : "bg-[var(--atr-p-slate-100)]"}`}
        >
          Email
        </button>
      </div>
      {mode === "username" ? (
        <Field label="Username">
          <input
            name="username"
            required
            className={inputClass}
            autoComplete="username"
          />
        </Field>
      ) : (
        <Field label="Email">
          <input
            name="email"
            type="email"
            required
            className={inputClass}
            autoComplete="email"
          />
        </Field>
      )}
      <Field label="Password">
        <input
          name="password"
          type="password"
          required
          className={inputClass}
          autoComplete="current-password"
        />
      </Field>
      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
      <button
        disabled={loading}
        type="submit"
        className="btn btn-primary mt-6 w-full"
      >
        {loading ? "Signing in…" : "Sign in"}
      </button>
      <button
        type="button"
        disabled={loading}
        onClick={onPasskey}
        className="btn mt-3 w-full border border-[var(--atr-border)] bg-[var(--atr-p-slate-050)]"
      >
        Sign in with passkey
      </button>
      <p className="mt-4 text-sm text-[var(--atr-muted)]">
        No account?{" "}
        <Link href="/register" className="text-[var(--atr-brand)]">
          Register
        </Link>
      </p>
    </form>
  );
}

export function TwoFactorForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const code = String(new FormData(e.currentTarget).get("code") || "").trim();
    const { error: err } = await authClient.twoFactor.verifyTotp({ code });
    setLoading(false);
    if (err) {
      setError(err.message || "Invalid code");
      return;
    }
    router.push("/account");
    router.refresh();
  }

  return (
    <form
      onSubmit={onSubmit}
      className="w-full max-w-md rounded-3xl border border-[var(--atr-border)] bg-white p-8"
    >
      <h1 className="text-2xl font-bold tracking-tight">Two-factor</h1>
      <p className="mt-2 text-sm text-[var(--atr-sub)]">
        Enter the 6-digit code from your authenticator app.
      </p>
      <Field label="Authentication code">
        <input
          name="code"
          required
          inputMode="numeric"
          pattern="[0-9]{6}"
          maxLength={6}
          className={inputClass}
          autoComplete="one-time-code"
        />
      </Field>
      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
      <button
        disabled={loading}
        type="submit"
        className="btn btn-primary mt-6 w-full"
      >
        {loading ? "Verifying…" : "Verify"}
      </button>
    </form>
  );
}

export function AccountPanel({
  user,
}: {
  user: {
    id: string;
    name: string;
    email: string;
    username?: string | null;
  };
}) {
  const router = useRouter();
  const [msg, setMsg] = useState<string | null>(null);

  async function logout() {
    await authClient.signOut();
    router.push("/");
    router.refresh();
  }

  async function addPasskey() {
    setMsg(null);
    const { error } = await authClient.passkey.addPasskey({
      name: `${user.username || user.name}-device`,
    });
    setMsg(error ? error.message || "Could not add passkey" : "Passkey enrolled.");
  }

  return (
    <div className="w-full max-w-xl rounded-3xl border border-[var(--atr-border)] bg-white p-8">
      <p className="text-xs font-semibold tracking-[0.16em] text-[var(--atr-brand)] uppercase">
        Atrium ID
      </p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight">
        {user.username || user.name}
      </h1>
      <dl className="mt-6 space-y-3 text-sm">
        <div className="flex justify-between gap-4 border-b border-[var(--atr-border)] py-2">
          <dt className="text-[var(--atr-muted)]">User id</dt>
          <dd className="font-mono text-xs">{user.id}</dd>
        </div>
        <div className="flex justify-between gap-4 border-b border-[var(--atr-border)] py-2">
          <dt className="text-[var(--atr-muted)]">Email</dt>
          <dd>{user.email}</dd>
        </div>
      </dl>
      <div className="mt-6 flex flex-wrap gap-3">
        <button type="button" onClick={addPasskey} className="btn btn-primary">
          Add passkey
        </button>
        <Link
          href="/account/devices"
          className="btn border border-[var(--atr-border)] bg-[var(--atr-p-slate-050)]"
        >
          Link game client
        </Link>
        <button
          type="button"
          onClick={logout}
          className="btn border border-[var(--atr-border)]"
        >
          Sign out
        </button>
      </div>
      {msg ? <p className="mt-4 text-sm text-[var(--atr-sub)]">{msg}</p> : null}
    </div>
  );
}

export function DeviceLinkForm({ initialCode = "" }: { initialCode?: string }) {
  const [userCode, setUserCode] = useState(initialCode);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onApprove(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    const formatted = userCode.trim().replace(/-/g, "").toUpperCase();
    if (formatted.length < 6) {
      setLoading(false);
      setError("Enter the code shown in the game client.");
      return;
    }

    // Claim code for this session (GET /device), then approve.
    const claimed = await authClient.device({
      query: { user_code: formatted },
    });
    if (claimed.error) {
      setLoading(false);
      setError(
        claimed.error.error_description ||
          claimed.error.error ||
          "Invalid or expired code",
      );
      return;
    }

    const approved = await authClient.device.approve({ userCode: formatted });
    setLoading(false);
    if (approved.error) {
      setError(
        approved.error.error_description ||
          approved.error.error ||
          "Could not approve device",
      );
      return;
    }
    setSuccess("Game link approved. Return to the client.");
  }

  async function onDeny() {
    setError(null);
    setSuccess(null);
    setLoading(true);
    const formatted = userCode.trim().replace(/-/g, "").toUpperCase();
    await authClient.device({ query: { user_code: formatted } }).catch(() => null);
    const denied = await authClient.device.deny({ userCode: formatted });
    setLoading(false);
    if (denied.error) {
      setError(
        denied.error.error_description ||
          denied.error.error ||
          "Could not deny device",
      );
      return;
    }
    setSuccess("Device request denied.");
  }

  return (
    <form
      onSubmit={onApprove}
      className="w-full max-w-md rounded-3xl border border-[var(--atr-border)] bg-white p-8"
    >
      <p className="text-xs font-semibold tracking-[0.16em] text-[var(--atr-brand)] uppercase">
        Atrium ID · Game bridge
      </p>
      <h1 className="mt-2 text-2xl font-bold tracking-tight">Link game client</h1>
      <p className="mt-2 text-sm text-[var(--atr-sub)]">
        Enter the one-time code from the game (or{" "}
        <code className="text-xs">/atriumid link</code>). This uses the same
        device-authorization flow as CLI/TV login.
      </p>
      <Field label="Device code">
        <input
          value={userCode}
          onChange={(e) => setUserCode(e.target.value)}
          placeholder="ABCD-1234"
          maxLength={12}
          className={`${inputClass} font-mono tracking-widest uppercase`}
          autoComplete="one-time-code"
          required
        />
      </Field>
      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
      {success ? <p className="mt-3 text-sm text-emerald-700">{success}</p> : null}
      <div className="mt-6 flex flex-col gap-2 sm:flex-row">
        <button
          disabled={loading}
          type="submit"
          className="btn btn-primary flex-1"
        >
          {loading ? "Working…" : "Approve"}
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={onDeny}
          className="btn flex-1 border border-[var(--atr-border)]"
        >
          Deny
        </button>
      </div>
      <p className="mt-4 text-sm text-[var(--atr-muted)]">
        <Link href="/account" className="text-[var(--atr-brand)]">
          Back to account
        </Link>
      </p>
    </form>
  );
}
