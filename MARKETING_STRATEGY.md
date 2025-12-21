# 📈 Estratégia de Tráfego Pago - Eleva App

Para um aplicativo de estudos (SaaS B2C), o foco deve ser capturar o usuário no momento de "dor" (desorganização) ou "aspiração" (passar na prova).

## 1. Onde Anunciar? (Canais)

### 🥇 Meta Ads (Instagram & Facebook) - O Essencial

**Por que?** É onde seu público está procrastinando. O apelo visual do Eleva (plano de estudos, dashboard bonito) funciona muito bem aqui.

- **Instagram Stories/Reels:** Vídeos curtos de 15s mostrando "Antes vs Depois" da organização.
- **Feed:** Carrosseis com dicas de estudo + "Conheça o Eleva".
- **Público:** Interesses em "Concursos Públicos", "OAB", "ENEM", "Produtividade".

### 🥈 Google Ads (Rede de Pesquisa) - Alta Intenção

**Por que?** Captura quem já procura solução.

- **Palavras-chave:** "cronograma de estudos", "como organizar estudos", "app para concursos".
- **Custo:** Geralmente o clique (CPC) é mais caro, mas a conversão é maior.

### 🥉 TikTok Ads - A Grande Oportunidade

**Por que?** Alcance *muito* barato e público jovem/estudante massivo.

- **Criativo:** Tem que parecer conteúdo nativo (UGC - User Generated Content), não propaganda polida. Alguém gravando a tela do celular e narrando "Gente, esse app salvou meu cronograma".

---

## 2. Quanto Gastar? (Budget Inicial)

Não comece gastando muito. O objetivo inicial é **comprar dados**, não necessariamente lucrar na primeira semana.

**Sugestão de teste:**

- **Orçamento:** R$ 30,00 a R$ 50,00 por dia.
- **Duração:** Mínimo 7 dias (para o algoritmo aprender).
- **Total do Teste:** ~R$ 300,00.

**Divisão sugerida:**

- **70%** no Instagram (foco em Stories/Reels).
- **30%** no Google (palavras-chave fundo de funil).

---

## 3. Expectativa de Retorno (ROI/ROAS)

Para apps de assinatura (SaaS), olhamos duas métricas principais:

1. **CAC (Custo de Aquisição de Cliente):** Quanto custa para fazer uma venda.
2. **LTV (Lifetime Value):** Quanto o cliente gasta com você ao longo do tempo.

**A Regra de Ouro (3:1):**
O valor que o cliente deixa (LTV) deve ser 3x maior que o custo para trazê-lo (CAC).

**Simulação Conservadora:**

- **Assinatura Mensal:** R$ 29,90
- **Retenção Média:** 4 meses (Estimativa)
- **LTV Estimado:** R$ 119,60
- **CAC Máximo Aceitável:** ~R$ 40,00 (Para ter lucro saudável)

**No começo (Fase de Teste):**
É normal o CAC ser mais alto (empatar o dinheiro). Com o tempo, você otimiza criativos e públicos para baixar esse custo.

---

## 4. O Passo Técnico (Crucial) 🛠️

Antes de gastar 1 real, você **PRECISA** configurar o rastreamento. As plataformas de ads precisam saber quando uma venda acontece para otimizar.

**O que precisamos instalar no código:**

1. [ ] **Pixel do Facebook (Meta Pixel):** Rastrear `PageView`, `InitiateCheckout` e `Purchase`.
2. [ ] **Google Analytics 4 (GA4):** Rastrear conversões vindas do Google.
3. [ ] **API de Conversões:** Enviar dados do servidor (Stripe/Supabase) para o Facebook (mais preciso que o Pixel comum).

> **Eu posso configurar esses códigos de rastreamento para você agora se quiser. É rápido e evita jogar dinheiro fora.**
