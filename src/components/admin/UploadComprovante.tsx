import * as React from 'react';
import { useDropzone, FileRejection } from 'react-dropzone';
import { UploadCloud, FileIcon, X } from 'lucide-react';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { toast } from 'sonner';
import { cn } from '../../lib/utils';

interface UploadComprovanteProps {
  orcamentoId: string;
  onConfirmar: (arquivo: File, observacao: string) => void;
  isLoading?: boolean;
}

export function UploadComprovante({ orcamentoId, onConfirmar, isLoading }: UploadComprovanteProps) {
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [observacao, setObservacao] = React.useState('');

  const onDrop = React.useCallback((acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
    if (rejectedFiles.length > 0) {
      toast.error('Erro no arquivo:', {
        description: 'Verifique se o arquivo tem até 5MB e é JPG, PNG ou PDF.',
      });
      return;
    }
    if (acceptedFiles.length > 0) {
      setSelectedFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': [],
      'image/png': [],
      'application/pdf': []
    },
    maxSize: 5242880, // 5MB
    multiple: false
  } as any);

  const handleSubmit = () => {
    if (!selectedFile) return;
    onConfirmar(selectedFile, observacao);
  };

  const removeFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedFile(null);
  };

  return (
    <div className="space-y-6">
      
      {!selectedFile ? (
        <div 
          {...getRootProps()} 
          className={cn(
            "border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-colors duration-200",
            isDragActive ? "border-primary bg-primary/5" : "border-border bg-muted/50 hover:bg-muted"
          )}
        >
          <input {...getInputProps()} />
          <UploadCloud className={cn("w-12 h-12 mb-4", isDragActive ? "text-primary" : "text-muted-foreground")} />
          <h3 className="font-medium text-lg">Arraste seu comprovante aqui</h3>
          <p className="text-sm text-muted-foreground mt-1">Ou clique para selecionar nos seus arquivos</p>
          <div className="flex gap-2 mt-4 text-xs font-medium text-muted-foreground/70">
            <span>PNG</span> • <span>JPG</span> • <span>PDF</span>
          </div>
          <p className="text-xs text-muted-foreground mt-2">Tamanho máximo: 5MB</p>
        </div>
      ) : (
        <div className="border rounded-xl p-4 flex items-start justify-between bg-muted/30">
          <div className="flex items-center space-x-4 overflow-hidden">
            <div className="w-12 h-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
               <FileIcon className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <p className="font-medium text-sm truncate pr-4">{selectedFile.name}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={removeFile} className="shrink-0 text-muted-foreground hover:text-destructive">
             <X className="h-5 w-5" />
          </Button>
        </div>
      )}

      <div className="space-y-2 pt-2">
        <label className="text-sm font-medium">Observação (Opcional)</label>
        <Textarea 
           placeholder="Deixe uma mensagem para o gestor se necessário..."
           className="resize-none h-20"
           value={observacao}
           onChange={(e) => setObservacao(e.target.value)}
        />
      </div>

      <Button 
        className="w-full h-12 text-md" 
        onClick={handleSubmit} 
        disabled={!selectedFile || isLoading}
      >
        {isLoading ? "Enviando..." : "Confirmar pagamento"}
      </Button>

    </div>
  );
}
