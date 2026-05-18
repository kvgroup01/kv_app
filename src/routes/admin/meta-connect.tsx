import * as React from 'react';
import { useSearchParams, useNavigate } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { supabase } from '../../lib/supabase';
import { useClientes, useAtualizarCliente } from '../../hooks/useClientes';
import type { MetaAccount } from '../../lib/types';
import { toast } from 'sonner';
import { Check, CheckCircle2, FileSpreadsheet, Facebook } from 'lucide-react';

async function fetchMetaAccounts() {
  const { data, error } = await supabase.from('meta_accounts').select('*');
  if (error) throw error;
  return data.map((d: any) => ({ ...d, $id: d.id }));
}

async function saveMetaAccounts(accounts: any[]) {
  const { data, error } = await supabase.from('meta_accounts').insert(accounts).select();
  if (error) throw error;
  return data;
}

async function deleteMetaAccount(id: string) {
  const { error } = await supabase.from('meta_accounts').delete().eq('id', id);
  if (error) throw error;
  return true;
}

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

export default function IntegracoesPage() {
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

  const [connectedAccounts, setConnectedAccounts] = React.useState<MetaAccount[]>([]);
  const [loadingConnected, setLoadingConnected] = React.useState(true);

  // Google Sheets state
  const { data: clientes } = useClientes();
  const atualizarCliente = useAtualizarCliente();
  const [selectedClienteId, setSelectedClienteId] = React.useState('');
  const [spreadsheetId, setSpreadsheetId] = React.useState('');
  const [isSavingSheets, setIsSavingSheets] = React.useState(false);

  React.useEffect(() => {
    fetchMetaAccounts()
      .then(setConnectedAccounts)
      .catch(console.error)
      .finally(() => setLoadingConnected(false));
  }, []);

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

  const handleSave = async () => {
    const accountsToSave = bms
      .flatMap(bm => bm.adAccounts)
      .filter(acc => selectedAccounts.includes(acc.id))
      .map(acc => ({
        meta_account_id: acc.account_id,
        nome: acc.name,
        meta_access_token: token!,
        expires_in: expiresIn || undefined,
      }));

    await saveMetaAccounts(accountsToSave);
    setStep('done');
  };

  const handleSaveSheets = () => {
    if (!selectedClienteId || !spreadsheetId) return;
    setIsSavingSheets(true);
    
    atualizarCliente.mutate({
      id: selectedClienteId,
      data: { spreadsheet_id: spreadsheetId }
    }, {
      onSuccess: () => {
        toast.success('Planilha vinculada com sucesso!');
        setSpreadsheetId('');
      },
      onError: (err) => {
        toast.error('Erro ao vincular planilha: ' + err.message);
      },
      onSettled: () => {
        setIsSavingSheets(false);
      }
    });
  };

  // Preenche input se cliente for selecionado e já tiver ID
  React.useEffect(() => {
    if (selectedClienteId) {
      const cliente = clientes?.find(c => (c.id || c.$id) === selectedClienteId);
      if (cliente && cliente.spreadsheet_id) {
        setSpreadsheetId(cliente.spreadsheet_id);
      } else {
        setSpreadsheetId('');
      }
    }
  }, [selectedClienteId, clientes]);


  // Tela inicial
  if (step === 'connect' && !token) {
    return (
      <div className="max-w-5xl mx-auto mt-8 p-6 space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-(--text-primary)">Integrações</h1>
          <p className="text-(--text-secondary) mt-1">Conecte suas ferramentas e fontes de dados automatizadas.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* SEÇÃO 1: Meta Ads */}
          <Card className="bg-(--card-bg) border-(--card-border) shadow-premium flex flex-col">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-600/10 rounded-xl flex items-center justify-center">
                    <Facebook className="h-5 w-5 text-blue-600" />
                  </div>
                  <CardTitle className="text-xl">Meta Ads</CardTitle>
                </div>
                {connectedAccounts.length > 0 ? (
                  <Badge variant="default" className="bg-green-500/10 text-green-500 hover:bg-green-500/20 shadow-none border-none">Conectado</Badge>
                ) : (
                  <Badge variant="secondary" className="bg-muted text-muted-foreground shadow-none">Não conectado</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="flex-1 space-y-6">
              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded text-red-400 text-sm">
                  Erro: {error}
                </div>
              )}
              
              <p className="text-[14px] text-(--text-secondary)">
                Conecte sua conta do Facebook para sincronizar campanhas, métricas e criativos automaticamente.
              </p>
              
              <ul className="text-[13px] text-(--text-tertiary) space-y-2">
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /> Acesso às suas Business Managers</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /> Contas de anúncio vinculadas</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /> Campanhas, conjuntos e criativos</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /> Token válido por 60 dias</li>
              </ul>

              {connectedAccounts.length > 0 && (
                <div className="space-y-3 mt-4 border-t border-(--card-border) pt-4">
                  <p className="text-[12px] font-medium text-(--text-secondary) uppercase tracking-wider mb-2">Contas Ativas</p>
                  {connectedAccounts.map((acc) => (
                    <div key={acc.$id} className="flex items-center justify-between p-3 bg-background/50 border border-(--card-border) rounded-lg">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-xs shrink-0">
                          {acc.nome.substring(0, 1).toUpperCase()}
                        </div>
                        <div className="truncate">
                          <p className="text-[13px] font-medium text-(--text-primary) truncate">{acc.nome}</p>
                          <p className="text-[11px] text-(--text-tertiary)">ID: {acc.meta_account_id}</p>
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="text-red-500 hover:text-red-600 hover:bg-red-500/10 h-8 text-[12px]"
                        onClick={async () => {
                          await deleteMetaAccount(acc.$id);
                          setConnectedAccounts(prev => prev.filter(a => a.$id !== acc.$id));
                        }}
                      >
                        Desconectar
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-4 mt-auto">
                <button
                  onClick={handleConnect}
                  className="flex items-center gap-0 rounded-lg overflow-hidden hover:opacity-90 transition-opacity w-full shadow-sm"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  <div className="flex items-center justify-center shrink-0" style={{ backgroundColor: '#1877F2', width: '48px', height: '48px' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="24" height="24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  </div>
                  <div className="flex items-center justify-center flex-1" style={{ backgroundColor: '#1877F2', height: '48px', color: 'white', fontSize: '14px', fontWeight: '500', borderLeft: '1px solid rgba(255,255,255,0.2)' }}>
                    {connectedAccounts.length > 0 ? "Adicionar Outra Conta" : "Continuar com Facebook"}
                  </div>
                </button>
              </div>
            </CardContent>
          </Card>

          {/* SEÇÃO 2: Google Sheets */}
          <Card className="bg-(--card-bg) border-(--card-border) shadow-premium flex flex-col">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center">
                  <FileSpreadsheet className="h-5 w-5 text-green-600" />
                </div>
                <CardTitle className="text-xl">Google Sheets</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="flex-1 space-y-6">
              <p className="text-[14px] text-(--text-secondary)">
                Conecte uma planilha para importar dados de leads, investimentos adicionais e métricas automaticamente para um cliente específico.
              </p>

              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label className="text-[13px] text-(--text-secondary)">Selecione o Cliente</Label>
                  <Select value={selectedClienteId} onValueChange={setSelectedClienteId}>
                    <SelectTrigger className="bg-background border-(--card-border) h-11">
                      <SelectValue placeholder="Escolha um cliente..." />
                    </SelectTrigger>
                    <SelectContent className="bg-(--card-bg) border-(--card-border)">
                      {clientes?.map(c => (
                        <SelectItem key={c.id || c.$id} value={c.id || c.$id}>{c.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-[13px] text-(--text-secondary)">ID da Planilha Google</Label>
                  <Input 
                    placeholder="Ex: 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms" 
                    className="bg-background border-(--card-border) h-11 font-mono text-[13px]"
                    value={spreadsheetId}
                    onChange={e => setSpreadsheetId(e.target.value)}
                    disabled={!selectedClienteId}
                  />
                  <p className="text-[11px] text-(--text-tertiary) italic mt-1">
                    O ID é encontrado na URL da planilha entre /d/ e /edit.
                  </p>
                </div>
              </div>

              <div className="pt-4 mt-auto">
                <Button 
                  className="w-full bg-green-600 hover:bg-green-700 text-white h-11"
                  disabled={!selectedClienteId || !spreadsheetId || isSavingSheets}
                  onClick={handleSaveSheets}
                >
                  {isSavingSheets ? 'Salvando...' : 'Vincular Planilha'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Tela de loading
  if (loading || step === 'loading_accounts') {
    return (
      <div className="max-w-lg mx-auto mt-24 p-8 text-center space-y-4">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-(--text-secondary)">Buscando suas contas de anúncio...</p>
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
          <Card className="bg-(--card-bg) border-(--card-border)">
            <CardContent className="pt-6 text-center text-(--text-secondary) text-sm">
              Nenhuma Business Manager encontrada para esta conta.
            </CardContent>
          </Card>
        )}

        {bms.map(bm => (
          <Card key={bm.id} className="bg-(--card-bg) border-(--card-border)">
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
                      : 'border-(--card-border) hover:border-(--text-tertiary)'
                  }`}
                >
                  <div>
                    <p className="text-[14px] font-medium text-(--text-primary)">{acc.name}</p>
                    <p className="text-[12px] text-(--text-secondary)">ID: {acc.account_id} • {acc.currency}</p>
                  </div>
                  <Badge variant={acc.account_status === 1 ? 'default' : 'secondary'} className={acc.account_status === 1 ? 'bg-green-500/10 text-green-500' : 'bg-muted text-muted-foreground'}>
                    {acc.account_status === 1 ? 'Ativa' : 'Inativa'}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}

        <div className="flex gap-3 pt-4">
          <Button
            variant="outline"
            className="border-(--card-border) text-(--text-secondary) hover:text-(--text-primary) hover:bg-background h-11 px-6"
            onClick={() => navigate('/admin')}
          >
            Cancelar
          </Button>
          <Button
            className="flex-1 bg-blue-600 hover:bg-blue-500 text-white h-11"
            disabled={selectedAccounts.length === 0}
            onClick={handleSave}
          >
            Salvar Meta Ads {selectedAccounts.length > 0 ? `(${selectedAccounts.length} conta${selectedAccounts.length > 1 ? 's' : ''})` : ''}
          </Button>
        </div>
      </div>
    );
  }

  // Tela de sucesso
  return (
    <div className="max-w-lg mx-auto mt-24 p-6">
      <Card className="bg-(--card-bg) border-(--card-border) shadow-premium">
        <CardContent className="pt-8 pb-8 text-center space-y-6">
          <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto">
            <Check className="h-8 w-8 text-green-500" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-(--text-primary)">Contas conectadas!</h2>
            <p className="text-[14px] text-(--text-secondary) mt-2 max-w-sm mx-auto">
              {selectedAccounts.length} conta{selectedAccounts.length > 1 ? 's' : ''} de anúncio do Meta vinculada{selectedAccounts.length > 1 ? 's' : ''} com sucesso.
              O token é válido por 60 dias.
            </p>
          </div>
          <Button className="w-full bg-(--text-primary) text-(--body-bg) hover:bg-(--text-secondary) h-11" onClick={() => navigate('/admin')}>
            Voltar para Dashboard
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
