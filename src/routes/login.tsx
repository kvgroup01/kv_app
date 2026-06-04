import * as React from 'react';
import { useNavigate, Navigate } from 'react-router';
import { Input } from '../components/ui/input';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { KVMark, KV_P1, KV_P2 } from '../components/brand/KVMark';

export default function Login() {
  const navigate = useNavigate();
  const { isAuthenticated, login, isLoggingIn } = useAuth();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [errorMsg, setErrorMsg] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);

  if (isAuthenticated) return <Navigate to="/admin" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!email || !password) { setErrorMsg('Preencha os campos obrigatórios.'); return; }
    try {
      await login({ email, password });
      navigate('/admin', { replace: true });
    } catch (err: any) {
      setErrorMsg(err?.message || 'Credenciais inválidas. Verifique seu e-mail e senha.');
    }
  };

  return (
    <div className="min-h-screen w-full flex">

      {/* ══ PAINEL ESQUERDO — Formulário (sempre light) ══ */}
      <div
        className="flex-1 flex flex-col items-center justify-center px-6 py-12 min-h-screen"
        style={{ background: '#f5f5f7', colorScheme: 'light' }}
      >
        <div className="w-full max-w-[360px]">

          {/* Logo — só mobile */}
          <div className="flex items-center gap-2.5 mb-10 lg:hidden">
            <KVMark size={26} color="#1A1A1A" />
            <span className="font-semibold text-[17px] text-[#1A1A1A]" style={{ letterSpacing: '-0.3px' }}>
              KV<span style={{ color: '#FBB03B' }}>ision</span>
            </span>
          </div>

          {/* Título */}
          <div className="mb-8">
            <h1 className="text-[28px] font-semibold text-[#1A1A1A]" style={{ letterSpacing: '-0.374px' }}>
              Entrar
            </h1>
            <p className="text-[14px] text-[#6e6e73] mt-1.5">
              Acesse sua conta para continuar
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">

            {errorMsg && (
              <div className="flex items-start gap-2.5 rounded-[10px] px-3.5 py-3" style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)' }}>
                <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                <p className="text-[13px] text-red-500 leading-snug">{errorMsg}</p>
              </div>
            )}

            {/* E-mail */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-[11px] font-semibold text-[#6e6e73] uppercase tracking-wider">
                Endereço de e-mail
              </label>
              <input
                id="email"
                type="email"
                placeholder="gestor@kvgroup.com.br"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                disabled={isLoggingIn}
                style={{
                  width: '100%', height: 44, padding: '0 14px',
                  fontSize: 14, color: '#1A1A1A', background: '#ffffff',
                  border: '1px solid #e5e5e7', borderRadius: 10,
                  outline: 'none', fontFamily: 'inherit',
                  opacity: isLoggingIn ? 0.5 : 1,
                }}
                onFocus={e => e.target.style.borderColor = '#FBB03B'}
                onBlur={e => e.target.style.borderColor = '#e5e5e7'}
              />
            </div>

            {/* Senha */}
            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-[11px] font-semibold text-[#6e6e73] uppercase tracking-wider">
                Senha
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  disabled={isLoggingIn}
                  style={{
                    width: '100%', height: 44, padding: '0 40px 0 14px',
                    fontSize: 14, color: '#1A1A1A', background: '#ffffff',
                    border: '1px solid #e5e5e7', borderRadius: 10,
                    outline: 'none', fontFamily: 'inherit',
                    opacity: isLoggingIn ? 0.5 : 1,
                  }}
                  onFocus={e => e.target.style.borderColor = '#FBB03B'}
                  onBlur={e => e.target.style.borderColor = '#e5e5e7'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(p => !p)}
                  tabIndex={-1}
                  style={{
                    position: 'absolute', right: 12, top: '50%',
                    transform: 'translateY(-50%)', background: 'none',
                    border: 'none', cursor: 'pointer', color: '#a0a0a5',
                    display: 'flex', alignItems: 'center',
                  }}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Botão */}
            <button
              type="submit"
              disabled={isLoggingIn}
              style={{
                width: '100%', height: 44, marginTop: 4,
                background: isLoggingIn ? '#f5a623' : '#FBB03B',
                color: '#000000', border: 'none', borderRadius: 9999,
                fontSize: 14, fontWeight: 600, cursor: isLoggingIn ? 'not-allowed' : 'pointer',
                letterSpacing: '-0.2px', fontFamily: 'inherit',
                opacity: isLoggingIn ? 0.7 : 1,
                transition: 'background 150ms ease',
              }}
            >
              {isLoggingIn ? 'Entrando...' : 'Entrar'}
            </button>

          </form>

          {/* Footer */}
          <p className="text-[11px] text-[#a0a0a5] text-center mt-10">
            KV Group © {new Date().getFullYear()} — Todos os direitos reservados
          </p>

        </div>
      </div>

      {/* ══ PAINEL DIREITO — Marca (sempre dark) ══ */}
      <div className="hidden lg:flex lg:w-[52%] xl:w-[55%] relative flex-col items-start justify-end overflow-hidden p-14" style={{ background: '#0a0a0a' }}>

        {/* KVMark watermark */}
        <div
          aria-hidden
          className="absolute inset-0 flex items-center justify-center pointer-events-none select-none"
          style={{ opacity: 0.06 }}
        >
          <svg viewBox="339 774 3873 2963" className="w-[110%] h-[110%]" style={{ fill: '#ffffff' }}>
            <path d={KV_P1} />
            <path d={KV_P2} />
          </svg>
        </div>

        {/* Gradiente amarelo sutil */}
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at 80% 20%, rgba(251,176,59,0.08) 0%, transparent 60%)' }}
        />

        {/* Logo */}
        <div className="absolute top-10 left-12 flex items-center gap-2.5">
          <KVMark size={22} color="#FBB03B" />
          <span className="font-semibold text-[15px] text-white" style={{ letterSpacing: '-0.2px' }}>
            KV<span style={{ color: '#FBB03B' }}>ision</span>
          </span>
        </div>

        {/* Card de destaque */}
        <div className="relative z-10 w-full">
          <div
            className="rounded-[20px] p-8 mb-6"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)' }}
          >
            <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 mb-5" style={{ background: 'rgba(251,176,59,0.1)', border: '1px solid rgba(251,176,59,0.2)' }}>
              <div className="w-1.5 h-1.5 rounded-full bg-[#FBB03B]" />
              <span className="text-[11px] font-semibold text-[#FBB03B] uppercase tracking-wider">Plataforma KV Group</span>
            </div>

            <h2 className="text-[26px] font-semibold text-white mb-3 leading-tight" style={{ letterSpacing: '-0.374px' }}>
              Gestão inteligente<br />de tráfego pago
            </h2>
            <p className="text-[14px] leading-relaxed max-w-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
              Conecte contas Meta Ads, sincronize métricas automaticamente e visualize dashboards analíticos completos para seus clientes.
            </p>

            <div className="flex gap-6 mt-7 pt-6" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              {[
                { label: 'Dashboards', value: 'Ao vivo' },
                { label: 'Meta Ads', value: 'Integrado' },
                { label: 'Instagram', value: 'Analytics' },
              ].map((s) => (
                <div key={s.label}>
                  <p className="text-[13px] font-semibold text-white">{s.value}</p>
                  <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
