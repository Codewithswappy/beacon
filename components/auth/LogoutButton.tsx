"use client";

import { createClient } from "@/lib/supabase/client";
import { IconLogout } from "@tabler/icons-react";
import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();
  const supabase = createClient();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.refresh();
  }

  return (
    <button
      onClick={handleSignOut}
      className="flex items-center gap-2 px-4 py-2 border border-white/20 rounded-lg shadow-sm bg-black/50 text-sm font-medium text-white hover:bg-black/80 hover:border-white/40 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 focus:ring-offset-gray-900 transition-all text-gray-300"
    >
      <IconLogout size={18} />
      Sign out
    </button>
  );
}
