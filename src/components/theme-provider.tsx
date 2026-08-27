"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

// Hell und Dunkel folgen der Systemeinstellung (docs/design-system.md:
// beide Themes von Anfang an; ein Umschalter ist bewusst kein AC von PROJ-1).
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="system" enableSystem>
      {children}
    </NextThemesProvider>
  );
}
