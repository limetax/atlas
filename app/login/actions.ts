"use server";

import { createSupabaseServerClient } from "@/lib/infrastructure/supabase.server";
import { redirect } from "next/navigation";

/**
 * Server action for login
 * Note: Currently using client-side auth via AuthService
 * This is kept for potential future use with server actions
 */
export async function loginAction(
  email: string,
  password: string,
  redirectTo: string = "/"
) {
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return {
      success: false,
      error: translateAuthError(error.message),
    };
  }

  redirect(redirectTo);
}

/**
 * Server action for logout
 */
export async function logoutAction() {
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.auth.signOut();

  if (error) {
    return {
      success: false,
      error: "Abmeldung fehlgeschlagen",
    };
  }

  redirect("/login");
}

/**
 * Translate auth errors to German
 */
function translateAuthError(message: string): string {
  const errorMessages: Record<string, string> = {
    "Invalid login credentials":
      "Ungültige Anmeldedaten. Bitte überprüfen Sie E-Mail und Passwort.",
    "Email not confirmed":
      "E-Mail-Adresse nicht bestätigt. Bitte überprüfen Sie Ihr Postfach.",
    "User not found": "Benutzer nicht gefunden.",
    "Invalid email": "Ungültige E-Mail-Adresse.",
    "Signup disabled":
      "Registrierung ist deaktiviert. Bitte kontaktieren Sie den Administrator.",
    "Email rate limit exceeded":
      "Zu viele Anmeldeversuche. Bitte versuchen Sie es später erneut.",
  };

  return errorMessages[message] || `Anmeldefehler: ${message}`;
}
