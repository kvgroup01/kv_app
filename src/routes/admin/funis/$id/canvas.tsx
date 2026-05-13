import * as React from 'react';
import { useNavigate, useParams } from 'react-router';
import { ArrowLeft, Save } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import { useFunil } from '../../../../hooks/useFunis';

export default function FunisCanvas() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { data: funil, isLoading } = useFunil(id || '');

  return (
    <div className="h-full flex flex-col -m-6 sm:-m-8">
      {/* Header */}
      <div className="p-4 border-b bg-background flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin/funis')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="font-semibold">{isLoading ? 'Carregando...' : funil?.nome}</h1>
            <p className="text-xs text-muted-foreground">Editor Visual</p>
          </div>
        </div>
        <div>
          <Button disabled>
            <Save className="h-4 w-4 mr-2" />
            Salvar
          </Button>
        </div>
      </div>

      {/* Editor Area */}
      <div className="flex-1 bg-muted/30 flex items-center justify-center relative overflow-hidden">
        {/* Placeholder grid pattern */}
        <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
        
        <div className="z-10 text-center space-y-4 max-w-md bg-background/80 p-6 rounded-xl border backdrop-blur shadow-sm">
          <h2 className="text-xl font-medium">Canvas em desenvolvimento</h2>
          <p className="text-sm text-muted-foreground">
            A área de edição visual do funil será integrada nesta página em breve.
          </p>
        </div>
      </div>
    </div>
  );
}
