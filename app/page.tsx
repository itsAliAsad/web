"use client";

import WaitlistHero from "@/components/waitlist/WaitlistHero";
import WaitlistForm from "@/components/waitlist/WaitlistForm";
import WaitlistCounter from "@/components/waitlist/WaitlistCounter";
import FeaturesPreview from "@/components/waitlist/FeaturesPreview";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col">
      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12 md:py-20">
        <div className="w-full max-w-4xl mx-auto space-y-12">
          {/* Hero Section */}
          <WaitlistHero />

          {/* Waitlist Counter */}
          <div className="flex justify-center">
            <WaitlistCounter />
          </div>

          {/* Signup Form */}
          <div className="max-w-md mx-auto w-full">
            <WaitlistForm />
          </div>

          {/* Features Preview */}
          <div className="pt-8">
            <FeaturesPreview />
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-8 text-center text-sm text-muted-foreground border-t border-border/50">
        <p>
          © {new Date().getFullYear()} Peer. Made with ❤️ for students, by students.
        </p>
      </footer>
    </main>
  );
}
