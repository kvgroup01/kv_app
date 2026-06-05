import * as React from 'react';
import QRCode from 'qrcode';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Check, ChevronsUpDown, Trash2, Plus, QrCode } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '../ui/command';
import { fmtBRL, gerarPayloadPix } from '../../lib/utils';
import type { Cliente } from '../../lib/types';
import { cn } from '../../lib/utils';

export interface OrcamentoFormData {
  cliente_id?: string;
  cliente_nome: string;
  itens: { descricao: string; quantidade: number; valor_unitario: number }[];
  pix_chave: string;
}

interface OrcamentoFormProps {
  clientes: Cliente[];
  isLoading?: boolean;
  onSubmit: () => void;
  // Estado controlado pelo pai
  modoCliente: 'existente' | 'avulso';
  setModoCliente: (v: 'existente' | 'avulso') => void;
  clienteSelecionado: string;
  setClienteSelecionado: (v: string) => void;
  nomeAvulso: string;
  setNomeAvulso: (v: string) => void;
  itens: { descricao: string; quantidade: number; valor_unitario: number }[];
  setItens: React.Dispatch<React.SetStateAction<{ descricao: string; quantidade: number; valor_unitario: number }[]>>;
  pixChave: string;
  setPixChave: (v: string) => void;
}

export function OrcamentoForm({
  clientes, isLoading, onSubmit,
  modoCliente, setModoCliente,
  clienteSelecionado, setClienteSelecionado,
  nomeAvulso, setNomeAvulso,
  itens, setItens,
  pixChave, setPixChave,
}: OrcamentoFormProps) {
  const [comboboxOpen, setComboboxOpen] = React.useState(false);
  const [qrCodeImg, setQrCodeImg] = React.useState('');

  const totalCalculado = itens.reduce((acc, item) => acc + (item.quantidade * item.valor_unitario), 0);

  React.useEffect(() => {
    if (pixChave && totalCalculado > 0) {
      const payload = gerarPayloadPix(pixChave, totalCalculado, "Gestor KVision", "SÃO PAULO");
      QRCode.toDataURL(payload, { width: 250, margin: 2, color: { dark: '#000000', light: '#ffffff' } }, (err, url) => {
        if (!err) setQrCodeImg(url);
      });
    } else {
      setQrCodeImg('');
    }
  }, [pixChave, totalCalculado]);

  const handleAddItem = () => {
    setItens(prev => [...prev, { descricao: '', quantidade: 1, valor_unitario: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    setItens(prev => {
      const next = [...prev];
      next.splice(index, 1);
      return next.length === 0 ? [{ descricao: '', quantidade: 1, valor_unitario: 0 }] : next;
    });
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    setItens(prev => prev.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    ));
  };

  return (
    <div className="space-y-6">
      {/* Seção 1 */}
      <Card className="bg-(--card-bg) border-(--card-border) rounded-[14px]">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-[15px] font-semibold text-(--text-primary)" style={{ letterSpacing: '-0.2px' }}>
              1. Identificação do Cliente
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              className="text-[12px] text-(--text-tertiary) hover:text-(--text-primary) h-7 px-3 rounded-[7px]"
              onClick={() => setModoCliente(modoCliente === 'existente' ? 'avulso' : 'existente')}
            >
              Mudar para {modoCliente === 'existente' ? 'Avulso' : 'Cadastrado'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {modoCliente === 'existente' ? (
            <div className="space-y-2">
              <label className="text-sm font-medium">Selecione o Cliente</label>
              <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" aria-expanded={comboboxOpen} className="w-full justify-between border-(--card-border)">
                    {clienteSelecionado
                      ? clientes.find((c) => c.$id === clienteSelecionado)?.nome
                      : "Buscar cliente armazenado..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0 bg-(--card-bg) border-(--card-border)" align="start">
                  <Command>
                    <CommandInput placeholder="Procurar cliente..." />
                    <CommandList>
                      <CommandEmpty>Nenhum cliente encontrado.</CommandEmpty>
                      <CommandGroup>
                        {clientes.map((cliente) => (
                          <CommandItem
                            key={cliente.$id}
                            value={cliente.nome}
                            onSelect={() => { setClienteSelecionado(cliente.$id); setComboboxOpen(false); }}
                          >
                            <Check className={cn("mr-2 h-4 w-4", clienteSelecionado === cliente.$id ? "opacity-100" : "opacity-0")} />
                            {cliente.nome}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          ) : (
            <div className="space-y-2">
              <label className="text-sm font-medium">Nome do Cliente Avulso</label>
              <Input
                placeholder="Digite o nome do cliente"
                value={nomeAvulso}
                onChange={(e) => setNomeAvulso(e.target.value)}
                className="bg-(--card-hover) border-(--card-border)"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Seção 2 */}
      <Card className="bg-(--card-bg) border-(--card-border) rounded-[14px]">
        <CardHeader>
          <CardTitle className="text-[15px] font-semibold text-(--text-primary)" style={{ letterSpacing: '-0.2px' }}>2. Itens do Serviço</CardTitle>
          <CardDescription className="text-[13px] text-(--text-tertiary)">Adicione as descrições e custos do pacote</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border border-(--card-border) rounded-[10px] overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[200px]">Descrição do Serviço</TableHead>
                  <TableHead className="w-[100px]">Qtd.</TableHead>
                  <TableHead className="w-[150px]">Valor Unitário</TableHead>
                  <TableHead className="w-[150px]">Subtotal</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {itens.map((item, idx) => (
                  <TableRow key={idx}>
                    <TableCell>
                      <Input
                        placeholder="Ex: Gestão de Tráfego"
                        value={item.descricao}
                        onChange={(e) => handleItemChange(idx, 'descricao', e.target.value)}
                        className="bg-(--card-hover) border-(--card-border)"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number" min="1"
                        value={item.quantidade}
                        onChange={(e) => handleItemChange(idx, 'quantidade', parseInt(e.target.value) || 0)}
                        className="bg-(--card-hover) border-(--card-border)"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number" placeholder="0.00"
                        value={item.valor_unitario}
                        onChange={(e) => handleItemChange(idx, 'valor_unitario', parseFloat(e.target.value) || 0)}
                        className="bg-(--card-hover) border-(--card-border)"
                      />
                    </TableCell>
                    <TableCell className="font-medium bg-(--card-hover) text-(--text-primary)">
                      {fmtBRL(item.quantidade * item.valor_unitario)}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleRemoveItem(idx)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex justify-between items-end">
            <Button variant="outline" onClick={handleAddItem} className="border-(--card-border) text-(--text-secondary) hover:text-(--text-primary) hover:bg-(--card-hover) rounded-[8px] text-[13px] h-9">
              <Plus className="mr-2 h-4 w-4" /> Adicionar Item
            </Button>
            <div className="bg-(--card-hover) border border-(--card-border) rounded-[10px] p-4 flex items-center gap-6">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-(--text-tertiary)">Total a Pagar</span>
              <span className="text-[28px] font-semibold text-(--text-primary)" style={{ letterSpacing: '-0.5px' }}>{fmtBRL(totalCalculado)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Seção 3 */}
      <Card className="bg-(--card-bg) border-(--card-border) rounded-[14px]">
        <CardHeader>
          <CardTitle className="text-[15px] font-semibold text-(--text-primary)" style={{ letterSpacing: '-0.2px' }}>3. Configuração de Recebimento</CardTitle>
          <CardDescription className="text-[13px] text-(--text-tertiary)">O QR Code será gerado e embutido no link público do orçamento</CardDescription>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">Chave PIX do Gestor</label>
            <Input
              placeholder="CPF, CNPJ, Email ou Telefone"
              value={pixChave}
              onChange={(e) => setPixChave(e.target.value)}
              autoComplete="off"
              className="bg-(--card-hover) border-(--card-border)"
            />
            <p className="text-xs text-(--text-tertiary) mt-2">
              A chave será automaticamente vinculada ao payload PIX com base no valor total apurado acima.
            </p>
            <Button className="btn-brand w-full mt-6 h-11 text-[14px]" onClick={onSubmit} disabled={isLoading}>
              {isLoading ? 'Gerando...' : 'Gerar Link de Orçamento'}
            </Button>
          </div>

          <div className="flex flex-col items-center justify-center border-2 border-dashed border-(--card-border) rounded-[12px] p-6 bg-(--card-hover)">
            {qrCodeImg ? (
              <div className="flex flex-col items-center space-y-4">
                <div className="p-2 bg-white rounded-xl shadow-sm border border-(--card-border)">
                  <img src={qrCodeImg} alt="QR Code" className="w-[180px] h-[180px]" />
                </div>
                <span className="text-[12px] font-medium text-emerald-500">Preview do QR Code</span>
              </div>
            ) : (
              <div className="flex flex-col items-center text-(--text-tertiary) space-y-3 opacity-50">
                <QrCode className="h-12 w-12" />
                <span className="text-[13px] font-medium">Aguardando dados...</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}