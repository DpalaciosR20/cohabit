import Link from "next/link";
import { auth } from "@/auth";
import { SignOutButton } from "@/components/sign-out-button";

export default async function Home() {
  const session = await auth();

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-6 p-6 text-center">
      <h1 className="text-3xl font-semibold">Cohabit</h1>

      {session?.user ? (
        <>
          <p>
            Sesión iniciada como <strong>{session.user.name}</strong> (
            {session.user.email})
          </p>
          <SignOutButton />
        </>
      ) : (
        <>
          <p>No has iniciado sesión.</p>
          <div className="flex gap-4">
            <Link href="/signin" className="rounded bg-black px-4 py-2 text-white">
              Iniciar sesión
            </Link>
            <Link href="/signup" className="rounded border px-4 py-2">
              Crear cuenta
            </Link>
          </div>
        </>
      )}
    </main>
  );
}
