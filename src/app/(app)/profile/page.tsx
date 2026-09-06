import { redirect } from "next/navigation";

// Shell temporal: el tab "Perfil" del bottom nav ya apunta aquí, pero la
// fusión real (miembros del hogar + color de perfil + código de invitación +
// cerrar sesión) se construye en una PR posterior del roadmap de rediseño de
// navegación. Mientras tanto, redirige a la vista de miembros existente para
// que el tab nunca lleve a una página rota.
export default function ProfilePage() {
  redirect("/household/members");
}
