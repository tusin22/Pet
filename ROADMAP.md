# Roadmap — MelluPet (MVP aprovado)

Foco definido: **agendamento 100% estável primeiro**, com base sólida para expansão.

## Macrovisão de produtos/site

1. **Site principal (cliente)**
   - Login do tutor, cadastro de pessoa, cadastro de animal, agendamento e consulta de status.
2. **Página de agendamentos**
   - Fluxo otimizado para mobile e desktop (serviço, porte, data, horário, observações, confirmação).
3. **Painel de gerenciamento (admin)**
   - Gestão da agenda, capacidade, preços, tempos, status dos pets e ajustes operacionais.
4. **Página de edição da primeira página (CMS leve, futura)**
   - Permitir atualizar textos/banner/aviso sem editar HTML manualmente.
5. **Status e Planos**
   - Curto prazo: visualização de planos.
   - Médio prazo: habilitar contratação online.

## Prioridades por fase

## Fase 1 — Estabilização do agendamento (P0)

**Objetivo:** colocar o agendamento para funcionar de ponta a ponta com confiabilidade.

### Entregas
- Garantir fluxo completo: login → cadastro pessoa/pet → agendamento → confirmação.
- Revisar disponibilidade e geração de horários.
- Revisar cálculo de preço/tempo por porte e serviços.
- Padronizar mensagens de validação e erro.
- Melhorar responsividade no celular e no computador.
- Definir e manter espaços de logo no site principal e no painel.

### Critérios de aceite
- Fluxo principal sem erro crítico em mobile e desktop.
- Criação, alteração e cancelamento de agendamento funcionando.
- Layout legível/usável em telas pequenas e grandes.

## Fase 2 — Go-live na Hostinger (P0)

### Entregas
- Publicação estática de `index.html` + painel.
- Revisão de SSL/domínio/redirecionamento.
- Revisão de regras do Firestore para produção.
- Backup operacional mínimo dos dados.

### Critérios de aceite
- Ambiente publicado sem erros bloqueantes.
- Cliente e admin operando no domínio final.

## Fase 3 — Organização de dados e cadastros (P1)

### Entregas
- Estruturar claramente entidades de **Pessoa** e **Animal**.
- Consolidar histórico de agendamentos por tutor e por pet.
- Preparar documentação de schema e regras de dados.

### Critérios de aceite
- Dados de clientes/pets consistentes e recuperáveis.
- Menos retrabalho para suporte e operação.

## Fase 4 — Conteúdo editável + Planos (P1/P2)

### Entregas
- Módulo para edição da primeira página (textos, destaques e avisos).
- Tela de visualização de status e planos.
- Etapa seguinte: contratação de plano (quando validado comercialmente).

## Fase 5 — Banco próprio (estudo de viabilidade) (P2)

### Diretriz
- **Manter Firebase no curto prazo** para acelerar operação do MVP.
- Avaliar migração para banco próprio apenas se houver ganho real de custo, performance, integração ou governança.

### Critérios para decidir migração
- Crescimento de volume/custo no Firebase.
- Necessidade de consultas avançadas/relatórios robustos.
- Requisitos de integração com sistemas externos.

## Riscos e mitigação

- **Risco:** quebrar fluxo de agendamento ao evoluir UI.
  **Mitigação:** alterações pequenas + checklist de regressão por fluxo.
- **Risco:** acoplamento excessivo em HTML único.
  **Mitigação:** modularizar gradualmente por responsabilidade.
- **Risco:** migrar banco cedo demais.
  **Mitigação:** decisão baseada em métricas de custo/escala.
