import React, { useState, type ReactElement } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { Button } from '@/components/ui/button';
import { trpc } from '@/lib/trpc';
import { useAuthToken } from '@/hooks/useAuthToken';
import { ROUTES } from '@/constants';
import { AlertCircle, Loader2 } from 'lucide-react';

export const LoginForm = (): ReactElement => {
  const navigate = useNavigate({ from: ROUTES.LOGIN });
  const { setToken } = useAuthToken();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: (data) => {
      setToken(data.token);
      navigate({ to: ROUTES.HOME });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({ email, password });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <ErrorAlert error={loginMutation.error?.message} />

      <EmailField
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={loginMutation.isPending}
        error={!!loginMutation.error}
      />

      <PasswordFieldWithReset
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        disabled={loginMutation.isPending}
        error={!!loginMutation.error}
      />

      <SubmitButton isLoading={loginMutation.isPending} />

      <Divider />

      <SSOButton />
    </form>
  );
};

// Small components for better readability
const ErrorAlert = ({ error }: { error?: string }) => {
  if (!error) return null;

  return (
    <div className="flex items-start gap-3 p-4 bg-[var(--color-error-bg)] border border-[var(--destructive)] rounded-md text-[var(--color-error-text)]">
      <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
      <p className="text-sm">{error}</p>
    </div>
  );
};

type EmailFieldProps = {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled: boolean;
  error: boolean;
};

const EmailField = ({ value, onChange, disabled, error }: EmailFieldProps) => {
  return (
    <div className="space-y-2">
      <label
        htmlFor="email"
        className="block text-xs font-semibold text-foreground uppercase tracking-wide"
      >
        E-Mail Adresse
      </label>
      <Input
        id="email"
        type="email"
        value={value}
        onChange={onChange}
        placeholder="name@firma.de"
        required
        autoComplete="email"
        disabled={disabled}
        error={error}
      />
    </div>
  );
};

type PasswordFieldProps = {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled: boolean;
  error: boolean;
};

const PasswordFieldWithReset = ({ value, onChange, disabled, error }: PasswordFieldProps) => {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label
          htmlFor="password"
          className="block text-xs font-semibold text-foreground uppercase tracking-wide"
        >
          Passwort
        </label>
        <a
          href="mailto:support@limetax.de"
          className="text-xs font-medium text-primary hover:text-[var(--color-orange-600)] transition-colors"
        >
          Passwort vergessen?
        </a>
      </div>
      <PasswordInput
        id="password"
        value={value}
        onChange={onChange}
        placeholder="••••••••"
        required
        autoComplete="current-password"
        disabled={disabled}
        error={error}
      />
    </div>
  );
};

const SubmitButton = ({ isLoading }: { isLoading: boolean }) => {
  return (
    <Button type="submit" size="lg" variant="default" className="w-full" disabled={isLoading}>
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Anmelden...
        </>
      ) : (
        'Anmelden'
      )}
    </Button>
  );
};

const Divider = () => {
  return (
    <div className="relative">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-border" />
      </div>
      <div className="relative flex justify-center text-xs uppercase">
        <span className="bg-card px-2 text-muted-foreground">Oder</span>
      </div>
    </div>
  );
};

const SSOButton = () => {
  const handleSSOClick = () => {
    // SSO integration not implemented yet
    // This button is present for UI completeness per Stitch design
    console.log('SSO login clicked (not implemented)');
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="lg"
      className="w-full"
      onClick={handleSSOClick}
      disabled
    >
      <MicrosoftIcon />
      <span className="ml-2">Mit Microsoft anmelden</span>
    </Button>
  );
};

const MicrosoftIcon = () => {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="7.5" height="7.5" fill="#F25022" />
      <rect x="8.5" width="7.5" height="7.5" fill="#7FBA00" />
      <rect y="8.5" width="7.5" height="7.5" fill="#00A4EF" />
      <rect x="8.5" y="8.5" width="7.5" height="7.5" fill="#FFB900" />
    </svg>
  );
};
