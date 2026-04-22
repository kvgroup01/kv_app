import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Input } from '../ui/input';
import { Skeleton } from '../ui/skeleton';
import { Separator } from '../ui/separator';
import { fmtNum } from '../../lib/utils';
import { Users } from 'lucide-react';

interface GruposWhatsAppProps {
  value: {
    ensino_superior: number;
    ensino_medio: number;
  };
  onChange: (data: { ensino_superior: number; ensino_medio: number }) => void;
  isLoading?: boolean;
}

export function GruposWhatsApp({ value, onChange, isLoading }: GruposWhatsAppProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-[200px]" />
          <Skeleton className="h-3 w-[150px]" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-[1px] w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  const [localState, setLocalState] = React.useState(value);

  // Sync prop changes that might happen from outside
  React.useEffect(() => {
    setLocalState(value);
  }, [value]);

  const handleChange = (field: 'ensino_superior' | 'ensino_medio', rawValue: string) => {
    const val = parseInt(rawValue, 10) || 0;
    const newState = { ...localState, [field]: val };
    setLocalState(newState);
    onChange(newState);
  };

  const total = localState.ensino_superior + localState.ensino_medio;
  const gruposFormados = Math.floor(total / 250);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Grupos de WhatsApp</CardTitle>
        <CardDescription>Entrada de leads extraídos das comunidades</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Ensino Superior
            </label>
            <Input
              type="number"
              placeholder="0"
              value={localState.ensino_superior || ''}
              onChange={(e) => handleChange('ensino_superior', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Ensino Médio
            </label>
            <Input
              type="number"
              placeholder="0"
              value={localState.ensino_medio || ''}
              onChange={(e) => handleChange('ensino_medio', e.target.value)}
            />
          </div>
        </div>

        <Separator />

        <div className="bg-muted pl-4 py-4 pr-6 rounded-lg flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
               <p className="font-semibold text-lg">{fmtNum(total)} <span className="text-sm font-normal text-muted-foreground mr-1">leads no total</span></p>
               <p className="text-sm text-muted-foreground mt-0.5">
                 {fmtNum(gruposFormados)} {gruposFormados === 1 ? 'grupo formado' : 'grupos formados'}
               </p>
            </div>
          </div>
          <div className="text-xs text-muted-foreground bg-background px-2 py-1 rounded-md border shadow-sm hidden sm:block">
            1 grupo = 250 leads
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
