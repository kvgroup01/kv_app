import * as React from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { toast } from 'sonner';
import { Loader2, CheckCircle2, ChevronRight } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Card, CardContent } from '../ui/card';

interface SheetsImporterProps {
  lancamentoId: string;
  onClose: () => void;
}

const CAMPOS_LEADS = {
  nome: ['Nome', 'name', 'NOME'],
  email: ['E_mail', 'Email', 'E-mail', 'email', 'E_Mail'],
  telefone: ['DDD_Telefone', 'Telefone', 'telefone', 'DDD_telefone'],
  escolaridade: ['Escolaridade', 'ESCOLARIDADE'],
  renda: ['Renda', 'QUAL A SUA RENDA ATUAL?', 'renda'],
  utm_source: ['utm_source', 'UTM_Source', 'UTM Source'],
  utm_campaign: ['utm_campaign', 'UTM_Campaign', 'UTM Campaign'],
  utm_medium: ['utm_medium', 'UTM_Medium', 'UTM Medium'],
  utm_content: ['utm_content', 'UTM_Content'],
  utm_term: ['utm_term', 'UTM_Term'],
  data: ['Data_da_conversao', 'Data', 'data', 'DATA'],
};

const CAMPOS_PESQUISA = {
  nome: ['Nome', 'NOME', 'name'],
  telefone: ['Telefone', 'telefone', 'TELEFONE'],
  email: ['E-mail', 'Email', 'E_mail', 'email'],
  escolaridade: ['ESCOLARIDADE', 'Escolaridade'],
  renda: ['QUAL A SUA RENDA ATUAL?', 'Renda', 'renda'],
  idade: ['IDADE:', 'Idade', 'idade'],
  genero: ['GÊNERO:', 'Genero', 'Gênero', 'genero'],
  estado: ['EM QUAL ESTADO VOCÊ MORA?:', 'Estado', 'estado'],
  profissao: ['QUAL A SUA PROFISSÃO?', 'Profissão', 'profissao'],
  data: ['Submitted At', 'Data', 'data', 'DATA'],
};

function detectarMapeamento(columns: string[], campos: Record<string, string[]>) {
  const mapeamento: Record<string, string> = {};
  for (const [campo, opcoes] of Object.entries(campos)) {
    const encontrado = opcoes.find(op => columns.includes(op));
    if (encontrado) mapeamento[campo] = encontrado;
  }
  return mapeamento;
}

