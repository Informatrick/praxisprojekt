"use client";

import Link from "next/link";
import { useActionState } from "react";
import { KeyRound, TriangleAlert } from "lucide-react";
import { updatePassword, type AuthActionState } from "../actions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: AuthActionState = {};

export function ResetPasswordForm() {
  const [state, formAction, pending] = useActionState(
    updatePassword,
    initialState
  );

  return (
    <Card>
      <CardHeader className="text-center">
        <KeyRound className="mx-auto size-10 text-primary" aria-hidden />
        <CardTitle className="text-2xl">Neues Passwort setzen</CardTitle>
        <CardDescription>
          Wähle ein neues Passwort für dein Konto.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {state.error && (
          <Alert variant="destructive">
            <TriangleAlert className="size-4" aria-hidden />
            <AlertDescription>
              {state.error}{" "}
              <Link
                href="/forgot-password"
                className="underline underline-offset-4"
              >
                Neuen Link anfordern
              </Link>
            </AlertDescription>
          </Alert>
        )}
        <form action={formAction} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="password">Neues Passwort</Label>
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
            {pending ? "Wird gespeichert …" : "Passwort speichern"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
