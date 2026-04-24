/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from './components/ui/sonner';

import Login from './routes/login';
import AdminLayout from './routes/admin/_layout';
import AdminIndex from './routes/admin/index';

// Módulo de clientes
import ClientesIndex from './routes/admin/clientes/index';
import ClienteNovo from './routes/admin/clientes/novo';
import ClienteEdit from './routes/admin/clientes/$id';

// Módulos Auxiliares
import FinanceiroIndex from './routes/admin/financeiro/index';
import OrcamentosIndex from './routes/admin/orcamentos/index';
import OrcamentoNovo from './routes/admin/orcamentos/novo';
import Configuracoes from './routes/admin/configuracoes';

// Módulo de Dashboards
import DashboardsIndex from './routes/admin/dashboards/index';
import DashboardNovo from './routes/admin/dashboards/novo';
import DashboardEditor from './routes/admin/dashboards/$id/editor';

// Módulos Públicos Externos
import OrcamentoPublico from './routes/orcamento/$token';
import DashboardPublico from './routes/dashboard/$slug';
import DashboardLancamento from './routes/dashboard/$slug/$lancamento';

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/admin" replace />} />
          <Route path="/login" element={<Login />} />
          
          {/* Rotas Públicas */}
          <Route path="/orcamento/:token" element={<OrcamentoPublico />} />
          <Route path="/dashboard/:slug" element={<DashboardPublico />} />
          <Route path="/dashboard/:slug/:lancamento" element={<DashboardLancamento />} />

          {/* Rotas Privadas (Admin) */}
          <Route path="/admin" element={<AdminLayout />}>
             <Route index element={<AdminIndex />} />
             
             {/* Sub-rotas Clientes */}
             <Route path="clientes" element={<ClientesIndex />} />
             <Route path="clientes/novo" element={<ClienteNovo />} />
             <Route path="clientes/:id" element={<ClienteEdit />} />

             {/* Sub-rotas Dashboards */}
             <Route path="dashboards" element={<DashboardsIndex />} />
             <Route path="dashboards/novo" element={<DashboardNovo />} />
             <Route path="dashboards/:id/editor" element={<DashboardEditor />} />

             {/* Sub-rotas Auxiliares */}
             <Route path="financeiro" element={<FinanceiroIndex />} />
             <Route path="orcamentos" element={<OrcamentosIndex />} />
             <Route path="orcamentos/novo" element={<OrcamentoNovo />} />
             <Route path="configuracoes" element={<Configuracoes />} />
             
          </Route>
        </Routes>
      </BrowserRouter>
      <Toaster />
    </QueryClientProvider>
  );
}