export function SheetsImporter({ lancamentoId, onClose }: SheetsImporterProps) {
  const [etapa, setEtapa] = React.useState(1);
  const [url, setUrl] = React.useState('');
  const [spreadsheetId, setSpreadsheetId] = React.useState('');
  const [tabs, setTabs] = React.useState<string[]>([]);
  const [abaLeads, setAbaLeads] = React.useState('');
  const [abaPesquisa, setAbaPesquisa] = React.useState('nao');
  const [previewLeads, setPreviewLeads] = React.useState<{columns: string[], rows: string[][]}>({ columns: [], rows: [] });
  const [previewPesquisa, setPreviewPesquisa] = React.useState<{columns: string[], rows: string[][]}>({ columns: [], rows: [] });
  const [mapeamentoLeads, setMapeamentoLeads] = React.useState<Record<string,string>>({});
  const [mapeamentoPesquisa, setMapeamentoPesquisa] = React.useState<Record<string,string>>({});
  const [loading, setLoading] = React.useState(false);
  const [resultado, setResultado] = React.useState<{leads: any, pesquisa: any} | null>(null);

  const steps = [
    { num: 1, title: 'Planilha' },
    { num: 2, title: 'Abas' },
    { num: 3, title: 'Mapeamento' },
    { num: 4, title: 'Importação' }
  ];

  const handleFetchTabs = async () => {
    const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    const id = match?.[1] || '';
    if (!id) {
      toast.error('URL da planilha inválida');
      return;
    }
    setSpreadsheetId(id);
    setLoading(true);
    try {
      const res = await fetch(`/api/sheets?action=list-tabs&spreadsheetId=${id}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      if (!data.tabs || data.tabs.length === 0) throw new Error('Nenhuma aba encontrada ou planilha não é pública');
      setTabs(data.tabs);
      setAbaLeads(data.tabs[0]);
      setEtapa(2);
    } catch (e: any) {
      toast.error(e.message || 'Não foi possível acessar a planilha. Verifique se ela é pública na web (Arquivo > Compartilhar > Publicar na web).');
    } finally {
      setLoading(false);
    }
  };

  const handleFetchPreview = async () => {
    if (!abaLeads) {
      toast.error('Selecione a aba de leads');
      return;
    }
    setLoading(true);
    try {
      const resLeads = await fetch(`/api/sheets?action=preview&spreadsheetId=${spreadsheetId}&sheet=${encodeURIComponent(abaLeads)}`);
      const dataLeads = await resLeads.json();
      if (dataLeads.error) throw new Error(dataLeads.error);
      setPreviewLeads(dataLeads);
      setMapeamentoLeads(detectarMapeamento(dataLeads.columns, CAMPOS_LEADS));

      if (abaPesquisa !== 'nao') {
        const resPesquisa = await fetch(`/api/sheets?action=preview&spreadsheetId=${spreadsheetId}&sheet=${encodeURIComponent(abaPesquisa)}`);
        const dataPesquisa = await resPesquisa.json();
        if (dataPesquisa.error) throw new Error(dataPesquisa.error);
        setPreviewPesquisa(dataPesquisa);
        setMapeamentoPesquisa(detectarMapeamento(dataPesquisa.columns, CAMPOS_PESQUISA));
      }

      setEtapa(3);
    } catch (e: any) {
      toast.error(e.message || 'Erro ao carregar preview das abas');
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    setLoading(true);
    setEtapa(4);
    
    let resLeads = null;
    let resPesquisa = null;
    
    try {
      if (abaLeads !== 'nao') {
        const reqL = await fetch('/api/sheets?action=import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lancamentoId,
            tipo: 'leads',
            spreadsheetId,
            sheet: abaLeads,
            mapeamento: mapeamentoLeads
          })
        });
        resLeads = await reqL.json();
        if (resLeads.error) throw new Error("Erro importando leads: " + resLeads.error);
      }

      if (abaPesquisa !== 'nao') {
        const reqP = await fetch('/api/sheets?action=import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lancamentoId,
            tipo: 'pesquisa',
            spreadsheetId,
            sheet: abaPesquisa,
            mapeamento: mapeamentoPesquisa
          })
        });
        resPesquisa = await reqP.json();
        if (resPesquisa.error) throw new Error("Erro importando pesquisa: " + resPesquisa.error);
      }

      setResultado({ leads: resLeads, pesquisa: resPesquisa });
    } catch (e: any) {
      toast.error(e.message || 'Erro durante a importação');
      setEtapa(3);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Indicador de Etapas */}
      <div className="flex items-center justify-between pb-4 border-b">
        {steps.map((s, i) => (
          <div key={s.num} className="flex items-center">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 text-xs font-bold
              ${etapa > s.num ? 'bg-primary text-primary-foreground border-primary' : 
                etapa === s.num ? 'border-primary text-primary' : 'border-muted text-muted-foreground'}`}>
              {etapa > s.num ? <CheckCircle2 className="w-5 h-5" /> : s.num}
            </div>
            <div className="ml-2 hidden sm:block">
              <span className={`text-xs font-semibold uppercase tracking-wider ${etapa >= s.num ? 'text-foreground' : 'text-muted-foreground'}`}>{s.title}</span>
            </div>
            {i < steps.length - 1 && (
              <div className={`w-8 sm:w-16 h-0.5 mx-2 sm:mx-4 ${etapa > s.num ? 'bg-primary' : 'bg-muted'}`} />
            )}
          </div>
        ))}
      </div>

      {etapa === 1 && (
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Passo 1 de 4 — Cole o link da planilha</h3>
          <p className="text-sm text-muted-foreground">
            A planilha deve estar publicada na web (Arquivo &gt; Compartilhar &gt; Publicar na web).
          </p>
          <div className="space-y-2">
            <label className="text-sm font-medium">Link do Google Sheets</label>
            <Input 
              placeholder="https://docs.google.com/spreadsheets/d/.../edit" 
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="bg-background"
            />
          </div>
          <Button onClick={handleFetchTabs} disabled={!url || loading} className="w-full">
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ChevronRight className="w-4 h-4 mr-2" />}
            Continuar
          </Button>
        </div>
      )}

      {etapa === 2 && (
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Passo 2 de 4 — Selecione as abas</h3>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Qual aba tem os LEADS?</label>
              <Select value={abaLeads} onValueChange={setAbaLeads}>
                <SelectTrigger><SelectValue placeholder="Selecione a aba de leads" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="nao">Não importar leads</SelectItem>
                  {tabs.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Qual aba tem a PESQUISA?</label>
              <Select value={abaPesquisa} onValueChange={setAbaPesquisa}>
                <SelectTrigger><SelectValue placeholder="Selecione a aba de pesquisa" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="nao">Não importar pesquisa</SelectItem>
                  {tabs.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button variant="outline" onClick={() => setEtapa(1)}>Voltar</Button>
            <Button onClick={handleFetchPreview} disabled={loading || (abaLeads === 'nao' && abaPesquisa === 'nao')}>
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ChevronRight className="w-4 h-4 mr-2" />}
              Ver preview
            </Button>
          </div>
        </div>
      )}

      {etapa === 3 && (
        <div className="space-y-6">
          <h3 className="font-semibold text-lg">Passo 3 de 4 — Confirme o mapeamento</h3>
          
          {abaLeads !== 'nao' && (
            <Card>
              <CardContent className="p-4 space-y-4">
                <h4 className="font-medium text-primary">Mapeamento de Leads ({abaLeads})</h4>
                <div className="overflow-x-auto">
                  <div className="flex gap-4 pb-2">
                    {Object.keys(CAMPOS_LEADS).map(campo => (
                      <div key={campo} className="min-w-[150px] space-y-2">
                        <label className="text-xs font-semibold font-mono bg-muted px-2 py-1 rounded block truncate">{campo}</label>
                        <Select 
                          value={mapeamentoLeads[campo] || 'nao_mapear'} 
                          onValueChange={(val) => setMapeamentoLeads(prev => ({...prev, [campo]: val === 'nao_mapear' ? '' : val}))}
                        >
                          <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Não mapear" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="nao_mapear">Não mapear</SelectItem>
                            {previewLeads.columns.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {abaPesquisa !== 'nao' && (
            <Card>
              <CardContent className="p-4 space-y-4">
                <h4 className="font-medium text-primary">Mapeamento de Pesquisa ({abaPesquisa})</h4>
                <div className="overflow-x-auto">
                  <div className="flex gap-4 pb-2">
                    {Object.keys(CAMPOS_PESQUISA).map(campo => (
                      <div key={campo} className="min-w-[150px] space-y-2">
                        <label className="text-xs font-semibold font-mono bg-muted px-2 py-1 rounded block truncate">{campo}</label>
                        <Select 
                          value={mapeamentoPesquisa[campo] || 'nao_mapear'} 
                          onValueChange={(val) => setMapeamentoPesquisa(prev => ({...prev, [campo]: val === 'nao_mapear' ? '' : val}))}
                        >
                          <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Não mapear" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="nao_mapear">Não mapear</SelectItem>
                            {previewPesquisa.columns.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex gap-2 justify-end pt-4">
            <Button variant="outline" onClick={() => setEtapa(2)}>Voltar</Button>
            <Button onClick={handleImport} disabled={loading}>
              Importar agora
            </Button>
          </div>
        </div>
      )}

      {etapa === 4 && (
        <div className="space-y-6 text-center py-8">
          {loading ? (
            <div className="flex flex-col items-center justify-center space-y-4">
              <Loader2 className="w-12 h-12 text-primary animate-spin" />
              <h3 className="font-semibold text-lg">Importando dados...</h3>
              <p className="text-sm text-muted-foreground">Isso pode levar alguns minutos dependendo do tamanho da planilha.</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="mx-auto w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-2xl">Importação Concluída</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                {resultado?.leads && (
                  <Card>
                    <CardContent className="p-4 space-y-2">
                      <h4 className="font-semibold text-primary">Leads</h4>
                      <p className="text-sm text-muted-foreground">Importados com sucesso: <strong className="text-foreground">{resultado.leads.imported}</strong></p>
                      <p className="text-sm text-muted-foreground">Pulados (duplicados): <strong className="text-foreground">{resultado.leads.skipped}</strong></p>
                      <p className="text-sm text-muted-foreground">Erros: <strong className="text-destructive text-foreground">{resultado.leads.errors}</strong></p>
                    </CardContent>
                  </Card>
                )}
                
                {resultado?.pesquisa && (
                  <Card>
                    <CardContent className="p-4 space-y-2">
                      <h4 className="font-semibold text-primary">Pesquisa</h4>
                      <p className="text-sm text-muted-foreground">Importados com sucesso: <strong className="text-foreground">{resultado.pesquisa.imported}</strong></p>
                      <p className="text-sm text-muted-foreground">Pulados (duplicados): <strong className="text-foreground">{resultado.pesquisa.skipped}</strong></p>
                      <p className="text-sm text-muted-foreground">Erros: <strong className="text-destructive text-foreground">{resultado.pesquisa.errors}</strong></p>
                    </CardContent>
                  </Card>
                )}
              </div>

              <div className="pt-6">
                <Button onClick={onClose} size="lg" className="w-full sm:w-auto">
                  Fechar
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
