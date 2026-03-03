# MelluPet — Plataforma de Agendamento Petshop

Projeto web do petshop MelluPet com MVP aprovado, em fase de estabilização para operação em produção.

## Objetivo atual

Prioridade máxima: **agendamento funcionando 100%** (mobile e desktop), com base organizada para expansão do produto.

## O que já existe no MVP

- Site principal de atendimento ao cliente.
- Fluxo de login simples (nome + WhatsApp).
- Agendamento com serviços, porte, data e horário.
- Consulta de agendamentos e status.
- Painel administrativo para operação.
- Persistência em Firebase Firestore.

## O que o produto deve ter

### Núcleo imediato (P0)
- Site principal com experiência clara para tutor.
- Página de agendamento confiável e validada.
- Painel de gerenciamento funcional para operação diária.
- Espaços de logo estruturados para identidade visual.
- Layout consistente no telefone e no computador.

### Próximas evoluções (P1/P2)
- Cadastro estruturado de pessoa.
- Cadastro estruturado dos animais.
- Página para edição da primeira página (CMS leve).
- Área de status e planos (primeiro visualização, depois contratação).
- Estudo de viabilidade para banco de dados próprio (mantendo Firebase até provar necessidade de migração).

## Estrutura do repositório

- `index.html` — site principal + fluxo de agendamento.
- `painel-94k2.html` — painel de gerenciamento.
- `ROADMAP.md` — fases e prioridades do projeto.
- `CHANGELOG.md` — histórico de mudanças.
- `AGENTS.md` — regras obrigatórias para qualquer agente antes de alterar código.

## Publicação na Hostinger (resumo)

1. Publicar os arquivos estáticos.
2. Validar domínio e HTTPS.
3. Revisar regras de segurança do Firestore.
4. Executar checklist final de fluxos em produção.

## Referências de gestão

- Planejamento completo: `ROADMAP.md`.
- Registro contínuo das mudanças: `CHANGELOG.md`.
