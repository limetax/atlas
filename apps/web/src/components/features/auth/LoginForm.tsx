import React, { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Input } from '@/components/ui/Input';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { Button } from '@/components/ui/Button';
import { trpc } from '@/lib/trpc';
import { useAuthToken } from '@/hooks/useAuthToken';
import { ROUTES } from '@/constants';
import { AlertCircle, Loader2 } from 'lucide-react';

export const LoginForm: React.FC = () => {
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
    <form onSubmit={handleSubmit} className="space-y-6">
      <ErrorAlert error={loginMutation.error?.message} />

      <EmailField
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={loginMutation.isPending}
        error={!!loginMutation.error}
      />

      <PasswordField
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        disabled={loginMutation.isPending}
        error={!!loginMutation.error}
      />

      <SubmitButton isLoading={loginMutation.isPending} />

      <PasswordResetInfo />
    </form>
  );
};

// Small components for better readability
const ErrorAlert = ({ error }: { error?: string }) => {
  if (!error) return null;

  return (
    <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
      <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
      <p className="text-sm">{error}</p>
    </div>
  );
};

interface EmailFieldProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled: boolean;
  error: boolean;
}

const EmailField = ({ value, onChange, disabled, error }: EmailFieldProps) => {
  return (
    <div className="space-y-2">
      <label htmlFor="email" className="block text-sm font-medium text-gray-700">
        E-Mail-Adresse
      </label>
      <Input
        id="email"
        type="email"
        value={value}
        onChange={onChange}
        placeholder="name@kanzlei.de"
        required
        autoComplete="email"
        disabled={disabled}
        error={error}
      />
    </div>
  );
};

interface PasswordFieldProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled: boolean;
  error: boolean;
}

const PasswordField = ({ value, onChange, disabled, error }: PasswordFieldProps) => {
  return (
    <div className="space-y-2">
      <label htmlFor="password" className="block text-sm font-medium text-gray-700">
        Passwort
      </label>
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
    <Button type="submit" variant="primary" size="lg" className="w-full" disabled={isLoading}>
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

const PasswordResetInfo = () => {
  return (
    <div className="text-center">
      <p className="text-sm text-gray-500">
        Passwort vergessen?{' '}
        <a
          href="mailto:support@limetax.de"
          className="text-orange-500 hover:text-orange-600 font-medium"
        >
          Kontaktieren Sie uns
        </a>
      </p>
    </div>
  );
};
