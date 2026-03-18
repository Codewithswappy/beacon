"use client";

import { createClient } from "@/lib/supabase/client";
import { IconLogout } from "@tabler/icons-react";
import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();
  const supabase = createClient();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      onClick={handleSignOut}
      className="flex items-center gap-2 rounded-lg border border-white/20 bg-black/50 px-4 py-2 text-sm font-medium text-gray-300 text-white shadow-sm transition-all hover:border-white/40 hover:bg-black/80 focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 focus:ring-offset-gray-900 focus:outline-none"
    >
      <IconLogout size={18} />
      Sign out
    </button>
  );
}
