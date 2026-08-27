"use client";

import Link from "next/link";
import { useActionState } from "react";
import { CloudSun, MailCheck, TriangleAlert } from "lucide-react";
import { register, type AuthActionState } from "../actions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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

export function RegisterForm() {
  const [state, formAction, pending] = useActionState(register, initialState);

  // Nach dem Abschicken nur noch die neutrale Bestätigung zeigen (AC-1, EC-1).
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
        <CloudSun className="mx-auto size-10 text-primary" aria-hidden />
        <CardTitle className="text-2xl">Konto anlegen</CardTitle>
        <CardDescription>
          Plane deine Aktivitäten nach dem Wetter — kostenlos.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {state.error && (
          <Alert variant="destructive">
            <TriangleAlert className="size-4" aria-hidden />
            <AlertDescription>{state.error}</AlertDescription>
          </Alert>
        )}
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
          <div className="space-y-2">
            <Label htmlFor="password">Passwort</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              aria-describedby="password-hint"
              aria-invalid={!!state.fieldErrors?.password}
            />
            <p id="password-hint" className="text-sm text-muted-foreground">
              Mindestens 8 Zeichen.
            </p>
            {state.fieldErrors?.password && (
              <p className="text-sm text-destructive">
                {state.fieldErrors.password[0]}
              </p>
            )}
          </div>
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Wird angelegt …" : "Konto anlegen"}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="justify-center text-sm text-muted-foreground">
        Schon ein Konto?&nbsp;
        <Link
          href="/login"
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          Anmelden
        </Link>
      </CardFooter>
    </Card>
  );
}
