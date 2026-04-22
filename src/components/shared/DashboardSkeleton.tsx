import * as React from 'react';
import { Card, CardContent, CardHeader } from '../ui/card';
import { Skeleton } from '../ui/skeleton';
import type { TipoCampanha } from '../../lib/types';

interface DashboardSkeletonProps {
  tipo: TipoCampanha;
}

export function DashboardSkeleton({ tipo }: DashboardSkeletonProps) {
  // Ajuste do grid de cards baseado no tipo de campanha
  const cardsCount = tipo === 'whatsapp' ? 5 : 6; 

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      {/* Skeleton Top Settings (Picker + etc) */}
      <div className="flex items-center justify-between space-y-2 mb-8">
        <Skeleton className="h-8 w-[250px]" />
        <Skeleton className="h-10 w-[300px]" />
      </div>

      {/* Row 1: Cards Métrica */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
        {Array.from({ length: cardsCount }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-4 rounded-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-[100px] mb-1" />
              <Skeleton className="h-3 w-[60px]" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Row 2: Funnel + Chart */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-3">
          <CardHeader>
            <Skeleton className="h-5 w-1/3 mb-1" />
            <Skeleton className="h-3 w-1/4" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-4/5" />
            <Skeleton className="h-8 w-3/5" />
            <Skeleton className="h-8 w-2/5" />
            <Skeleton className="h-8 w-1/4" />
          </CardContent>
        </Card>
        <Card className="col-span-4">
          <CardHeader>
            <Skeleton className="h-5 w-1/4 mb-1" />
            <Skeleton className="h-3 w-1/3" />
          </CardHeader>
          <CardContent className="pl-2">
            <Skeleton className="h-[250px] w-full" />
          </CardContent>
        </Card>
      </div>

      {/* Row 3: Table Campanhas */}
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-[200px]" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </CardContent>
      </Card>

      {/* Row 4: Grid de Criativos */}
      <div className="space-y-4">
        <Skeleton className="h-5 w-[150px] mt-4" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <Skeleton className="h-[120px] w-full rounded-t-xl rounded-b-none" />
              <CardContent className="pt-4 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <div className="flex justify-between pt-2">
                  <Skeleton className="h-5 w-[60px]" />
                  <Skeleton className="h-5 w-[60px]" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Row 5: Tabelas Ranking */}
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-5 w-[200px]" />
            </CardHeader>
            <CardContent className="space-y-3">
              {Array.from({ length: 4 }).map((_, j) => (
                <div key={j} className="flex justify-between items-center bg-muted/20 p-2 rounded-md">
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-[50px] rounded-full" />
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
