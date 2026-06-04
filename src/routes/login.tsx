import * as React from 'react';
import { useNavigate, Navigate } from 'react-router';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { AlertCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { KVMark } from '../components/brand/KVMark';

export default function Login() {
  const navigate = useNavigate();
  const { isAuthenticated, login, isLoggingIn } = useAuth();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [errorMsg, setErrorMsg] = React.useState('');

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
    <div className="min-h-screen w-full flex items-center justify-center bg-(--content-bg) p-4">

      {/* Card central */}
      <div className="w-full max-w-[380px] bg-(--card-bg) border border-(--card-border) rounded-[20px] overflow-hidden">

        {/* Faixa de marca no topo */}
        <div className="h-1 w-full bg-[#FBB03B]" />

        <div className="px-8 pt-10 pb-10">

          {/* Logo + título */}
          <div className="flex flex-col items-center gap-4 mb-10">
            <div className="flex items-center justify-center w-14 h-14 rounded-[14px] bg-(--sidebar-bg) border border-(--card-border)">
              <KVMark size={28} color="#FBB03B" />
            </div>
            <div className="text-center">
              <h1
                className="text-[22px] font-semibold text-(--text-primary)"
                style={{ letterSpacing: '-0.374px' }}
              >
                KV<span style={{ color: 'var(--kvmark-color)' }}>ision</span>
              </h1>
              <p className="text-[13px] text-(--text-tertiary) mt-1">
                Acesse sua conta para continuar
              </p>
            </div>
          </div>

          {/* Formulário */}
          <form onSubmit={handleSubmit} className="space-y-4">

            {errorMsg && (
              <div className="flex items-start gap-2.5 bg-red-500/8 border border-red-500/20 rounded-[10px] px-3.5 py-3">
                <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                <p className="text-[13px] text-red-400 leading-snug">{errorMsg}</p>
              </div>
            )}

            <div className="space-y-1.5">
              <Label
                htmlFor="email"
                className="text-[12px] font-semibold text-(--text-secondary) uppercase tracking-wider"
              >
                E-mail
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="gestor@kvgroup.com.br"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                disabled={isLoggingIn}
                className="h-10 text-[14px] rounded-[10px] border-(--card-border) bg-(--content-bg) focus-visible:ring-1 focus-visible:ring-[#FBB03B] focus-visible:border-[#FBB03B]"
              />
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="password"
                className="text-[12px] font-semibold text-(--text-secondary) uppercase tracking-wider"
              >
                Senha
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                disabled={isLoggingIn}
                className="h-10 text-[14px] rounded-[10px] border-(--card-border) bg-(--content-bg) focus-visible:ring-1 focus-visible:ring-[#FBB03B] focus-visible:border-[#FBB03B]"
              />
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="btn-brand w-full h-10 mt-2 text-[14px]"
            >
              {isLoggingIn ? 'Entrando...' : 'Entrar'}
            </button>

          </form>

        </div>

        {/* Footer */}
        <div className="px-8 py-4 border-t border-(--card-border) text-center">
          <p className="text-[11px] text-(--text-tertiary)">
            KV Group © {new Date().getFullYear()} — Todos os direitos reservados
          </p>
        </div>

      </div>
    </div>
  );
}
