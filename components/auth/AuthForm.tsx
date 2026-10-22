'use client';

import { Eye, EyeOff } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';

export interface AuthField {
  label: string;
  type: 'text' | 'email' | 'password';
  placeholder: string;
  autoComplete: string;
  onChange: (value: string) => void;
}

const inputClass =
  'w-full rounded-lg border border-blue-400/20 bg-[#0f1f3a] px-4 py-3 text-sm text-white outline-none transition placeholder:text-blue-100/40 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/30';

function Field({ field }: { field: AuthField }) {
  const [revealed, setRevealed] = useState(false);
  const id = `auth-${field.label.toLowerCase().replace(/\s+/g, '-')}`;
  const isPassword = field.type === 'password';

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-blue-100">
        {field.label}
      </label>
      <div className="relative">
        <input
          id={id}
          required
          type={isPassword && revealed ? 'text' : field.type}
          placeholder={field.placeholder}
          autoComplete={field.autoComplete}
          onChange={(e) => field.onChange(e.target.value)}
          className={inputClass}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setRevealed(!revealed)}
            // Not "Show password": the e2e tests find the field with getByLabel('Password').
            aria-label={revealed ? 'Hide characters' : 'Show characters'}
            aria-pressed={revealed}
            className="absolute inset-y-0 right-3 flex items-center text-blue-100/60 hover:text-white"
          >
            {revealed ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        )}
      </div>
    </div>
  );
}

/** Heading, fields, submit, optional Google button and a link to the other auth page. */
export default function AuthForm({
  title,
  subtitle,
  fields,
  submitLabel,
  busy,
  error,
  onSubmit,
  google,
  switchPrompt,
}: {
  title: string;
  subtitle: string;
  fields: AuthField[];
  submitLabel: string;
  busy: boolean;
  error: string;
  onSubmit: () => void;
  google?: { label: string; onClick: () => void };
  switchPrompt?: { text: string; onClick: () => void };
}) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-white">{title}</h1>
        <p className="text-sm text-blue-100/70">{subtitle}</p>
      </div>

      {google && (
        <>
          <button
            type="button"
            onClick={google.onClick}
            className="flex w-full items-center justify-center gap-3 rounded-lg border border-blue-400/20 bg-white/5 py-3 text-sm font-medium text-white transition hover:bg-white/10"
          >
            <Image src="/assets/icons/google.svg" alt="" width={18} height={18} />
            {google.label}
          </button>
          <div className="flex items-center gap-3 text-xs uppercase text-blue-100/40">
            <span className="h-px flex-1 bg-blue-400/20" />
            or
            <span className="h-px flex-1 bg-blue-400/20" />
          </div>
        </>
      )}

      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
      >
        {fields.map((field) => (
          <Field key={field.label} field={field} />
        ))}
        {error && (
          <p role="alert" className="text-sm text-red-400">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-lg bg-gradient-to-r from-blue-600 to-blue-500 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-900/40 transition hover:brightness-110 disabled:opacity-60"
        >
          {submitLabel}
        </button>
      </form>

      {switchPrompt && (
        <button type="button" onClick={switchPrompt.onClick} className="w-full text-center text-sm text-blue-300 hover:underline">
          {switchPrompt.text}
        </button>
      )}
    </div>
  );
}

/** The most useful message from a Clerk API error. */
export function clerkMessage(error: unknown, fallback: string): string {
  const first = (error as { errors?: { longMessage?: string; message?: string }[] })?.errors?.[0];
  return first?.longMessage || first?.message || fallback;
}

