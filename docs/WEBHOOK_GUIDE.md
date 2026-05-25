# Documentação do Webhook de Métricas KV Group

Este webhook permite a ingestão de dados de tráfego pago em tempo real para o banco de dados Appwrite.

## Endpoint
`POST http://seu-dominio.com/api/webhook`

## Estrutura do Payload (JSON)

```json
{
  "cliente_id": "ID_DO_CLIENTE_NO_APPWRITE",
  "metrics": [
    {
      "criativo_id": "ID_DO_META_ADS",
      "data": "2024-02-15",
      "investimento": 150.50,
      "impressoes": 5000,
      "alcance": 4500,
      "cliques": 200,
      "conversas": 15,
      "leads_qualificados": 5,
      "leads_desqualificados": 2,
      "vendas": 1
    }
  ]
}
```

## Exemplo de chamada (JavaScript / Fetch)

```javascript
const sendMetrics = async (data) => {
  try {
    const response = await fetch('https://seu-dominio.com/api/webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const result = await response.json();
    console.log('Webhook Success:', result);
  } catch (error) {
    console.error('Webhook Error:', error);
  }
};

// Exemplo de uso
sendMetrics({
  cliente_id: "65cb78...", 
  metrics: [{
    criativo_id: "ad_123",
    data: new Date().toISOString().split('T')[0],
    investimento: 45.0,
    impressoes: 1000,
    alcance: 900,
    cliques: 50,
    conversas: 8
  }]
});
```

## Exemplo de chamada (cURL)

```bash
curl -X POST https://seu-dominio.com/api/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "cliente_id": "65cb78...",
    "metrics": [
      {
        "criativo_id": "ad_123",
        "data": "2024-02-15",
        "investimento": 10.0,
        "impressoes": 500
      }
    ]
  }'
```

## Características Técnicas
- **Idempotência**: O sistema gera um ID único composto por `cliente_id + ad_id + data`. Enviar o mesmo dado múltiplas vezes atualizará o registro existente em vez de duplicá-lo.
- **Validação**: O servidor garante que os valores numéricos sejam processados corretamente e rejeita payloads sem os campos obrigatórios.
- **Segurança**: Adicione cabeçalhos de autenticação customizados se desejar restringir o acesso (pode ser configurado no `server.ts`).
