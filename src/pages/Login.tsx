import { supabase } from '../lib/supabase';

export default function Login() {
  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });
    if (error) console.error("Erro no login:", error.message);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 relative overflow-hidden"
      style={{ background: 'linear-gradient(160deg, #F7F5F0 0%, #E8F5EF 40%, #F7F5F0 70%, #FDF5E0 100%)' }}>

      {/* Decorative circles */}
      <div className="absolute top-[-80px] right-[-60px] w-[240px] h-[240px] rounded-full opacity-20"
        style={{ background: 'radial-gradient(circle, #0A7C4E 0%, transparent 70%)' }} />
      <div className="absolute bottom-[-100px] left-[-80px] w-[300px] h-[300px] rounded-full opacity-15"
        style={{ background: 'radial-gradient(circle, #DAA520 0%, transparent 70%)' }} />

      {/* Card */}
      <div className="glass-card w-full max-w-[360px] p-8 text-center animate-scale-in">

        {/* Trophy */}
        <div className="w-20 h-20 mx-auto mb-5 rounded-full flex items-center justify-center text-4xl animate-pulse-glow"
          style={{ background: 'var(--gradient-gold)', boxShadow: '0 8px 24px rgba(218,165,32,0.25)' }}>
          🏆
        </div>

        {/* Title */}
        <h1 style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: '38px',
          letterSpacing: '2px',
          lineHeight: 1,
          background: 'var(--gradient-hero)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          Bolão Copa 2026
        </h1>

        <p style={{ color: 'var(--muted)', fontSize: '14px', marginTop: '8px', lineHeight: '1.5' }}>
          Bora jogar, amigos?<br />
          Loga aí pra gente brincar.
        </p>

        {/* Google button */}
        <button onClick={handleGoogleLogin}
          className="w-full mt-8 flex items-center justify-center gap-3 py-3.5 rounded-2xl text-sm font-semibold transition-all active:scale-95"
          style={{
            background: 'var(--gradient-hero)',
            color: '#fff',
            boxShadow: 'var(--shadow-hero)',
            border: 'none',
          }}>
          <svg width="18" height="18" viewBox="0 0 48 48">
            <path fill="#fff" d="M44.5 20H24v8.5h11.8C34.7 33.9 30.1 37 24 37c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 4.1 29.6 2 24 2 11.8 2 2 11.8 2 24s9.8 22 22 22c11 0 21-8 21-22 0-1.3-.2-2.7-.5-4z"/>
          </svg>
          Entrar com Google
        </button>
      </div>

      {/* Footer */}
      <p className="mt-8 text-xs animate-fade-in" style={{ color: 'var(--muted)', animationDelay: '0.4s' }}>
        Desenvolvido por Juliana • 2026
      </p>
    </div>
  );
}
