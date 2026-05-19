import * as React from 'react';
import { KVMark } from '../components/brand/KVMark';

export default function DeletarDados() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#ededed] 
                    flex items-center justify-center px-6">
      <div className="max-w-lg text-center">
        <div className="flex items-center justify-center gap-3 mb-8">
          <KVMark size={36} />
          <span className="font-bold text-xl tracking-tight">
            KV<span style={{ color: 'var(--brand)' }}>ision</span>
          </span>
        </div>
        <h1 className="text-2xl font-bold mb-4">Solicitação de Exclusão de Dados</h1>
        <p className="text-[#888] mb-6">
          Para solicitar a exclusão dos seus dados do KVision, 
          envie um e-mail para:
        </p>
        <a href="mailto:contato@kvgroupbr.com.br" 
           className="text-[#FBB03B] text-lg font-medium hover:underline">
          contato@kvgroupbr.com.br
        </a>
        <p className="text-[#555] text-sm mt-6">
          Sua solicitação será processada em até 30 dias úteis.
        </p>
      </div>
    </div>
  );
}
