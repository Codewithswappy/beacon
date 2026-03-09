import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { LogoutButton } from "@/components/auth/LogoutButton";

export default async function Dashboard() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-black text-white p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="flex items-center justify-between pb-6 border-b border-white/10">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-gray-400 mt-1">Welcome back to Beacon.</p>
          </div>
          <LogoutButton />
        </header>

        <section className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md">
          <h2 className="text-xl font-semibold mb-4 text-gray-200">
            Account Profile
          </h2>

          <div className="space-y-4">
            <div className="flex flex-col gap-1">
              <span className="text-sm text-gray-400">Email ID</span>
              <span className="text-lg font-medium">{user.email}</span>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-sm text-gray-400">User ID</span>
              <span className="font-mono text-sm break-all bg-black/50 p-2 rounded-lg border border-white/5 w-fit">
                {user.id}
              </span>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-sm text-gray-400">Last Sign In</span>
              <span className="text-base">
                {user.last_sign_in_at
                  ? new Date(user.last_sign_in_at).toLocaleString()
                  : "N/A"}
              </span>
            </div>
          </div>
        </section>

        <section className="grid sm:grid-cols-2 gap-4">
          <div className="bg-linear-to-br from-indigo-900/40 to-black border border-indigo-500/20 rounded-2xl p-6 hover:border-indigo-500/40 transition-colors">
            <h3 className="font-semibold text-lg text-indigo-300">
              Quick Actions
            </h3>
            <p className="text-indigo-200/60 mt-2 text-sm">
              Configure your settings or explore features.
            </p>
          </div>
          <div className="bg-linear-to-br from-purple-900/40 to-black border border-purple-500/20 rounded-2xl p-6 hover:border-purple-500/40 transition-colors">
            <h3 className="font-semibold text-lg text-purple-300">
              Analytics Space
            </h3>
            <p className="text-purple-200/60 mt-2 text-sm">
              Dive deep into your application stats.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
