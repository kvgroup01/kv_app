# Guia de Integração com Meta Ads API

Este guia detalha como a integração direta com o Facebook Gerenciador de Anúncios funciona debaixo dos panos, as credenciais e as estratégias adotadas no sistema.

## 1. Credenciais Necessárias (Onde e como obter)

Para que a sincronização funcione para um cliente, você vai precisar de três elementos-chave:

- **Access Token (Token de Acesso do Usuário do Sistema ou Permanente):**
  - Geração: Vá até o *Meta Business Settings* > *System Users* > *Generate New Token*.
  - Permissões obrigatórias: `ads_management`, `ads_read`, `read_insights`.
- **Ad Account ID:** 
  - Geração: ID da conta de anúncios que você vê na URL do gerenciador. (Atenção: A API exige o prefixo `act_` antes do ID. Exemplo: `act_123456789`).
- **App ID e App Secret (Caso deseje renovar tokens ou validar):**
  - Geração: Vá em `developers.facebook.com`, crie ou acesse seu App, vá em Configurações > Básico. (A nossa implementação atua com o Token gerado manualmente para agilidade, o que não requer expor o App Secret no payload).

## 2. Endpoints da Graph API Consumidos

A integração faz um varredura hierárquica usando a versão `v19.0`:

| O Que Buscamos | Endpoint Base | Campos Mapeados (`fields=`) | Destino (Appwrite) |
| :--- | :--- | :--- | :--- |
| **Campanhas** | `GET /{ad_account_id}/campaigns` | `id, name, status, objective` | `collections.campaigns` |
| **Conjuntos** | `GET /{ad_account_id}/adsets` | `id, campaign_id, name, status` | `collections.adsets` |
| **Anúncios** | `GET /{ad_account_id}/ads` | `id, adset_id, name, creative{thumbnail_url}` | `collections.ads` |
| **Métricas/Insights**| `GET /{ad_account_id}/insights` | `ad_id, spend, impressions, reach, clicks, actions` | `collections.daily_metrics` |

*(O mapeamento converte IDs, gastos e clicks em métricas tipadas no Appwrite e usa `post_engagement` e `messaging_conversation_started_7d` como conversões do Tipo A e `lead` como conversões Tipo B).*

## 3. Estratégia de Sincronização

1. **Gatilhos (Triggers):** A sincronização pode ser engatilhada manualmente via frontend ou através de um Cron Job central enviando um POST.
2. **Idempotência e Persistência:** A inserção no Appwrite usa estratégias de Upsert (tentar dar `createDocument`, e em caso de `Error 409: Conflict`, rodar `updateDocument`) mitigando duplicações baseando o ID como a string `${cliente_id}_${ad_id}_${data}`.
3. **Limites de API (Rate Limits):** Limitamos as consultas a uma janela específica (`time_range`). É recomendado criar uma função serverless no Appwrite ou num Cron Schedule externo que dispare o Endpoint 1x a cada poucas horas por conta, e não ao abrir a página (reduz sobrecarga).

## Como Executar a Sincronização (Exemplo)

```bash
curl -X POST https://seu-dominio.com/api/meta-ads/sync \
  -H "Content-Type: application/json" \
  -d '{
    "cliente_id": "ID_DO_CLIENTE",
    "access_token": "EAAxxx...",
    "ad_account_id": "act_1067xxxxx",
    "date_start": "2024-02-01",
    "date_end": "2024-02-15"
  }'
```
