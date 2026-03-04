# Roadmap — MelluPet (MVP → Produto Profissional)

Este roadmap prioriza a evolução do MVP atual para uma operação profissional de agendamento petshop, considerando o ambiente Hostinger e stack permitida (HTML/CSS/JS/PHP/MySQL, sem Node.js).

## 0) Estado atual (checklist rápido)

### Concluído
- Landing page institucional com CTA para agendamento.
- Fluxo de cliente com login, seleção de serviço, porte, data/horário e confirmação.
- Tela de consulta de agendamentos do cliente.
- Painel administrativo funcional para operação diária.
- Organização de front-end (CSS/JS externos) e documentação base.

### Pendente crítico
- Clareza de proposta e comunicação de preço/tempo no fluxo principal.
- Regras operacionais mais robustas (capacidade por horário, cancelamento/reagendamento padronizados).
- Integrações automáticas (WhatsApp, lembretes, notificações).
- Evolução de arquitetura para backend PHP + MySQL.

---

## Fase 1 — Melhorias rápidas (1 a 2 dias)

**Objetivo:** melhorar conversão e entendimento do usuário nos primeiros segundos.

### Entregas
- Revisão da proposta de valor acima da dobra (o que é, para quem, benefício direto).
- Ajuste de microcopy do fluxo de agendamento (texto simples e objetivo).
- Barra de progresso no fluxo: serviço → porte → data → horário → confirmação.
- Resumo do agendamento sempre visível: serviços, preço estimado, duração estimada.
- Estados visuais mais claros (carregando, erro, sucesso, horário indisponível).
- CTA principal consistente em toda navegação (desktop e mobile).

### Critérios de aceite
- Usuário novo entende como agendar em até 10 segundos.
- Queda de erros por campo obrigatório não compreendido.
- Fluxo completo executável no celular sem confusão de etapa.

---

## Fase 2 — Melhorias estruturais (1 semana)

**Objetivo:** garantir operação diária confiável para cliente e petshop.

### Entregas
1. Cadastro estruturado de cliente + múltiplos pets por cliente.
2. Reagendamento e cancelamento com regras e trilha de histórico.
3. Controle de disponibilidade por dia/turno + bloqueio de agenda.
4. Capacidade por horário (limite de pets por slot).
5. Confirmação automática do agendamento + lembrete pré-atendimento.
6. Notificação operacional para o petshop (novo, reagendado, cancelado).
7. Painel admin com visão da agenda do dia e filtros práticos.

### Critérios de aceite
- Não permitir conflito de capacidade por slot.
- Reagendamento/cancelamento sem perda de rastreabilidade.
- Operador consegue gerir o dia no painel sem uso de planilha paralela.

---

## Fase 3 — Evolução do produto (profissionalização)

**Objetivo:** consolidar plataforma escalável e pronta para expansão.

### Entregas
1. Backend PHP + MySQL com API para clientes, pets, serviços e agendamentos.
2. Histórico consolidado por pet/cliente (serviços, frequência, observações).
3. Agenda multi-funcionário e regras por profissional.
4. Integrações: WhatsApp API, Google Calendar, relatórios operacionais.
5. Módulos de CRM e fidelização (campanhas e recorrência).
6. Base de multiunidade/multipetshop para futuro modelo SaaS.

### Critérios de aceite
- Dados consistentes e auditáveis no banco relacional.
- Suporte a crescimento de volume sem perda de controle operacional.
- Produto com arquitetura apta para escalar comercialmente.

---

## Sequência real de execução (ordem recomendada)

- **Sprint A (Dia 1–2):** Fase 1 completa (clareza + UX + feedback visual).
- **Sprint B (Semana 1):** Fase 2 completa (cadastros, capacidade, reagendamento/cancelamento, painel diário).
- **Sprint C (Semana 2+):** Backend PHP + MySQL em paralelo (sem big-bang).
- **Sprint D:** Automações (WhatsApp, lembretes, alertas internos).
- **Sprint E:** Evoluções P1/P2 (CRM, fidelização, multi-funcionário avançado, SaaS).

### Regra de transição entre sprints
- Não iniciar sprint seguinte sem checklist da sprint atual validado em produção/sandbox da Hostinger.
- Qualquer incidente no fluxo de agendamento retorna prioridade para correção imediata (P0).

---

## Backlog funcional priorizado (MVP profissional)

### P0 (indispensável)
- Múltiplos pets por cliente.
- Cancelamento e reagendamento.
- Controle de horários disponíveis e capacidade por horário.
- Confirmação automática e lembretes.
- Agenda do dia no painel com filtros.

### P1 (alta prioridade)
- Histórico de serviços por pet.
- Bloqueios de agenda por intervalo (feriados, manutenção, lotação).
- Edição de serviços/preços/tempo no painel.
- Notificações automáticas para equipe.

### P2 (expansão)
- CRM, campanhas WhatsApp e fidelização.
- Dashboard financeiro operacional.
- Multi-funcionário avançado e modelo SaaS.

---

## Estrutura técnica alvo (PHP + MySQL)

### Tabelas iniciais
- `clientes` (id, nome, telefone, email, created_at).
- `pets` (id, cliente_id, nome, porte, raça, observacoes, created_at).
- `servicos` (id, nome, descricao, duracao_min, preco_p, preco_m, preco_g, ativo).
- `agendamentos` (id, cliente_id, pet_id, data_hora_inicio, data_hora_fim, status, origem, observacoes, valor_total).
- `agendamento_servicos` (id, agendamento_id, servico_id, preco_aplicado, duracao_aplicada).
- `bloqueios_agenda` (id, data_inicio, data_fim, motivo, criado_por).
- `capacidade_horarios` (id, dia_semana, hora_inicio, hora_fim, capacidade).
- `notificacoes_log` (id, agendamento_id, canal, status_envio, payload, created_at).

### Organização sugerida
- `/public` (HTML/CSS/JS)
- `/api` (endpoints PHP REST-like)
- `/app` (regras de domínio)
- `/infra` (conexão MySQL, config e logs)

