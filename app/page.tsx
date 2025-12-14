"use client";

import { SignInButton, useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { useRole } from "@/context/RoleContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const { isSignedIn } = useUser();
  const { role } = useRole();
  const router = useRouter();

  useEffect(() => {
    if (isSignedIn) {
      if (role === "student") {
        router.push("/dashboard/buyer");
      } else {
        router.push("/dashboard/seller");
      }
    }
  }, [isSignedIn, role, router]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-8">Path</h1>
      <p className="text-xl mb-8">P2P Academic Marketplace</p>

      {!isSignedIn && (
        <SignInButton mode="modal">
          <Button>Sign In with University Email</Button>
        </SignInButton>
      )}
    </main>
  );
}
