"use client";

import Link from "next/link";
import { useTransition } from "react";
import { CircleUser, LogOut, UserPen } from "lucide-react";
import { logout } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function AccountMenu({
  email,
  displayName,
}: {
  email: string;
  displayName: string | null;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" aria-label="Konto-Menü öffnen">
          <CircleUser className="size-5" aria-hidden />
          <span className="max-w-40 truncate">{displayName ?? email}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="truncate font-normal text-muted-foreground">
          {email}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/profile">
            <UserPen className="size-4" aria-hidden />
            Profil
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {/* Logout als Server Action (POST). Direkt aus onSelect aufgerufen,
            nicht als Formular im Menü — ein Formular würde beim Schließen des
            Radix-Menüs ausgehängt, bevor es abschickt. */}
        <DropdownMenuItem
          disabled={pending}
          onSelect={(e) => {
            e.preventDefault();
            startTransition(() => logout());
          }}
        >
          <LogOut className="size-4" aria-hidden />
          {pending ? "Wird abgemeldet …" : "Abmelden"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
