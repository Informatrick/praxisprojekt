"use client";

import Link from "next/link";
import { useActionState } from "react";
import { CloudSun, TriangleAlert } from "lucide-react";
import { login, type AuthActionState } from "../actions";
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

export function LoginForm({ invalidLink }: { invalidLink: boolean }) {
  const [state, formAction, pending] = useActionState(login, initialState);

  return (
    <Card>
      <CardHeader className="text-center">
        <CloudSun className="mx-auto size-10 text-primary" aria-hidden />
        <CardTitle className="text-2xl">Anmelden</CardTitle>
        <CardDescription>
          Melde dich an, um deine Aktivitäten und Vorschläge zu sehen.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {invalidLink && (
          <Alert>
            <TriangleAlert className="size-4" aria-hidden />
            <AlertTitle>Link ungültig oder abgelaufen</AlertTitle>
            <AlertDescription>
              Fordere einen neuen an: über{" "}
              <Link href="/forgot-password" className="underline underline-offset-4">
                Passwort vergessen
              </Link>{" "}
              oder eine erneute{" "}
              <Link href="/register" className="underline underline-offset-4">
                Registrierung
              </Link>
              .
            </AlertDescription>
          </Alert>
        )}
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
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Passwort</Label>
              <Link
                href="/forgot-password"
                className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              >
                Passwort vergessen?
              </Link>
            </div>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              aria-invalid={!!state.fieldErrors?.password}
            />
            {state.fieldErrors?.password && (
              <p className="text-sm text-destructive">
                {state.fieldErrors.password[0]}
              </p>
            )}
          </div>
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Wird angemeldet …" : "Anmelden"}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="justify-center text-sm text-muted-foreground">
        Noch kein Konto?&nbsp;
        <Link
          href="/register"
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          Registrieren
        </Link>
      </CardFooter>
    </Card>
  );
}
