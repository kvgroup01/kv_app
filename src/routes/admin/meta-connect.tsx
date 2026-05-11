import * as React from 'react';
import { useSearchParams, useNavigate } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';

interface AdAccount {
  id: string;
  name: string;
  account_id: string;
  currency: string;
  account_status: number;
}

interface BusinessManager {
  id: string;
  name: string;
  adAccounts: AdAccount[];
}

export default function MetaConnectPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [token, setToken] = React.useState<string | null>(searchParams.get('token'));
  const [expiresIn, setExpiresIn] = React.useState<string | null>(searchParams.get('expires_in'));
  const [userName, setUserName] = React.useState<string | null>(searchParams.get('user_name'));
  const [userEmail, setUserEmail] = React.useState<string | null>(searchParams.get('user_email'));
  const error = searchParams.get('error');

  const [bms, setBms] = React.useState<BusinessManager[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [selectedAccounts, setSelectedAccounts] = React.useState<string[]>([]);
  const [step, setStep] = React.useState<'connect' | 'loading_accounts' | 'select' | 'done'>('connect');

  // Se chegou com token, busca as BMs e contas automaticamente
  React.useEffect(() => {
    if (!token) return;
    if (step !== 'loading_accounts' && step !== 'connect') return;
    setLoading(true);
    fetch(`/api/meta-list-accounts?token=${token}`)
      .then(r => r.json())
      .then(data => {
        setBms(data.bms || []);
        setStep('select');
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token, step]);

  const handleConnect = () => {
    const width = 600;
    const height = 700;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    const popup = window.open(
      '/api/auth-meta-login',
      'meta-oauth',
      `width=${width},height=${height},left=${left},top=${top},scrollbars=yes`
    );

    // Escuta mensagem do popup quando autenticação completar
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type !== 'META_AUTH_SUCCESS') return;

      window.removeEventListener('message', handleMessage);
      popup?.close();

      // Atualiza a URL com os dados recebidos do popup
      const { token: newToken, expires_in, user_id, user_name, user_email } = event.data;
      
      // Simula o recebimento dos query params sem redirecionar
      setStep('loading_accounts');
      setUserName(user_name);
      setUserEmail(user_email);
      setToken(newToken);
      setExpiresIn(expires_in);
    };

    window.addEventListener('message', handleMessage);
  };


  const toggleAccount = (accountId: string) => {
    setSelectedAccounts(prev =>
      prev.includes(accountId)
        ? prev.filter(id => id !== accountId)
        : [...prev, accountId]
    );
  };

  const handleSave = () => {
    // Por agora salva no localStorage para usar no sistema
    // Quando implementar AppWrite, salvar na coleção meta_accounts
    const accountsToSave = bms
      .flatMap(bm => bm.adAccounts)
      .filter(acc => selectedAccounts.includes(acc.id))
      .map(acc => ({
        meta_account_id: acc.account_id,
        nome: acc.name,
        meta_access_token: token,
        expires_in: expiresIn,
      }));

    localStorage.setItem('meta_connected_accounts', JSON.stringify(accountsToSave));
    setStep('done');
  };

  // Tela inicial — botão conectar
  if (step === 'connect' && !token) {
    return (
      <div className="max-w-lg mx-auto mt-16 p-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white font-bold text-sm">f</div>
              Conectar ao Meta Ads
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded text-red-400 text-sm">
                Erro: {error}
              </div>
            )}
            <p className="text-sm text-muted-foreground">
              Conecte sua conta do Facebook para sincronizar campanhas,
              métricas e criativos automaticamente.
            </p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>✅ Acesso às suas Business Managers</li>
              <li>✅ Contas de anúncio vinculadas</li>
              <li>✅ Campanhas, conjuntos e criativos</li>
              <li>✅ Métricas diárias</li>
              <li>✅ Token válido por 60 dias</li>
            </ul>
            <Button
              className="w-full bg-blue-600 hover:bg-blue-500"
              onClick={handleConnect}
            >
              Conectar com Facebook
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Tela de loading
  if (loading || step === 'loading_accounts') {
    return (
      <div className="max-w-lg mx-auto mt-16 p-6 text-center">
        <p className="text-muted-foreground">Buscando suas contas de anúncio...</p>
      </div>
    );
  }

  // Tela de seleção de contas
  if (step === 'select') {
    return (
      <div className="max-w-2xl mx-auto mt-8 p-6 space-y-6">
        <div>
          <h2 className="text-xl font-semibold">Selecionar contas de anúncio</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Conectado como <strong>{userName}</strong> ({userEmail})
          </p>
        </div>

        {bms.length === 0 && (
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground text-sm">
              Nenhuma Business Manager encontrada para esta conta.
            </CardContent>
          </Card>
        )}

        {bms.map(bm => (
          <Card key={bm.id}>
            <CardHeader>
              <CardTitle className="text-base">{bm.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {bm.adAccounts.length === 0 && (
                <p className="text-sm text-muted-foreground">Nenhuma conta de anúncio.</p>
              )}
              {bm.adAccounts.map(acc => (
                <div
                  key={acc.id}
                  onClick={() => toggleAccount(acc.id)}
                  className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedAccounts.includes(acc.id)
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-border hover:border-muted-foreground'
                  }`}
                >
                  <div>
                    <p className="text-sm font-medium">{acc.name}</p>
                    <p className="text-xs text-muted-foreground">ID: {acc.account_id} • {acc.currency}</p>
                  </div>
                  <Badge variant={acc.account_status === 1 ? 'default' : 'secondary'}>
                    {acc.account_status === 1 ? 'Ativa' : 'Inativa'}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => navigate('/admin')}
          >
            Cancelar
          </Button>
          <Button
            className="flex-1 bg-blue-600 hover:bg-blue-500"
            disabled={selectedAccounts.length === 0}
            onClick={handleSave}
          >
            Salvar {selectedAccounts.length > 0 ? `(${selectedAccounts.length} conta${selectedAccounts.length > 1 ? 's' : ''})` : ''}
          </Button>
        </div>
      </div>
    );
  }

  // Tela de sucesso
  return (
    <div className="max-w-lg mx-auto mt-16 p-6">
      <Card>
        <CardContent className="pt-6 text-center space-y-4">
          <div className="text-4xl">✅</div>
          <h2 className="text-xl font-semibold">Contas conectadas!</h2>
          <p className="text-sm text-muted-foreground">
            {selectedAccounts.length} conta{selectedAccounts.length > 1 ? 's' : ''} de anúncio conectada{selectedAccounts.length > 1 ? 's' : ''} com sucesso.
            O token é válido por 60 dias.
          </p>
          <Button className="w-full" onClick={() => navigate('/admin')}>
            Voltar ao painel
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
