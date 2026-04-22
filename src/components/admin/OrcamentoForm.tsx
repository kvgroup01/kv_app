import * as React from 'react';
import QRCode from 'qrcode';
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
  onSubmit: (data: OrcamentoFormData) => void;
  isLoading?: boolean;
}

export function OrcamentoForm({ clientes, onSubmit, isLoading }: OrcamentoFormProps) {
  // Seção 1 states
  const [modoCliente, setModoCliente] = React.useState<'existente' | 'avulso'>('existente');
  const [clienteSelecionado, setClienteSelecionado] = React.useState<string>("");
  const [nomeAvulso, setNomeAvulso] = React.useState("");
  const [comboboxOpen, setComboboxOpen] = React.useState(false);

  // Seção 2 states
  const [itens, setItens] = React.useState([{ descricao: '', quantidade: 1, valor_unitario: 0 }]);

  // Seção 3 states
  const [pixChave, setPixChave] = React.useState("");
  const [qrCodeImg, setQrCodeImg] = React.useState("");

  const totalCalculado = itens.reduce((acc, item) => acc + (item.quantidade * item.valor_unitario), 0);

  // Gera o QRCode sempre que a chave e o valor total mudam
  React.useEffect(() => {
    if (pixChave && totalCalculado > 0) {
      const payload = gerarPayloadPix(pixChave, totalCalculado, "Gestor Dashboard KV", "SÃO PAULO");
      QRCode.toDataURL(payload, { width: 250, margin: 2, color: { dark: '#000000', light: '#ffffff' } }, (err, url) => {
        if (!err) setQrCodeImg(url);
      });
    } else {
      setQrCodeImg("");
    }
  }, [pixChave, totalCalculado]);

  const handleAddItem = () => {
    setItens([...itens, { descricao: '', quantidade: 1, valor_unitario: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    const newItens = [...itens];
    newItens.splice(index, 1);
    // Garantir que sempre tenha no minimo 1 item
    if (newItens.length === 0) {
      newItens.push({ descricao: '', quantidade: 1, valor_unitario: 0 });
    }
    setItens(newItens);
  };

  const handleItemChange = (index: number, field: keyof typeof itens[0], value: any) => {
    const newItens = [...itens];
    newItens[index] = { ...newItens[index], [field]: value };
    setItens(newItens);
  };

  const handleSubmit = () => {
    // Validations basic
    const isAvulso = modoCliente === 'avulso';
    const finalNome = isAvulso ? nomeAvulso : clientes.find(c => c.$id === clienteSelecionado)?.nome || '';
    const finalId = isAvulso ? undefined : clienteSelecionado;

    if (!finalNome || itens.length === 0 || !pixChave) {
       return; // Handle with validation toast if needed
    }

    // Clean empty items
    const itensValidos = itens.filter(i => i.descricao.trim() !== '' && i.valor_unitario > 0);
    if(itensValidos.length === 0) return;

    onSubmit({
      cliente_id: finalId,
      cliente_nome: finalNome,
      itens: itensValidos,
      pix_chave: pixChave
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>1. Identificação do Cliente</CardTitle>
            <Button 
               variant="ghost" 
               size="sm" 
               onClick={() => setModoCliente(m => m === 'existente' ? 'avulso' : 'existente')}
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
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={comboboxOpen}
                    className="w-full justify-between"
                  >
                    {clienteSelecionado
                      ? clientes.find((c) => c.$id === clienteSelecionado)?.nome
                      : "Buscar cliente armazenado..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Procurar cliente..." />
                    <CommandList>
                      <CommandEmpty>Nenhum cliente encontrado.</CommandEmpty>
                      <CommandGroup>
                        {clientes.map((cliente) => (
                          <CommandItem
                            key={cliente.$id}
                            value={cliente.nome}
                            onSelect={() => {
                              setClienteSelecionado(cliente.$id);
                              setComboboxOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                clienteSelecionado === cliente.$id ? "opacity-100" : "opacity-0"
                              )}
                            />
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
              />
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>2. Itens do Serviço</CardTitle>
          <CardDescription>Adicione as descrições e custos do pacote</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border rounded-md overflow-x-auto">
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
                      />
                    </TableCell>
                    <TableCell>
                      <Input 
                        type="number" 
                        min="1" 
                        value={item.quantidade} 
                        onChange={(e) => handleItemChange(idx, 'quantidade', parseInt(e.target.value) || 0)} 
                      />
                    </TableCell>
                    <TableCell>
                      <Input 
                        type="number" 
                        placeholder="0.00"
                        value={item.valor_unitario} 
                        onChange={(e) => handleItemChange(idx, 'valor_unitario', parseFloat(e.target.value) || 0)} 
                      />
                    </TableCell>
                    <TableCell className="font-medium bg-muted/20">
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
             <Button variant="outline" onClick={handleAddItem}>
               <Plus className="mr-2 h-4 w-4" /> Adicionar Item
             </Button>
             
             <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-center space-x-6">
                <span className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mr-4">Total a Pagar</span>
                <span className="text-3xl font-bold tracking-tight text-primary">{fmtBRL(totalCalculado)}</span>
             </div>
          </div>
        </CardContent>
      </Card>

      {/* Seção 3: PIX Checkout */}
      <Card>
        <CardHeader>
          <CardTitle>3. Configuração de Recebimento</CardTitle>
          <CardDescription>O QR Code será gerado nativamente e embutido no orçamento público</CardDescription>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">Chave PIX do Gestor</label>
            <Input 
               placeholder="CPF, CNPJ, Email ou Telefone" 
               value={pixChave} 
               onChange={(e) => setPixChave(e.target.value)} 
               autoComplete="off"
            />
            <p className="text-xs text-muted-foreground mt-2">
              A chave será automaticamente vinculada ao payload PIX com base no valor total apurado acima.
            </p>

            <Button className="w-full mt-6" size="lg" onClick={handleSubmit} disabled={isLoading || !pixChave || totalCalculado <= 0}>
               Gerar Link de Orçamento
            </Button>
          </div>

          <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-6 bg-muted/20">
              {qrCodeImg ? (
                 <div className="flex flex-col items-center space-y-4">
                   <div className="p-2 bg-white rounded-xl shadow-sm border">
                      <img src={qrCodeImg} alt="QR Code" className="w-[180px] h-[180px]" />
                   </div>
                   <span className="text-sm font-medium text-emerald-600 dark:text-emerald-500">Preview do QR Code</span>
                 </div>
              ) : (
                <div className="flex flex-col items-center text-muted-foreground space-y-3 opacity-60">
                   <QrCode className="h-16 w-16" />
                   <span className="text-sm font-medium">Aguardando dados...</span>
                </div>
              )}
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
