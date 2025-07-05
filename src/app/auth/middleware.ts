import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Este middleware redirecciona usuarios autenticados al dashboard
// Si está en la página de login o registro
export async function middleware() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }
}
