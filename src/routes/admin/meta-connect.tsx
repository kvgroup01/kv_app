import * as React from 'react';
import { useSearchParams, useNavigate } from 'react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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
import { Check, CheckCircle2, FileSpreadsheet, Facebook, ChevronRight } from 'lucide-react';

async function fetchMetaAccounts() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  
  const { data, error } = await supabase
    .from('meta_accounts')
    .select('*')
    .eq('user_id', user.id);
  if (error) throw error;
  return data.map((d: any) => ({ ...d, $id: d.id }));
}

async function saveMetaAccounts(accounts: any[]) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado');
  
  const accountsWithUser = accounts.map(acc => ({
    ...acc,
    user_id: user.id,
  }));
  
  const { data, error } = await supabase
    .from('meta_accounts')
    .upsert(accountsWithUser, { 
      onConflict: 'meta_account_id,user_id',
      ignoreDuplicates: false 
    })
    .select();
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
  const [selectedBM, setSelectedBM] = React.useState<BusinessManager | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [selectedAccounts, setSelectedAccounts] = React.useState<string[]>([]);
  const [step, setStep] = React.useState<'connect' | 'loading_accounts' | 'select' | 'done'>('connect');

  const queryClient = useQueryClient();
  const { data: connectedAccounts = [], isLoading: loadingConnected } = 
    useQuery({
      queryKey: ['meta_accounts'],
      queryFn: fetchMetaAccounts,
      staleTime: 1000 * 60 * 5, // 5 minutos de cache
    });

  // Google Sheets state
  const { data: clientes } = useClientes();
  const atualizarCliente = useAtualizarCliente();
  const [selectedClienteId, setSelectedClienteId] = React.useState('');
  const [spreadsheetId, setSpreadsheetId] = React.useState('');
  const [isSavingSheets, setIsSavingSheets] = React.useState(false);

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
      '/api/auth-meta-login?mode=ads',
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
    try {
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
      queryClient.invalidateQueries({ queryKey: ['meta_accounts'] });
      // Voltar para tela inicial
      setStep('connect');
      setToken(null);
      setSelectedBM(null);
      setSelectedAccounts([]);
      setBms([]);
      toast.success('Conta conectada com sucesso!');
    } catch (err: any) {
      toast.error('Erro ao salvar contas: ' + err.message);
    }
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
          <h1 className="text-2xl md:text-[28px] font-bold text-(--text-primary)">Integrações</h1>
          <p className="text-[14px] text-(--text-secondary) mt-1">Conecte suas ferramentas e fontes de dados.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          {/* SEÇÃO 1: Meta Ads */}
          <Card className="bg-(--card-bg) border-(--card-border) shadow-sm rounded-xl flex flex-col overflow-hidden">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3 flex-nowrap">
                <img src="https://upload.wikimedia.org/wikipedia/commons/0/05/Meta_Platforms_Inc._logo_%28cropped%29.svg" alt="Meta" style={{ height: 24, width: 'auto' }} className="shrink-0" />
                <span className="font-semibold text-lg text-(--text-primary) whitespace-nowrap">Meta Ads</span>
                {loadingConnected ? (
                   <Badge variant="secondary" className="ml-auto shrink-0 bg-transparent text-transparent shadow-none border-none animate-pulse rounded-full w-20 h-6"></Badge>
                ) : connectedAccounts.length > 0 ? (
                  <Badge variant="default" className="ml-auto shrink-0 bg-green-500/10 text-green-500 hover:bg-green-500/20 shadow-none border-none rounded-full text-xs px-3 py-1 font-medium">Conectado</Badge>
                ) : (
                  <Badge variant="secondary" className="ml-auto shrink-0 bg-muted text-muted-foreground shadow-none rounded-full text-xs px-3 py-1 font-medium">Não conectado</Badge>
                )}
              </div>
            </CardHeader>
            
            <div className="h-[1px] w-full bg-(--card-border)" />
            
            <CardContent className="flex-1 space-y-6 pt-6">
              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-[13px]">
                  Erro: {error}
                </div>
              )}
              
              <p className="text-[14px] text-(--text-secondary) leading-relaxed">
                Sincronize campanhas, métricas e criativos automaticamente via Graph API do Meta.
              </p>
              
              <ul className="text-[13px] text-(--text-tertiary) space-y-3">
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" /> Campanhas, conjuntos e criativos</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" /> Métricas diárias por criativo</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" /> Token válido por 60 dias</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" /> Sincronização sob demanda</li>
              </ul>

              {loadingConnected ? (
                <div className="space-y-3 pt-2">
                  {[1,2].map(i => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-(--card-border) animate-pulse">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-(--card-hover) rounded-full" />
                        <div className="space-y-2">
                          <div className="h-3 w-32 bg-(--card-hover) rounded" />
                          <div className="h-3 w-20 bg-(--card-hover) rounded" />
                        </div>
                      </div>
                      <div className="h-7 w-20 bg-(--card-hover) rounded" />
                    </div>
                  ))}
                </div>
              ) : connectedAccounts.length > 0 ? (
                <div className="space-y-3 pt-2">
                  {connectedAccounts.map((acc) => (
                    <div key={acc.$id} className="flex items-center justify-between p-3 bg-background/50 border border-(--card-border) rounded-lg shadow-sm transition-colors hover:border-(--text-tertiary)">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-[14px] shrink-0">
                          {acc.nome.substring(0, 1).toUpperCase()}
                        </div>
                        <div className="truncate">
                          <p className="text-[14px] font-medium text-(--text-primary) truncate">{acc.nome}</p>
                          <p className="text-[12px] text-(--text-secondary) font-mono mt-0.5">{acc.meta_account_id}</p>
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="text-red-500 hover:text-red-600 hover:bg-red-500/10 h-8 text-[12px] font-medium px-3"
                        onClick={async () => {
                          await deleteMetaAccount(acc.$id);
                          queryClient.invalidateQueries({ queryKey: ['meta_accounts'] });
                        }}
                      >
                        Desconectar
                      </Button>
                    </div>
                  ))}
                  
                  <div className="pt-4 mt-auto">
                    <Button
                      variant="outline"
                      onClick={handleConnect}
                      className="w-full border-(--card-border) text-(--text-primary) hover:bg-background h-11"
                    >
                      Adicionar conta
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="pt-4 mt-auto">
                  <button
                    onClick={handleConnect}
                    className="flex items-center gap-0 rounded-lg overflow-hidden hover:opacity-90 transition-opacity w-full shadow-sm"
                    style={{ fontFamily: 'Inter, sans-serif' }}
                  >
                    <div className="flex items-center justify-center shrink-0" style={{ backgroundColor: '#1877F2', width: '48px', height: '48px' }}>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="20" height="20">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                      </svg>
                    </div>
                    <div className="flex items-center justify-center flex-1" style={{ backgroundColor: '#1877F2', height: '48px', color: 'white', fontSize: '14px', fontWeight: '500', borderLeft: '1px solid rgba(255,255,255,0.2)' }}>
                      Continuar com Facebook
                    </div>
                  </button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* SEÇÃO 2: Google Sheets */}
          <Card className="bg-(--card-bg) border-(--card-border) shadow-sm rounded-xl flex flex-col overflow-hidden">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3 flex-nowrap">
                <img src="https://upload.wikimedia.org/wikipedia/commons/3/30/Google_Sheets_logo_%282014-2020%29.svg" alt="Google Sheets" style={{ height: 24, width: 'auto' }} className="shrink-0" />
                <CardTitle className="text-[18px] font-semibold text-(--text-primary) whitespace-nowrap">Google Sheets</CardTitle>
                <Badge variant="default" className="ml-auto shrink-0 bg-green-500/10 text-green-500 hover:bg-green-500/20 shadow-none border-none rounded-full text-xs px-3 py-1 font-medium">Disponível</Badge>
              </div>
            </CardHeader>
            
            <div className="h-[1px] w-full bg-(--card-border)" />
            
            <CardContent className="flex-1 space-y-6 pt-6">
              <p className="text-[14px] text-(--text-secondary) leading-relaxed">
                Vincule uma planilha Google para importar leads e métricas de um cliente específico.
              </p>

              <div className="space-y-5 pt-2">
                <div className="space-y-2">
                  <Label className="text-[13px] font-medium text-(--text-primary)">Selecione o Cliente</Label>
                  <Select value={selectedClienteId} onValueChange={setSelectedClienteId}>
                    <SelectTrigger className="bg-background border-(--card-border) h-11 rounded-lg w-full">
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
                  <Label className="text-[13px] font-medium text-(--text-primary)">ID da Planilha Google</Label>
                  <Input 
                    placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms" 
                    className="bg-background border-(--card-border) h-11 font-mono text-[13px] rounded-lg w-full"
                    value={spreadsheetId}
                    onChange={e => setSpreadsheetId(e.target.value)}
                    disabled={!selectedClienteId}
                  />
                  <p className="text-[12px] text-(--text-tertiary) mt-1.5 ml-1">
                    Encontrado na URL entre <span className="font-mono bg-background px-1 py-0.5 rounded border border-(--card-border)">/d/</span> e <span className="font-mono bg-background px-1 py-0.5 rounded border border-(--card-border)">/edit</span>
                  </p>
                </div>
              </div>

              <div className="pt-6 mt-auto">
                <Button 
                  className="w-full bg-green-600 hover:bg-green-700 text-white h-11 rounded-lg font-medium"
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
          <h2 className="text-xl font-semibold">
            {!selectedBM ? 'Selecionar Business Manager' : 'Selecionar contas de anúncio'}
          </h2>
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

        {!selectedBM && bms.length > 0 && (
          <div className="space-y-3">
            {bms.map(bm => (
              <div 
                key={bm.id}
                onClick={() => setSelectedBM(bm)}
                className="p-4 rounded-xl border border-(--card-border) bg-(--card-bg) cursor-pointer hover:border-blue-500 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-(--text-primary)">{bm.name}</p>
                    <p className="text-sm text-(--text-secondary) mt-0.5">
                      {bm.adAccounts.length} conta(s) de anúncio
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-(--text-tertiary)" />
                </div>
              </div>
            ))}
          </div>
        )}

        {selectedBM && (
          <Card className="bg-(--card-bg) border-(--card-border)">
            <CardHeader className="flex flex-row items-center gap-4 space-y-0">
              <Button variant="ghost" size="icon" onClick={() => setSelectedBM(null)} className="h-8 w-8 shrink-0">
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6.85355 3.14645C7.04882 3.34171 7.04882 3.65829 6.85355 3.85355L3.70711 7H12.5C12.7761 7 13 7.22386 13 7.5C13 7.77614 12.7761 8 12.5 8H3.70711L6.85355 11.1464C7.04882 11.3417 7.04882 11.6583 6.85355 11.8536C6.65829 12.0488 6.34171 12.0488 6.14645 11.8536L2.14645 7.85355C1.95118 7.65829 1.95118 7.34171 2.14645 7.14645L6.14645 3.14645C6.34171 2.95118 6.65829 2.95118 6.85355 3.14645Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path></svg>
              </Button>
              <div>
                 <CardTitle className="text-base">{selectedBM.name}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {selectedBM.adAccounts.length === 0 && (
                <p className="text-sm text-muted-foreground">Nenhuma conta de anúncio.</p>
              )}
              {selectedBM.adAccounts.map(acc => (
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
        )}

        <div className="flex gap-3 pt-4">
          <Button
            variant="outline"
            className="border-(--card-border) text-(--text-secondary) hover:text-(--text-primary) hover:bg-background h-11 px-6"
            onClick={() => selectedBM ? setSelectedBM(null) : setStep('connect')}
          >
            {selectedBM ? '← Voltar' : 'Cancelar'}
          </Button>
          
          {selectedBM && (
            <Button
              className="flex-1 bg-blue-600 hover:bg-blue-500 text-white h-11"
              disabled={selectedAccounts.length === 0}
              onClick={handleSave}
            >
              Salvar {selectedAccounts.length > 0 
                ? `${selectedAccounts.length} conta${selectedAccounts.length > 1 ? 's' : ''}` 
                : ''}
            </Button>
          )}
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
