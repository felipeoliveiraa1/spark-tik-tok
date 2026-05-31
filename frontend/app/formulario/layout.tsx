import * as React from "react";

/**
 * Layout publico do /formulario — sem ResponsiveShell, sem FloatingMainNav,
 * sem auth. Pagina de captacao de lead linkada na bio do TikTok.
 */
export default function FormularioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-spark-bg">
      {children}
    </div>
  );
}
