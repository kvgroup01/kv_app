import * as React from "react"
import { Skeleton } from "../ui/skeleton"
import { TipoCampanha } from "../../lib/types"

export function DashboardSkeleton({ tipo }: { tipo: TipoCampanha | 'ambos' }) {
  return (
    <div className="space-y-6">
      {/* 5 ou 6 cards no topo */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full rounded-xl" />
        ))}
      </div>

      {/* Blocos lado a lado */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Skeleton className="h-[400px] w-full rounded-xl" />
        <Skeleton className="h-[400px] w-full rounded-xl" />
      </div>

      {/* Tabela Skeleton */}
      <div className="space-y-4 pt-6">
        <Skeleton className="h-10 w-[200px]" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>

      {/* Grid Criativos */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[250px] w-full rounded-xl" />
        ))}
      </div>

      {/* Tabelas de Ranking */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-12">
        <Skeleton className="h-[300px] w-full rounded-xl" />
        <Skeleton className="h-[300px] w-full rounded-xl" />
      </div>
    </div>
  )
}
