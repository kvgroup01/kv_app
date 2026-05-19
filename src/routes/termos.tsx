import * as React from 'react';
import { KVMark } from '../components/brand/KVMark';

export default function Termos() {
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

        <h1 className="text-3xl font-bold mb-2">Termos de Uso</h1>
        <p className="text-[#888] mb-10">Última atualização: 18 de maio de 2026</p>

        <div className="space-y-8 text-[#ccc] leading-relaxed">

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">1. Aceitação dos Termos</h2>
            <p>
              Ao acessar e utilizar o KVision, você concorda com estes Termos de Uso. 
              Se não concordar com qualquer parte destes termos, não utilize a plataforma.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">2. Descrição do Serviço</h2>
            <p>
              O KVision é uma plataforma SaaS de gestão de tráfego pago desenvolvida pela 
              KV Group, que permite a visualização e gestão de campanhas do Meta Ads, 
              dashboards de métricas e acompanhamento de perfis do Instagram.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">3. Uso da Plataforma</h2>
            <p>Ao utilizar o KVision, você concorda em:</p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-[#aaa]">
              <li>Fornecer informações verdadeiras no cadastro</li>
              <li>Não compartilhar suas credenciais de acesso</li>
              <li>Utilizar a plataforma apenas para fins legais e legítimos</li>
              <li>Não tentar acessar dados de outros usuários</li>
              <li>Respeitar os Termos de Uso da Meta Platforms</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">4. Integração com Meta</h2>
            <p>
              O KVision utiliza a API oficial do Meta (Facebook/Instagram). Ao conectar 
              sua conta, você autoriza o acesso às informações necessárias para o 
              funcionamento da plataforma. Você pode revogar esse acesso a qualquer 
              momento nas configurações do Facebook.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">5. Propriedade Intelectual</h2>
            <p>
              Todo o conteúdo, design e funcionalidades do KVision são propriedade 
              exclusiva da KV Group. É proibida a reprodução, distribuição ou 
              modificação sem autorização prévia.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">6. Limitação de Responsabilidade</h2>
            <p>
              O KVision não se responsabiliza por:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-[#aaa]">
              <li>Indisponibilidade da API do Meta</li>
              <li>Perda de dados decorrente de falhas na API do Facebook</li>
              <li>Decisões tomadas com base nas métricas exibidas</li>
              <li>Resultados de campanhas publicitárias</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">7. Cancelamento</h2>
            <p>
              Você pode cancelar sua conta a qualquer momento. Após o cancelamento, 
              seus dados serão mantidos por 30 dias e então excluídos permanentemente.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">8. Alterações nos Termos</h2>
            <p>
              Reservamo-nos o direito de modificar estes termos a qualquer momento. 
              Alterações significativas serão comunicadas por e-mail.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">9. Contato</h2>
            <p className="text-[#FBB03B]">contato@kvgroupbr.com.br</p>
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
