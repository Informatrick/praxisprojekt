"use client";

import Link from "next/link";
import { useActionState } from "react";
import { KeyRound, MailCheck } from "lucide-react";
import { requestPasswordReset, type AuthActionState } from "../actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: AuthActionState = {};

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(
    requestPasswordReset,
    initialState
  );

  // Immer dieselbe neutrale Bestätigung — ob das Konto existiert oder nicht (AC-9).
  if (state.success) {
    return (
      <Card>
        <CardHeader className="text-center">
          <MailCheck className="mx-auto size-10 text-primary" aria-hidden />
          <CardTitle className="text-2xl">Postfach prüfen</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground">{state.success}</p>
        </CardContent>
        <CardFooter className="justify-center text-sm text-muted-foreground">
          Zurück zur&nbsp;
          <Link
            href="/login"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Anmeldung
          </Link>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <KeyRound className="mx-auto size-10 text-primary" aria-hidden />
        <CardTitle className="text-2xl">Passwort vergessen</CardTitle>
        <CardDescription>
          Gib deine E-Mail-Adresse ein — wir schicken dir einen Link zum
          Zurücksetzen.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="email">E-Mail-Adresse</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              aria-invalid={!!state.fieldErrors?.email}
            />
            {state.fieldErrors?.email && (
              <p className="text-sm text-destructive">
                {state.fieldErrors.email[0]}
              </p>
            )}
          </div>
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Wird gesendet …" : "Link anfordern"}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="justify-center text-sm text-muted-foreground">
        Zurück zur&nbsp;
        <Link
          href="/login"
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          Anmeldung
        </Link>
      </CardFooter>
    </Card>
  );
}
