"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/elements/Input";
import { PasswordInput } from "@/components/elements/PasswordInput";
import { Button } from "@/components/elements/Button";
import { getAuthService } from "@/lib/services/auth.service";
import { AlertCircle, Loader2 } from "lucide-react";

interface LoginFormProps {
  redirectTo?: string;
}

export const LoginForm: React.FC<LoginFormProps> = ({ redirectTo = "/" }) => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const authService = getAuthService();
    const result = await authService.login(email, password);

    if (result.success) {
      router.push(redirectTo);
      router.refresh();
    } else {
      setError(result.error || "Anmeldung fehlgeschlagen");
    }

    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Error message */}
      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Email field */}
      <div className="space-y-2">
        <label
          htmlFor="email"
          className="block text-sm font-medium text-gray-700"
        >
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
          disabled={isLoading}
          error={!!error}
        />
      </div>

      {/* Password field */}
      <div className="space-y-2">
        <label
          htmlFor="password"
          className="block text-sm font-medium text-gray-700"
        >
          Passwort
        </label>
        <PasswordInput
          id="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          required
          autoComplete="current-password"
          disabled={isLoading}
          error={!!error}
        />
      </div>

      {/* Submit button */}
      <Button
        type="submit"
        variant="primary"
        size="lg"
        className="w-full"
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Anmelden...
          </>
        ) : (
          "Anmelden"
        )}
      </Button>

      {/* Password reset info */}
      <div className="text-center">
        <p className="text-sm text-gray-500">
          Passwort vergessen?{" "}
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
