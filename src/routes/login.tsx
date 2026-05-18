import * as React from 'react';
import { useNavigate, Navigate } from 'react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Alert, AlertDescription } from '../components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { KVMark } from '../components/brand/KVMark';

export default function Login() {
  const navigate = useNavigate();
  const { isAuthenticated, login, isLoggingIn } = useAuth();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [errorMsg, setErrorMsg] = React.useState('');

  // Se já autenticado, redireciona para admin
  if (isAuthenticated) {
    return <Navigate to="/admin" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    
    if (!email || !password) {
      setErrorMsg('Preencha os campos obrigatórios.');
      return;
    }

    try {
      await login({ email, password });
      navigate('/admin', { replace: true });
    } catch (err: any) {
      console.error("Login erro:", err);
      setErrorMsg(err?.message || 'Credenciais inválidas. Verifique seu e-mail e senha.');
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-muted/20 p-4">
      <Card className="w-full max-w-[400px]">
        <CardHeader className="text-center space-y-2 pb-8">
          <div className="flex flex-col items-center gap-3">
            <KVMark size={48} />
            <span className="font-bold text-2xl tracking-tight" style={{ color: 'var(--text-primary)' }}>
              KV<span style={{ color: 'var(--kvmark-color)' }}>ision</span>
            </span>
            <p className="text-sm text-(--text-secondary)">
              Entre com suas credenciais para acessar a administração
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {errorMsg && (
              <Alert variant="destructive" className="py-3">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="ml-2 font-medium">
                  {errorMsg}
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="gestor@kv.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                disabled={isLoggingIn}
                className="focus-visible:ring-1 focus-visible:ring-[var(--brand)] focus-visible:border-[var(--brand)]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                disabled={isLoggingIn}
                className="focus-visible:ring-1 focus-visible:ring-[var(--brand)] focus-visible:border-[var(--brand)]"
              />
            </div>
            <button 
               type="submit" 
               className="btn-brand w-full h-11 text-[14px] disabled:opacity-50 disabled:cursor-not-allowed mt-4" 
               disabled={isLoggingIn}
            >
              {isLoggingIn ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
