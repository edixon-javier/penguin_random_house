import { EnvVarWarning } from "@/components/env-var-warning";
import { AuthButton } from "@/components/auth-button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import FormularioInstalacion from "@/components/formulario-instalacion";
import { hasEnvVars } from "@/lib/utils";
import Link from "next/link";

export default async function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center">
      <div className="flex-1 w-full flex flex-col gap-20 items-center">
        <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16">
          <div className="w-full max-w-5xl flex justify-between items-center p-3 px-5 text-sm">
            <div className="flex gap-5 items-center font-semibold">
              <Link href={"/"}>Registro de Instalaciones PRH</Link>
            </div>
            <div className="flex gap-5 items-center font-semibold">
              {!hasEnvVars ? <EnvVarWarning /> : <AuthButton />}
              <ThemeSwitcher />
             </div>
          </div>
        </nav>
        <div className="flex-1 flex flex-col gap-20 max-w-5xl p-5 w-full">
          <div className="w-full">
            <h1 className="text-2xl font-bold mb-6 text-center">Registro de Instalación</h1>
            <FormularioInstalacion />
          </div>
        </div>
      </div>
    </main>
  );
}
