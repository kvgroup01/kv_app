import * as React from 'react';
import { KVMark } from '../components/brand/KVMark';

export default function Privacidade() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#ededed] py-16 px-6">
      <div className="max-w-3xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center gap-3 mb-12">
          <KVMark size={36} />
          <span className="font-bold text-xl tracking-tight">
            KV<span style={{ color: 'var(--brand)' }}>ision</span>
          </span>
        </div>

        <h1 className="text-3xl font-bold mb-2">Política de Privacidade</h1>
        <p className="text-[#888] mb-10">Última atualização: 18 de maio de 2026</p>

        <div className="space-y-8 text-[#ccc] leading-relaxed">

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">1. Informações que Coletamos</h2>
            <p>O KVision coleta informações necessárias para o funcionamento da plataforma, incluindo:</p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-[#aaa]">
              <li>Dados de conta: nome, e-mail e senha para autenticação</li>
              <li>Dados de anúncios: métricas e informações de campanhas do Meta Ads</li>
              <li>Dados de perfis: informações públicas de perfis do Instagram conectados</li>
              <li>Dados de uso: logs de acesso e interações com a plataforma</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">2. Como Usamos as Informações</h2>
            <p>Utilizamos as informações coletadas para:</p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-[#aaa]">
              <li>Fornecer e melhorar os serviços da plataforma</li>
              <li>Exibir métricas e relatórios de campanhas publicitárias</li>
              <li>Sincronizar dados com a API do Meta Ads</li>
              <li>Garantir a segurança e integridade da conta</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">3. Compartilhamento de Dados</h2>
            <p>Não vendemos, alugamos ou compartilhamos suas informações pessoais com terceiros, exceto:</p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-[#aaa]">
              <li>Meta Platforms (Facebook/Instagram) — para autenticação e acesso à API</li>
              <li>Supabase — banco de dados seguro para armazenamento das informações</li>
              <li>Vercel — hospedagem da aplicação</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">4. Dados do Meta e Instagram</h2>
            <p>
              Ao conectar sua conta do Facebook/Instagram ao KVision, autorizamos o acesso 
              às suas campanhas, métricas e publicações exclusivamente para exibição dentro 
              da plataforma. Não armazenamos tokens de acesso de forma permanente sem 
              consentimento explícito do usuário.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">5. Segurança</h2>
            <p>
              Utilizamos criptografia e boas práticas de segurança para proteger suas 
              informações. O acesso aos dados é restrito apenas aos usuários autorizados 
              de cada conta, implementado via Row Level Security (RLS) no banco de dados.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">6. Seus Direitos</h2>
            <p>Você tem o direito de:</p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-[#aaa]">
              <li>Acessar, corrigir ou excluir seus dados pessoais</li>
              <li>Revogar o acesso do KVision à sua conta do Meta a qualquer momento</li>
              <li>Solicitar a exclusão completa da sua conta</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">7. Exclusão de Dados</h2>
            <p>
              Para solicitar a exclusão dos seus dados, entre em contato pelo e-mail: 
              <span className="text-[#FBB03B] ml-1">contato@kvgroupbr.com.br</span>
            </p>
            <p className="mt-2">
              Também é possível solicitar a exclusão diretamente pelo Facebook em: 
              <span className="text-[#FBB03B] ml-1">
                kvision.kvgroupbr.com.br/deletar-dados
              </span>
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">8. Contato</h2>
            <p>
              Em caso de dúvidas sobre esta política, entre em contato:
            </p>
            <p className="mt-2 text-[#FBB03B]">contato@kvgroupbr.com.br</p>
            <p className="text-[#888]">KV Group — kvgroupbr.com.br</p>
          </section>

        </div>

        <div className="mt-16 pt-8 border-t border-[#1f1f1f] text-center text-[#555] text-sm">
          © 2026 KVision — KV Group. Todos os direitos reservados.
        </div>
      </div>
    </div>
  );
}
