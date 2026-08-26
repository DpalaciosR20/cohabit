import { createClient } from "@supabase/supabase-js";

// Cliente de solo-lectura para Realtime — nunca se usa para leer/escribir datos
// directamente (eso sigue pasando por nuestra API), solo para escuchar cambios.
export const supabaseBrowser = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
