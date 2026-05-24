import { BlockDefinition } from './types';

const applyOverlay = (styles: any) => {
  if (styles.overlayColor && styles.overlayOpacity !== undefined) {
    return `<div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background-color: ${styles.overlayColor}; opacity: ${styles.overlayOpacity / 100}; pointer-events: none; z-index: 1;"></div>`;
  }
  return '';
};

const applySectionStyle = (styles: any) => {
  const bgImage = styles.backgroundImage ? \`background-image: url('\${styles.backgroundImage}'); background-size: cover; background-position: center;\` : '';
  const bgColor = styles.backgroundColor ? \`background-color: \${styles.backgroundColor};\` : '';
  const bgAttachment = styles.parallax ? \`background-attachment: fixed;\` : '';
  const pt = styles.paddingTop !== undefined ? \`padding-top: \${styles.paddingTop}px;\` : 'padding-top: 80px;';
  const pb = styles.paddingBottom !== undefined ? \`padding-bottom: \${styles.paddingBottom}px;\` : 'padding-bottom: 80px;';
  return \`\${bgImage} \${bgColor} \${bgAttachment} \${pt} \${pb} position: relative; overflow: hidden; font-family: 'Inter', sans-serif;\`;
};

export const blockRegistry: BlockDefinition[] = [
  // HEADERS
  {
    type: 'header_01',
    category: 'Headers',
    name: 'Hero Centralizado',
    thumbnail: \`<svg viewBox="0 0 100 60" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="60" fill="white" /><rect x="20" y="15" width="60" height="8" rx="2" fill="#CBD5E1" /><rect x="10" y="27" width="80" height="4" rx="2" fill="#E2E8F0" /><rect x="40" y="38" width="20" height="8" rx="4" fill="#64748B" /></svg>\`,
    fields: [
      { key: 'headline', label: 'Título principal', type: 'text', placeholder: 'Seu título aqui' },
      { key: 'subheadline', label: 'Subtítulo', type: 'textarea' },
      { key: 'cta_texto', label: 'Texto do botão', type: 'text' },
      { key: 'cta_link', label: 'Link do botão', type: 'url' },
      { key: 'cor_texto', label: 'Cor do Texto', type: 'color', defaultValue: '#ffffff' },
    ],
    defaultData: {
      headline: 'Transforme sua ideia em um negócio rentável',
      subheadline: 'O método passo a passo para lançar seu produto digital em apenas 21 dias.',
      cta_texto: 'QUERO COMEÇAR AGORA',
      cta_link: '#',
      cor_texto: '#ffffff',
    },
    defaultSectionStyles: {
      backgroundColor: '#1e293b',
      overlayColor: '#000000',
      overlayOpacity: 40,
      paddingTop: 120,
      paddingBottom: 120,
    },
    render: (data, styles) => \`
      <section style="\${applySectionStyle(styles)}">
        \${applyOverlay(styles)}
        <div style="position: relative; z-index: 2; max-width: 900px; margin: 0 auto; text-align: center; padding: 0 24px;">
          <h1 style="font-size: clamp(36px, 6vw, 64px); font-weight: 800; color: \${data.cor_texto || '#fff'}; line-height: 1.1; margin: 0 0 24px 0; letter-spacing: -0.02em;">\${data.headline}</h1>
          <p style="font-size: clamp(18px, 2.5vw, 24px); color: \${data.cor_texto || '#fff'}; opacity: 0.85; line-height: 1.5; margin: 0 0 48px 0; max-width: 700px; margin-left: auto; margin-right: auto;">\${data.subheadline}</p>
          <a href="\${data.cta_link}" style="display: inline-block; background: #3b82f6; color: white; text-decoration: none; font-size: 18px; font-weight: 700; padding: 20px 48px; border-radius: 50px; box-shadow: 0 10px 25px -5px rgba(59, 130, 246, 0.4); transition: transform 0.2s, box-shadow 0.2s;">
            \${data.cta_texto}
          </a>
        </div>
      </section>
    \`
  },
  {
    type: 'header_02',
    category: 'Headers',
    name: 'Hero Duas Colunas',
    thumbnail: \`<svg viewBox="0 0 100 60" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="60" fill="white" /><rect x="10" y="15" width="40" height="6" rx="2" fill="#CBD5E1" /><rect x="10" y="25" width="30" height="4" rx="2" fill="#E2E8F0" /><rect x="10" y="35" width="20" height="6" rx="3" fill="#64748B" /><rect x="60" y="15" width="30" height="30" rx="4" fill="#E2E8F0" /></svg>\`,
    fields: [
      { key: 'headline', label: 'Título principal', type: 'text' },
      { key: 'subheadline', label: 'Subtítulo', type: 'textarea' },
      { key: 'cta_texto', label: 'Texto do botão', type: 'text' },
      { key: 'cta_link', label: 'Link do botão', type: 'url' },
      { key: 'image_url', label: 'Imagem lateral', type: 'image' },
      { key: 'cor_texto', label: 'Cor do Texto', type: 'color', defaultValue: '#0f172a' },
    ],
    defaultData: {
      headline: 'A solução definitiva para o seu problema',
      subheadline: 'Chega de perder tempo. Comece usar nossa plataforma hoje e veja os resultados em dias, não meses.',
      cta_texto: 'EXPERIMENTAR GRÁTIS',
      cta_link: '#',
      image_url: 'https://images.unsplash.com/photo-1551434678-e076c223a692?q=80&w=2070&auto=format&fit=crop',
      cor_texto: '#0f172a',
    },
    defaultSectionStyles: {
      backgroundColor: '#f8fafc',
      paddingTop: 100,
      paddingBottom: 100,
    },
    render: (data, styles) => \`
      <section style="\${applySectionStyle(styles)}">
        \${applyOverlay(styles)}
        <div style="position: relative; z-index: 2; max-width: 1200px; margin: 0 auto; display: flex; flex-wrap: wrap; align-items: center; gap: 48px; padding: 0 24px;">
          <div style="flex: 1; min-width: 300px;">
            <h1 style="font-size: clamp(32px, 5vw, 56px); font-weight: 800; color: \${data.cor_texto || '#0f172a'}; line-height: 1.15; margin: 0 0 24px 0;">\${data.headline}</h1>
            <p style="font-size: clamp(16px, 2vw, 20px); color: \${data.cor_texto || '#0f172a'}; opacity: 0.75; line-height: 1.6; margin: 0 0 40px 0;">\${data.subheadline}</p>
            <a href="\${data.cta_link}" style="display: inline-block; background: #f97316; color: white; text-decoration: none; font-size: 16px; font-weight: 700; padding: 20px 48px; border-radius: 8px; box-shadow: 0 4px 14px rgba(249, 115, 22, 0.4);">
              \${data.cta_texto}
            </a>
          </div>
          <div style="flex: 1; min-width: 300px; text-align: right;">
            <img src="\${data.image_url}" alt="\${data.headline}" style="max-width: 100%; border-radius: 16px; box-shadow: 0 20px 40px -10px rgba(0,0,0,0.15);" />
          </div>
        </div>
      </section>
    \`
  },

  // BENEFÍCIOS
  {
    type: 'benefits_01',
    category: 'Benefícios',
    name: '3 Colunas Minimalista',
    thumbnail: \`<svg viewBox="0 0 100 60" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="60" fill="white" /><circle cx="20" cy="25" r="5" fill="#CBD5E1" /><rect x="10" y="35" width="20" height="4" rx="2" fill="#CBD5E1" /><circle cx="50" cy="25" r="5" fill="#CBD5E1" /><rect x="40" y="35" width="20" height="4" rx="2" fill="#CBD5E1" /><circle cx="80" cy="25" r="5" fill="#CBD5E1" /><rect x="70" y="35" width="20" height="4" rx="2" fill="#CBD5E1" /></svg>\`,
    fields: [
      { key: 'titulo', label: 'Título da Seção', type: 'text' },
      { key: 'cor_texto', label: 'Cor Principal do Texto', type: 'color' },
      { 
        key: 'items', 
        label: 'Benefícios', 
        type: 'array',
        subFields: [
          { key: 'icone', label: 'Emoji/Ícone', type: 'text' },
          { key: 'titulo', label: 'Título', type: 'text' },
          { key: 'texto', label: 'Descrição', type: 'textarea' }
        ]
      }
    ],
    defaultData: {
      titulo: 'Por que escolher nosso método?',
      cor_texto: '#0f172a',
      items: [
        { icone: '⚡', titulo: 'Rápido', texto: 'Resultados visíveis nos primeiros dias de aplicação do método.' },
        { icone: '🔒', titulo: 'Seguro', texto: 'Risco zero com nossa garantia incondicional de 30 dias.' },
        { icone: '💎', titulo: 'Premium', texto: 'Acesso vitalício a todo o conteúdo e atualizações futuras.' }
      ]
    },
    defaultSectionStyles: {
      backgroundColor: '#ffffff',
      paddingTop: 80,
      paddingBottom: 80,
    },
    render: (data, styles) => {
      const itemsHtml = (data.items || []).map((item: any) => \`
        <div style="flex: 1; min-width: 280px; text-align: center; padding: 24px;">
          <div style="font-size: 40px; margin-bottom: 24px; display: inline-flex; width: 80px; height: 80px; background: #f1f5f9; border-radius: 50%; align-items: center; justify-content: center;">\${item.icone}</div>
          <h3 style="font-size: 20px; font-weight: 700; color: \${data.cor_texto || '#0f172a'}; margin: 0 0 16px 0;">\${item.titulo}</h3>
          <p style="font-size: 16px; color: \${data.cor_texto || '#0f172a'}; opacity: 0.7; line-height: 1.6; margin: 0;">\${item.texto}</p>
        </div>
      \`).join('');

      return \`
        <section style="\${applySectionStyle(styles)}">
          \${applyOverlay(styles)}
          <div style="position: relative; z-index: 2; max-width: 1200px; margin: 0 auto; padding: 0 24px;">
            <h2 style="font-size: clamp(28px, 4vw, 40px); font-weight: 800; color: \${data.cor_texto || '#0f172a'}; text-align: center; margin: 0 0 64px 0;">\${data.titulo}</h2>
            <div style="display: flex; flex-wrap: wrap; gap: 32px; justify-content: center;">
              \${itemsHtml}
            </div>
          </div>
        </section>
      \`;
    }
  },
  {
    type: 'benefits_02',
    category: 'Benefícios',
    name: 'Lista Lateral c/ Imagem',
    thumbnail: \`<svg viewBox="0 0 100 60" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="60" fill="white" /><rect x="10" y="10" width="30" height="40" rx="4" fill="#E2E8F0" /><rect x="50" y="20" width="40" height="4" rx="2" fill="#CBD5E1" /><rect x="50" y="30" width="35" height="4" rx="2" fill="#CBD5E1" /><rect x="50" y="40" width="30" height="4" rx="2" fill="#CBD5E1" /></svg>\`,
    fields: [
      { key: 'titulo', label: 'Título da Seção', type: 'text' },
      { key: 'image_url', label: 'Imagem', type: 'image' },
      { key: 'cor_texto', label: 'Cor Principal', type: 'color' },
      { 
        key: 'items', 
        label: 'Tópicos', 
        type: 'array',
        subFields: [
          { key: 'titulo', label: 'Título', type: 'text' },
          { key: 'texto', label: 'Descrição', type: 'textarea' }
        ]
      }
    ],
    defaultData: {
      titulo: 'O que você vai descobrir',
      image_url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=2015&auto=format&fit=crop',
      cor_texto: '#0f172a',
      items: [
        { titulo: 'Método Validado', texto: 'Processo testado por milhares de alunos com resultados comprovados.' },
        { titulo: 'Acesso Imediato', texto: 'Material liberado no exato momento da confirmação do pagamento.' },
        { titulo: 'Suporte VIP', texto: 'Acompanhamento de perto para não deixar nenhuma dúvida para trás.' }
      ]
    },
    defaultSectionStyles: {
      backgroundColor: '#f8fafc',
      paddingTop: 100,
      paddingBottom: 100,
    },
    render: (data, styles) => {
      const itemsHtml = (data.items || []).map((item: any) => \`
        <div style="display: flex; gap: 16px; margin-bottom: 32px;">
          <div style="flex-shrink: 0; width: 32px; height: 32px; background: #3b82f6; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold;">✓</div>
          <div>
            <h3 style="font-size: 18px; font-weight: 700; color: \${data.cor_texto || '#0f172a'}; margin: 0 0 8px 0;">\${item.titulo}</h3>
            <p style="font-size: 15px; color: \${data.cor_texto || '#0f172a'}; opacity: 0.7; line-height: 1.5; margin: 0;">\${item.texto}</p>
          </div>
        </div>
      \`).join('');

      return \`
        <section style="\${applySectionStyle(styles)}">
          \${applyOverlay(styles)}
          <div style="position: relative; z-index: 2; max-width: 1200px; margin: 0 auto; display: flex; flex-wrap: wrap; gap: 64px; align-items: center; padding: 0 24px;">
            <div style="flex: 1; min-width: 300px;">
              <img src="\${data.image_url}" alt="\${data.titulo}" style="width: 100%; border-radius: 16px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);" />
            </div>
            <div style="flex: 1; min-width: 300px;">
              <h2 style="font-size: clamp(28px, 4vw, 40px); font-weight: 800; color: \${data.cor_texto || '#0f172a'}; margin: 0 0 40px 0; line-height: 1.2;">\${data.titulo}</h2>
              \${itemsHtml}
            </div>
          </div>
        </section>
      \`;
    }
  },

  // DEPOIMENTOS
  {
    type: 'testimonials_01',
    category: 'Depoimentos',
    name: 'Cards em Grade',
    thumbnail: \`<svg viewBox="0 0 100 60" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="60" fill="white" /><rect x="5" y="15" width="25" height="30" rx="3" fill="#E2E8F0" /><rect x="35" y="15" width="30" height="30" rx="3" fill="#E2E8F0" /><rect x="70" y="15" width="25" height="30" rx="3" fill="#E2E8F0" /></svg>\`,
    fields: [
      { key: 'titulo', label: 'Título da Seção', type: 'text' },
      { key: 'cor_texto', label: 'Cor Título', type: 'color' },
      { 
        key: 'items', 
        label: 'Depoimentos', 
        type: 'array',
        subFields: [
          { key: 'nome', label: 'Nome', type: 'text' },
          { key: 'papel', label: 'Cargo/Local', type: 'text' },
          { key: 'texto', label: 'Depoimento', type: 'textarea' }
        ]
      }
    ],
    defaultData: {
      titulo: 'Histórias reais de quem aplicou',
      cor_texto: '#0f172a',
      items: [
        { nome: 'Ana Silva', papel: 'Empreendedora', texto: 'Nunca pensei que seria tão simples e intuitivo. Minha vida mudou completamente depois de acessar o material.' },
        { nome: 'Carlos Mendes', papel: 'Designer', texto: 'O investimento se pagou na primeira semana. É ridículo a quantidade de valor que é entregue.' },
        { nome: 'Mariana Lima', papel: 'Mentora', texto: 'A didática é impecável. Finalmente consegui dar o próximo passo no meu negócio.' }
      ]
    },
    defaultSectionStyles: {
      backgroundColor: '#f1f5f9',
      paddingTop: 80,
      paddingBottom: 80,
    },
    render: (data, styles) => {
      const itemsHtml = (data.items || []).map((item: any) => \`
        <div style="background: white; padding: 40px 32px; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03); flex: 1; min-width: 280px; display: flex; flex-direction: column;">
          <div style="color: #f59e0b; font-size: 24px; margin-bottom: 16px;">★★★★★</div>
          <p style="font-size: 16px; color: #334155; line-height: 1.6; font-style: italic; margin: 0 0 24px 0; flex-grow: 1;">"\${item.texto}"</p>
          <div style="display: flex; align-items: center; gap: 12px; margin-top: auto;">
            <div style="width: 48px; height: 48px; background: #e2e8f0; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; color: #64748b;">\${item.nome.charAt(0)}</div>
            <div>
              <p style="font-weight: 700; color: #0f172a; margin: 0 0 4px 0; font-size: 15px;">\${item.nome}</p>
              <p style="color: #64748b; margin: 0; font-size: 13px;">\${item.papel}</p>
            </div>
          </div>
        </div>
      \`).join('');

      return \`
        <section style="\${applySectionStyle(styles)}">
          \${applyOverlay(styles)}
          <div style="position: relative; z-index: 2; max-width: 1200px; margin: 0 auto; padding: 0 24px;">
            <h2 style="font-size: clamp(28px, 4vw, 40px); font-weight: 800; color: \${data.cor_texto || '#0f172a'}; text-align: center; margin: 0 0 64px 0;">\${data.titulo}</h2>
            <div style="display: flex; flex-wrap: wrap; gap: 24px; justify-content: center;">
              \${itemsHtml}
            </div>
          </div>
        </section>
      \`;
    }
  },
  {
    type: 'testimonials_02',
    category: 'Depoimentos',
    name: 'Depoimento em Destaque',
    thumbnail: \`<svg viewBox="0 0 100 60" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="60" fill="white" /><rect x="20" y="20" width="60" height="20" rx="3" fill="#E2E8F0" /><circle cx="50" cy="45" r="5" fill="#CBD5E1" /></svg>\`,
    fields: [
      { key: 'texto', label: 'Depoimento', type: 'textarea' },
      { key: 'nome', label: 'Nome da Pessoa', type: 'text' },
      { key: 'papel', label: 'Cargo / Empresa', type: 'text' },
      { key: 'cor_fundo', label: 'Cor de Fundo Central', type: 'color' },
      { key: 'cor_texto', label: 'Cor do Texto', type: 'color' },
    ],
    defaultData: {
      texto: 'Esta foi a melhor decisão de investimento que fizemos este ano. O impacto nos resultados da empresa foi imediato e exponencial.',
      nome: 'Ricardo Gomes',
      papel: 'CEO, Empresa Inc',
      cor_fundo: '#ffffff',
      cor_texto: '#0f172a',
    },
    defaultSectionStyles: {
      backgroundColor: '#3b82f6',
      paddingTop: 120,
      paddingBottom: 120,
    },
    render: (data, styles) => \`
      <section style="\${applySectionStyle(styles)}">
        \${applyOverlay(styles)}
        <div style="position: relative; z-index: 2; max-width: 800px; margin: 0 auto; padding: 0 24px;">
          <div style="background: \${data.cor_fundo || '#ffffff'}; padding: 64px 48px; border-radius: 24px; text-align: center; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);">
            <div style="color: \${data.cor_texto || '#0f172a'}; opacity: 0.2; font-size: 80px; font-family: Georgia, serif; line-height: 0; margin-bottom: 24px;">"</div>
            <p style="font-size: clamp(20px, 3vw, 28px); color: \${data.cor_texto || '#0f172a'}; line-height: 1.5; font-weight: 500; margin: 0 0 40px 0;">\${data.texto}</p>
            <div>
              <p style="font-weight: 800; font-size: 18px; color: \${data.cor_texto || '#0f172a'}; margin: 0 0 4px 0;">\${data.nome}</p>
              <p style="color: \${data.cor_texto || '#0f172a'}; opacity: 0.6; margin: 0; font-size: 15px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">\${data.papel}</p>
            </div>
          </div>
        </div>
      </section>
    \`
  },

  // FORMULÁRIOS
  {
    type: 'forms_01',
    category: 'Formulários',
    name: 'Captura Duas Colunas',
    thumbnail: \`<svg viewBox="0 0 100 60" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="60" fill="white" /><rect x="10" y="20" width="35" height="4" fill="#CBD5E1" /><rect x="10" y="30" width="25" height="4" fill="#E2E8F0" /><rect x="60" y="10" width="30" height="40" rx="3" fill="#E2E8F0" /><rect x="65" y="15" width="20" height="4" fill="#CBD5E1" /><rect x="65" y="25" width="20" height="4" fill="#CBD5E1" /><rect x="65" y="35" width="20" height="8" rx="2" fill="#64748B" /></svg>\`,
    fields: [
      { key: 'headline', label: 'Título Principal', type: 'text' },
      { key: 'texto', label: 'Descrição Curta', type: 'textarea' },
      { key: 'form_titulo', label: 'Título do Formulário', type: 'text' },
      { key: 'cta_texto', label: 'Texto do Botão', type: 'text' },
      { key: 'cor_texto', label: 'Cor do Texto Lateral', type: 'color' },
    ],
    defaultData: {
      headline: 'Garanta sua vaga exclusiva',
      texto: 'Preencha seus dados ao lado para garantir acesso antes que as vagas acabem.',
      form_titulo: 'Cadastre-se grátis',
      cta_texto: 'LIBERAR MEU ACESSO AGORA',
      cor_texto: '#0f172a',
    },
    defaultSectionStyles: {
      backgroundColor: '#e2e8f0',
      paddingTop: 100,
      paddingBottom: 100,
    },
    render: (data, styles) => \`
      <section style="\${applySectionStyle(styles)}">
        \${applyOverlay(styles)}
        <div style="position: relative; z-index: 2; max-width: 1100px; margin: 0 auto; display: flex; flex-wrap: wrap; align-items: center; gap: 64px; padding: 0 24px;">
          <div style="flex: 1.2; min-width: 300px;">
            <h2 style="font-size: clamp(32px, 5vw, 48px); font-weight: 900; color: \${data.cor_texto || '#0f172a'}; line-height: 1.1; margin: 0 0 24px 0; letter-spacing: -1px;">\${data.headline}</h2>
            <p style="font-size: clamp(16px, 2vw, 20px); color: \${data.cor_texto || '#0f172a'}; opacity: 0.8; line-height: 1.6; margin: 0;">\${data.texto}</p>
          </div>
          <div style="flex: 1; min-width: 300px;">
            <div style="background: white; padding: 48px 32px; border-radius: 20px; box-shadow: 0 20px 40px -10px rgba(0,0,0,0.1);">
              <h3 style="font-size: 24px; font-weight: 800; color: #0f172a; text-align: center; margin: 0 0 32px 0;">\${data.form_titulo}</h3>
              <form onsubmit="event.preventDefault(); if(window.KVSubmitForm) { window.KVSubmitForm(new FormData(this)) } else { alert('Formulário enviado no modo demonstração') }" style="display: flex; flex-direction: column; gap: 16px;">
                <input type="text" name="nome" placeholder="Seu nome completo" required style="width: 100%; padding: 16px; border: 2px solid #e2e8f0; border-radius: 8px; font-size: 16px; font-family: 'Inter', sans-serif; outline: none; transition: border-color 0.2s;" onfocus="this.style.borderColor='#3b82f6'" onblur="this.style.borderColor='#e2e8f0'" />
                <input type="email" name="email" placeholder="Seu melhor e-mail" required style="width: 100%; padding: 16px; border: 2px solid #e2e8f0; border-radius: 8px; font-size: 16px; font-family: 'Inter', sans-serif; outline: none; transition: border-color 0.2s;" onfocus="this.style.borderColor='#3b82f6'" onblur="this.style.borderColor='#e2e8f0'" />
                <input type="tel" name="telefone" placeholder="WhatsApp (opcional)" style="width: 100%; padding: 16px; border: 2px solid #e2e8f0; border-radius: 8px; font-size: 16px; font-family: 'Inter', sans-serif; outline: none; transition: border-color 0.2s;" onfocus="this.style.borderColor='#3b82f6'" onblur="this.style.borderColor='#e2e8f0'" />
                <button type="submit" style="width: 100%; background: #10b981; color: white; border: none; padding: 20px; border-radius: 8px; font-size: 16px; font-weight: 800; font-family: 'Inter', sans-serif; cursor: pointer; margin-top: 8px; transition: transform 0.2s; box-shadow: 0 4px 14px rgba(16, 185, 129, 0.4);" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'">\${data.cta_texto}</button>
                <p style="text-align: center; font-size: 12px; color: #94a3b8; margin: 16px 0 0 0;">🔒 Suas informações estão 100% seguras conosco.</p>
              </form>
            </div>
          </div>
        </div>
      </section>
    \`
  },
  {
    type: 'forms_02',
    category: 'Formulários',
    name: 'Captura Central Inline',
    thumbnail: \`<svg viewBox="0 0 100 60" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="60" fill="white" /><rect x="30" y="15" width="40" height="4" fill="#CBD5E1" /><rect x="25" y="25" width="50" height="15" rx="3" fill="#E2E8F0" /><rect x="30" y="30" width="25" height="5" fill="#CBD5E1" /><rect x="60" y="30" width="10" height="5" rx="2" fill="#64748B" /></svg>\`,
    fields: [
      { key: 'headline', label: 'Título', type: 'text' },
      { key: 'cta_texto', label: 'Texto do Botão', type: 'text' },
      { key: 'cor_texto', label: 'Cor Principal do Texto', type: 'color' },
    ],
    defaultData: {
      headline: 'Inscreva-se na nossa Newsletter',
      cta_texto: 'INSCREVER',
      cor_texto: '#0f172a',
    },
    defaultSectionStyles: {
      backgroundColor: '#ffffff',
      paddingTop: 80,
      paddingBottom: 80,
    },
    render: (data, styles) => \`
      <section style="\${applySectionStyle(styles)}">
        \${applyOverlay(styles)}
        <div style="position: relative; z-index: 2; max-width: 600px; margin: 0 auto; text-align: center; padding: 0 24px;">
          <h2 style="font-size: clamp(24px, 4vw, 36px); font-weight: 800; color: \${data.cor_texto || '#0f172a'}; margin: 0 0 32px 0;">\${data.headline}</h2>
          <form onsubmit="event.preventDefault(); if(window.KVSubmitForm) { window.KVSubmitForm(new FormData(this)) } else { alert('Formulário enviado no modo demonstração') }" style="display: flex; flex-direction: column; gap: 12px;">
            <div style="display: flex; gap: 8px; flex-wrap: wrap;">
              <input type="email" name="email" placeholder="Digite seu melhor e-mail..." required style="flex: 1; min-width: 250px; padding: 18px 24px; border: 2px solid #e2e8f0; border-radius: 50px; font-size: 16px; font-family: 'Inter', sans-serif; outline: none; transition: border-color 0.2s;" onfocus="this.style.borderColor='#3b82f6'" onblur="this.style.borderColor='#e2e8f0'" />
              <button type="submit" style="background: #0f172a; color: white; border: none; padding: 18px 36px; border-radius: 50px; font-size: 16px; font-weight: 700; font-family: 'Inter', sans-serif; cursor: pointer; transition: background 0.2s;" onmouseover="this.style.background='#1e293b'" onmouseout="this.style.background='#0f172a'">\${data.cta_texto}</button>
            </div>
            <p style="font-size: 13px; color: #94a3b8; margin: 8px 0 0 0;">Sem spam. Cancele a assinatura quando quiser.</p>
          </form>
        </div>
      </section>
    \`
  },

  // CTA
  {
    type: 'cta_01',
    category: 'CTA',
    name: 'CTA Bloco Impacto',
    thumbnail: \`<svg viewBox="0 0 100 60" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="60" fill="white" /><rect x="10" y="10" width="80" height="40" rx="4" fill="#3B82F6" /><rect x="30" y="25" width="40" height="4" fill="white" /><rect x="40" y="35" width="20" height="6" rx="3" fill="#F59E0B" /></svg>\`,
    fields: [
      { key: 'titulo', label: 'Título CTA', type: 'text' },
      { key: 'texto', label: 'Subtexto', type: 'text' },
      { key: 'cta_texto', label: 'Texto do Botão', type: 'text' },
      { key: 'cta_link', label: 'Link do Botão', type: 'url' },
      { key: 'cor_bloco', label: 'Cor de Fundo do Bloco', type: 'color' },
      { key: 'cor_texto', label: 'Cor do Texto', type: 'color' },
    ],
    defaultData: {
      titulo: 'Pronto para começar sua jornada?',
      texto: 'Junte-se a mais de 10.000 alunos e comece a ver resultados hoje mesmo.',
      cta_texto: 'APROVEITAR OFERTA AGORA',
      cta_link: '#',
      cor_bloco: '#3b82f6',
      cor_texto: '#ffffff',
    },
    defaultSectionStyles: {
      backgroundColor: '#ffffff',
      paddingTop: 80,
      paddingBottom: 80,
    },
    render: (data, styles) => \`
      <section style="\${applySectionStyle(styles)}">
        \${applyOverlay(styles)}
        <div style="position: relative; z-index: 2; max-width: 1000px; margin: 0 auto; padding: 0 24px;">
          <div style="background: \${data.cor_bloco || '#3b82f6'}; border-radius: 24px; padding: 64px 32px; text-align: center; box-shadow: 0 25px 50px -12px \${data.cor_bloco || '#3b82f6'}66;">
            <h2 style="font-size: clamp(28px, 4vw, 44px); font-weight: 900; color: \${data.cor_texto || '#fff'}; margin: 0 0 16px 0; letter-spacing: -0.5px;">\${data.titulo}</h2>
            <p style="font-size: clamp(16px, 2vw, 20px); color: \${data.cor_texto || '#fff'}; opacity: 0.9; margin: 0 0 40px 0; font-weight: 500;">\${data.texto}</p>
            <a href="\${data.cta_link}" style="display: inline-block; background: #f59e0b; color: #fff; text-decoration: none; font-size: 18px; font-weight: 800; padding: 22px 56px; border-radius: 50px; box-shadow: 0 10px 25px -5px rgba(245, 158, 11, 0.4); text-transform: uppercase; transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
              \${data.cta_texto}
            </a>
          </div>
        </div>
      </section>
    \`
  },
  {
    type: 'cta_02',
    category: 'CTA',
    name: 'CTA Simples Minimalista',
    thumbnail: \`<svg viewBox="0 0 100 60" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="60" fill="white" /><rect x="20" y="25" width="40" height="4" fill="#CBD5E1" /><rect x="20" y="33" width="30" height="2" fill="#E2E8F0" /><rect x="70" y="25" width="15" height="8" rx="2" fill="#64748B" /></svg>\`,
    fields: [
      { key: 'titulo', label: 'Título', type: 'text' },
      { key: 'texto', label: 'Texto menor', type: 'text' },
      { key: 'cta_texto', label: 'Texto do Botão', type: 'text' },
      { key: 'cta_link', label: 'Link do Botão', type: 'url' },
      { key: 'cor_texto', label: 'Cor Principal do Texto', type: 'color' },
    ],
    defaultData: {
      titulo: 'Você ainda tem dúvidas?',
      texto: 'Fale com nossa equipe de suporte no WhatsApp.',
      cta_texto: 'FALE CONOSCO',
      cta_link: '#',
      cor_texto: '#0f172a',
    },
    defaultSectionStyles: {
      backgroundColor: '#f8fafc',
      paddingTop: 60,
      paddingBottom: 60,
    },
    render: (data, styles) => \`
      <section style="\${applySectionStyle(styles)} border-top: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0;">
        \${applyOverlay(styles)}
        <div style="position: relative; z-index: 2; max-width: 1200px; margin: 0 auto; padding: 0 24px; display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 32px;">
          <div>
            <h2 style="font-size: clamp(24px, 3vw, 32px); font-weight: 800; color: \${data.cor_texto || '#0f172a'}; margin: 0 0 8px 0;">\${data.titulo}</h2>
            <p style="font-size: 16px; color: \${data.cor_texto || '#0f172a'}; opacity: 0.7; margin: 0;">\${data.texto}</p>
          </div>
          <a href="\${data.cta_link}" style="display: inline-block; background: transparent; color: \${data.cor_texto || '#0f172a'}; border: 2px solid \${data.cor_texto || '#0f172a'}; text-decoration: none; font-size: 16px; font-weight: 700; padding: 16px 32px; border-radius: 50px; text-transform: uppercase;">
            \${data.cta_texto}
          </a>
        </div>
      </section>
    \`
  },

  // RODAPÉS
  {
    type: 'footer_01',
    category: 'Rodapés',
    name: 'Copyright Simples',
    thumbnail: \`<svg viewBox="0 0 100 60" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="60" fill="white" /><rect x="0" y="40" width="100" height="20" fill="#1E293B" /><rect x="30" y="48" width="40" height="2" fill="#64748B" /><rect x="40" y="52" width="20" height="2" fill="#475569" /></svg>\`,
    fields: [
      { key: 'texto_copyright', label: 'Texto Principal', type: 'text' },
      { key: 'texto_secundario', label: 'Avisos Legais', type: 'text' },
      { key: 'cor_texto', label: 'Cor do Texto', type: 'color' },
    ],
    defaultData: {
      texto_copyright: '© 2026 Nome da Empresa. Todos os direitos reservados.',
      texto_secundario: 'Termos de Uso | Política de Privacidade | Este site não faz parte do Facebook.',
      cor_texto: '#94a3b8',
    },
    defaultSectionStyles: {
      backgroundColor: '#0f172a',
      paddingTop: 40,
      paddingBottom: 40,
    },
    render: (data, styles) => \`
      <footer style="\${applySectionStyle(styles)} text-align: center;">
        \${applyOverlay(styles)}
        <div style="position: relative; z-index: 2; max-width: 1000px; margin: 0 auto; padding: 0 24px;">
          <p style="font-size: 14px; color: \${data.cor_texto || '#94a3b8'}; margin: 0 0 12px 0;">\${data.texto_copyright}</p>
          <p style="font-size: 12px; color: \${data.cor_texto || '#94a3b8'}; opacity: 0.6; margin: 0; line-height: 1.6;">\${data.texto_secundario}</p>
        </div>
      </footer>
    \`
  },
  {
    type: 'footer_02',
    category: 'Rodapés',
    name: 'Footer com Links Rápidos',
    thumbnail: \`<svg viewBox="0 0 100 60" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="60" fill="white" /><rect x="0" y="20" width="100" height="40" fill="#1E293B" /><rect x="10" y="30" width="20" height="5" fill="#64748B" /><rect x="40" y="30" width="20" height="3" fill="#64748B" /><rect x="40" y="35" width="20" height="3" fill="#64748B" /><rect x="70" y="30" width="20" height="3" fill="#64748B" /><rect x="0" y="50" width="100" height="1" fill="#334155" /><rect x="40" y="55" width="20" height="2" fill="#64748B" /></svg>\`,
    fields: [
      { key: 'empresa_nome', label: 'Nome da Empresa / Logo Texto', type: 'text' },
      { key: 'empresa_descricao', label: 'Descrição Curta', type: 'textarea' },
      { key: 'email_suporte', label: 'Email de Suporte', type: 'text' },
      { key: 'cor_texto', label: 'Cor do Texto', type: 'color' },
    ],
    defaultData: {
      empresa_nome: 'Minha Empresa',
      empresa_descricao: 'Nosso objetivo é transformar a maneira como você aprende e aplica conhecimento no mundo digital.',
      email_suporte: 'suporte@minhaempresa.com.br',
      cor_texto: '#f8fafc',
    },
    defaultSectionStyles: {
      backgroundColor: '#1e293b',
      paddingTop: 64,
      paddingBottom: 32,
    },
    render: (data, styles) => \`
      <footer style="\${applySectionStyle(styles)}">
        \${applyOverlay(styles)}
        <div style="position: relative; z-index: 2; max-width: 1200px; margin: 0 auto; padding: 0 24px;">
          <div style="display: flex; flex-wrap: wrap; gap: 48px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 48px; margin-bottom: 24px;">
            <div style="flex: 2; min-width: 250px;">
              <h4 style="font-size: 24px; font-weight: 800; color: \${data.cor_texto || '#fff'}; margin: 0 0 16px 0;">\${data.empresa_nome}</h4>
              <p style="font-size: 14px; color: \${data.cor_texto || '#fff'}; opacity: 0.7; line-height: 1.6; margin: 0; max-width: 300px;">\${data.empresa_descricao}</p>
            </div>
            <div style="flex: 1; min-width: 150px;">
              <h5 style="font-size: 16px; font-weight: 600; color: \${data.cor_texto || '#fff'}; margin: 0 0 16px 0;">Links Seguros</h5>
              <ul style="list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 12px;">
                <li><a href="#" style="color: \${data.cor_texto || '#fff'}; opacity: 0.7; text-decoration: none; font-size: 14px;">Termos de Uso</a></li>
                <li><a href="#" style="color: \${data.cor_texto || '#fff'}; opacity: 0.7; text-decoration: none; font-size: 14px;">Política de Privacidade</a></li>
                <li><a href="#" style="color: \${data.cor_texto || '#fff'}; opacity: 0.7; text-decoration: none; font-size: 14px;">Aviso Legal</a></li>
              </ul>
            </div>
            <div style="flex: 1; min-width: 150px;">
              <h5 style="font-size: 16px; font-weight: 600; color: \${data.cor_texto || '#fff'}; margin: 0 0 16px 0;">Contato</h5>
              <p style="font-size: 14px; color: \${data.cor_texto || '#fff'}; opacity: 0.7; margin: 0;">Ficou com dúvida?</p>
              <a href="mailto:\${data.email_suporte}" style="color: #3b82f6; text-decoration: none; font-size: 14px; font-weight: 600; margin-top: 4px; display: inline-block;">\${data.email_suporte}</a>
            </div>
          </div>
          <div style="text-align: center;">
            <p style="font-size: 13px; color: \${data.cor_texto || '#fff'}; opacity: 0.5; margin: 0;">© \${new Date().getFullYear()} \${data.empresa_nome}. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    \`
  }
];

export const getBlocksByCategory = (category: string) =>
  blockRegistry.filter(b => b.category === category);

export const getBlockByType = (type: string) =>
  blockRegistry.find(b => b.type === type);

export const BLOCK_CATEGORIES = [
  'Headers', 'Benefícios', 'Depoimentos', 'Formulários', 'CTA', 'Rodapés',
  'Dúvidas', 'Galeria', 'Vídeos', 'Equipes', 'Planos', 'Garantias', 'Timelines'
] as const;
