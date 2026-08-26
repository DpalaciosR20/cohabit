import Link from "next/link";
import { auth } from "@/auth";
import { getUserHouseholdMembership } from "@/lib/households";
import { SignOutButton } from "@/components/sign-out-button";

export default async function Home() {
  const session = await auth();

  if (!session?.user) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-6 p-6 text-center">
        <h1 className="text-3xl font-semibold">Cohabit</h1>
        <p>No has iniciado sesión.</p>
        <div className="flex gap-4">
          <Link href="/signin" className="rounded bg-black px-4 py-2 text-white">
            Iniciar sesión
          </Link>
          <Link href="/signup" className="rounded border px-4 py-2">
            Crear cuenta
          </Link>
        </div>
      </main>
    );
  }

  const membership = await getUserHouseholdMembership(session.user.id);

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-6 p-6 text-center">
      <h1 className="text-3xl font-semibold">Cohabit</h1>

      <p>
        Sesión iniciada como <strong>{session.user.name}</strong> (
        {session.user.email})
      </p>

      {membership ? (
        <div className="flex flex-col items-center gap-2">
          <p>
            Hogar: <strong>{membership.household.name}</strong>
          </p>
          <p className="text-sm text-zinc-600">
            Código de invitación:{" "}
            <code className="rounded bg-zinc-100 px-1.5 py-0.5">
              {membership.household.inviteCode}
            </code>
          </p>
        </div>
      ) : (
        <Link href="/household" className="rounded bg-black px-4 py-2 text-white">
          Configura tu hogar
        </Link>
      )}

      <SignOutButton />
    </main>
  );
}
