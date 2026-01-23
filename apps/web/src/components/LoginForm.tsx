import React, { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Input } from './elements/Input';
import { PasswordInput } from './elements/PasswordInput';
import { Button } from './elements/Button';
import { trpc } from '../lib/trpc';
import { AlertCircle, Loader2 } from 'lucide-react';

export const LoginForm: React.FC = () => {
  const navigate = useNavigate({ from: '/login' });
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: (data) => {
      localStorage.setItem('supabase_token', data.token);
      navigate({ to: '/' });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({ email, password });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Error message */}
      {loginMutation.error && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <p className="text-sm">{loginMutation.error.message}</p>
        </div>
      )}

      {/* Email field */}
      <div className="space-y-2">
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          E-Mail-Adresse
        </label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="name@kanzlei.de"
          required
          autoComplete="email"
          disabled={loginMutation.isPending}
          error={!!loginMutation.error}
        />
      </div>

      {/* Password field */}
      <div className="space-y-2">
        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
          Passwort
        </label>
        <PasswordInput
          id="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          required
          autoComplete="current-password"
          disabled={loginMutation.isPending}
          error={!!loginMutation.error}
        />
      </div>

      {/* Submit button */}
      <Button
        type="submit"
        variant="primary"
        size="lg"
        className="w-full"
        disabled={loginMutation.isPending}
      >
        {loginMutation.isPending ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Anmelden...
          </>
        ) : (
          'Anmelden'
        )}
      </Button>

      {/* Password reset info */}
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
    </form>
  );
};
