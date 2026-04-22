import * as React from 'react';
import { useNavigate, Navigate } from 'react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Button } from '../components/ui/button';
import { Alert, AlertDescription } from '../components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

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
        <CardHeader className="text-center space-y-2">
          <div className="flex justify-center mb-2">
             <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-xl">
               KV
             </div>
          </div>
          <CardTitle className="text-2xl font-bold">Dashboard KV</CardTitle>
          <CardDescription>
            Entre com suas credenciais para acessar a administração
          </CardDescription>
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
              />
            </div>
            <Button 
               type="submit" 
               className="w-full mt-4" 
               disabled={isLoggingIn}
            >
              {isLoggingIn ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
