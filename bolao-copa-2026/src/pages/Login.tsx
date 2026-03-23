import { supabase } from "../lib/supabase";

export default function Login() {
  const login = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
    });
  };

  return (
    <div className="h-screen flex items-center justify-center">
      <button
        onClick={login}
        className="bg-green-700 text-white px-6 py-3 rounded-xl"
      >
        Entrar com Google
      </button>
    </div>
  );
}