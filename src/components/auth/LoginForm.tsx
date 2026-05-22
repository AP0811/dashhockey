"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function LoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim().toLowerCase(),
          password,
        }),
      });

      let payload: { role?: string; error?: string } | null = null;
      try {
        payload = (await response.json()) as { role?: string; error?: string };
      } catch {
        payload = null;
      }

      if (!response.ok || !payload?.role) {
        setError(payload?.error ?? `Connexion impossible (HTTP ${response.status}).`);
        return;
      }

      if (payload.role === "participant") {
        router.push("/participant");
      } else if (payload.role === "coach") {
        router.push("/coach");
      } else {
        router.push("/admin");
      }

      router.refresh();
    } catch {
      setError("Erreur réseau. Réessayez.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
      <h2 className="text-lg font-bold tracking-tight text-slate-900">Connexion sécurisée</h2>

      <div className="mt-4 space-y-3">
        <label className="block text-sm font-semibold text-slate-800" htmlFor="username">
          Username
        </label>
        <input
          id="username"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white"
          autoComplete="username"
          required
        />

        <label className="block text-sm font-semibold text-slate-800" htmlFor="password">
          Mot de passe
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white"
          autoComplete="current-password"
          required
        />
      </div>

      {error ? <p className="mt-3 text-sm font-medium text-rose-700">{error}</p> : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "Connexion..." : "Ouvrir mon espace"}
      </button>
    </form>
  );
}
