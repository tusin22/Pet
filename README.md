# MelluPet — Plataforma de Agendamento Petshop

Projeto web da MelluPet em evolução de MVP para produto digital profissional, com foco em conversão, organização de agenda e operação estável na Hostinger.

## Objetivo atual

Transformar o fluxo atual de agendamento em uma experiência clara para o cliente e eficiente para o dono do petshop, usando stack compatível com Hostinger:

- HTML + CSS + JavaScript (front-end)
- PHP + MySQL (back-end)
- APIs externas e automações
- **Sem Node.js**

## Diagnóstico rápido do que já foi feito

### Já entregue (base existente)
- Landing page de apresentação (`novo-site.html`) com CTA para agendamento.
- Fluxo de cliente com login simples, agendamento e consulta de agendamentos (`index.html` + `js/index.js`).
- Painel administrativo operacional (`painel-94k2.html` + `js/painel-94k2.js`).
- Organização de CSS/JS em arquivos externos.
- Configuração sensível externalizada para `config/runtime-config.js`.
- Histórico de mudanças e diretrizes operacionais documentados.

### Lacunas atuais para profissionalizar o produto
- Proposta de valor no agendamento ainda pouco objetiva para usuário novo.
- Falta de comunicação clara de preço final, duração e próximos passos após confirmação.
- Ausência de funcionalidades centrais de operação (reagendamento guiado, cancelamento padronizado, capacidade por horário com regras administrativas robustas).
- Dependência de Firebase no MVP atual, enquanto a estratégia de hospedagem pede evolução para PHP + MySQL.

## O que vamos fazer daqui pra frente (passo a passo)

### Passo 1 — UX e conversão imediata (rápido)
1. Ajustar textos de entrada para explicar em 1 frase: serviço, duração média e confirmação.
2. Tornar o fluxo de agendamento progressivo (etapas visíveis: serviço → porte → data → horário → confirmação).
3. Exibir resumo fixo do pedido em tempo real (serviços, valor estimado, tempo estimado).
4. Padronizar mensagens de erro e sucesso com linguagem simples.

### Passo 2 — Regras operacionais confiáveis
1. Definir regras de disponibilidade por dia e por faixa de horário.
2. Implementar controle de capacidade por slot.
3. Estruturar cancelamento e reagendamento com motivo e histórico.
4. Incluir status pós-serviço de forma consistente para cliente e admin.

### Passo 3 — Estrutura profissional de dados (PHP + MySQL)
1. Criar API PHP para entidades base: clientes, pets, serviços, agendamentos e bloqueios de agenda.
2. Migrar gradualmente o front para consumir endpoints PHP.
3. Validar consistência de dados (telefone, pet, conflitos de horário).
4. Implantar logs básicos de operação e trilha de auditoria administrativa.

### Passo 4 — Automações e integração de comunicação
1. Envio automático de confirmação por WhatsApp após agendamento.
2. Lembrete automático antes do horário.
3. Notificação do petshop para novos agendamentos/reagendamentos/cancelamentos.
4. Sincronização opcional com Google Calendar para agenda interna.

### Passo 5 — Produto escalável
1. Evoluir para agenda multi-funcionário.
2. Acrescentar CRM simples (histórico, frequência, preferências do pet).
3. Preparar base para fidelização (pacotes, recorrência, campanhas).
4. Planejar versão SaaS multi-petshop quando o modelo local estiver estável.

## Próximos Passos (sequência real de execução)

Para evitar retrabalho, seguir nesta ordem:

1. **Fechar Fase 1 (UX rápida)**
   - Aplicar microcopy, stepper visual e resumo de preço/tempo no `index.html`.
   - Validar fluxo completo em mobile e desktop.
2. **Fechar Fase 2 (operação)**
   - Implementar múltiplos pets, reagendamento/cancelamento e capacidade por horário.
   - Atualizar painel com agenda do dia e filtros operacionais.
3. **Preparar migração técnica controlada**
   - Subir API PHP + MySQL em paralelo ao fluxo atual.
   - Migrar primeiro leitura de serviços/horários, depois criação de agendamento.
4. **Ativar automações de comunicação**
   - Confirmar e lembrar por WhatsApp automaticamente.
   - Notificar o petshop em eventos críticos (novo, cancelado, reagendado).
5. **Escalar produto com segurança**
   - Só avançar para CRM/fidelização/SaaS após estabilidade operacional medida por 2–4 semanas.

> Definição de pronto por etapa: só avançar quando os critérios de aceite da fase atual em `ROADMAP.md` estiverem cumpridos.

## Estrutura do repositório

- `index.html` — fluxo do cliente (login, agendamento, meus agendamentos).
- `novo-site.html` — landing page/apresentação da MelluPet.
- `painel-94k2.html` — painel administrativo.
- `css/index.css` — estilos do fluxo do cliente.
- `css/novo-site.css` — estilos da landing page.
- `css/painel-94k2.css` — estilos do painel administrativo.
- `js/index.js` — lógica do fluxo do cliente.
- `js/novo-site.js` — interações da landing page.
- `js/painel-94k2.js` — lógica do painel administrativo.
- `ROADMAP.md` — plano evolutivo por fases.
- `CHANGELOG.md` — histórico de mudanças.
- `AGENTS.md` — instruções operacionais para agentes.

## Publicação na Hostinger (resumo)

1. Publicar arquivos estáticos e endpoints PHP no mesmo domínio.
2. Configurar banco MySQL e credenciais seguras fora do versionamento.
3. Validar HTTPS, redirecionamento e política básica de segurança.
4. Executar checklist de regressão do fluxo principal.

## Referências

- Planejamento por fases: `ROADMAP.md`.
- Histórico de alterações: `CHANGELOG.md`.
- Endurecimento de segurança: `SECURITY.md`.
