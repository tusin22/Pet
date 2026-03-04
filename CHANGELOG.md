# Changelog

Todas as mudanças relevantes deste projeto devem ser registradas aqui.

## [Não lançado]

### Corrigido
- `css/index.css`: ajustado o modal customizado do site para comportamento real de pop-up (overlay fixo em tela cheia com fundo semitransparente, centralização via flex e z-index alto), eliminando deslocamento lateral e barra de rolagem indevida no mobile.
- `js/index.js`: removido `alert()` nativo residual no fluxo de configuração ausente para manter padrão sem caixas nativas.
- `js/painel-94k2.js` e `painel-94k2.html`: substituídas confirmações/alertas nativos por modal customizado em todas as ações do painel (incluindo cancelar agendamento), com overlay dedicado no HTML.
- `css/painel-94k2.css`: reforçado comportamento dos overlays dos modais com `position: fixed`, `top/left: 0`, `width: 100vw`, `height: 100vh`, fundo escuro semitransparente e camada acima dos demais elementos.
- `index.html` e `painel-94k2.html`: atualizado versionamento de assets (`?v=`) para forçar limpeza de cache de CSS/JS.

### Alterado
- `README.md` e `ROADMAP.md`: adicionada seção **Próximos Passos / Sequência real de execução** com ordem prática de implementação (sprints e regra de transição entre etapas).
- `README.md`: atualizado com diagnóstico do estado atual do MVP, lacunas principais e plano passo a passo de evolução do produto (UX, operação, backend PHP+MySQL e integrações).
- `ROADMAP.md`: reestruturado com fases solicitadas (1–2 dias, 1 semana e evolução do produto), backlog por prioridade e arquitetura técnica alvo sem Node.js.
- `AGENTS.md`: reforçadas diretrizes operacionais para manter aderência à stack da Hostinger e obrigatoriedade de sincronizar roadmap/documentação em pedidos de evolução.

### Corrigido
- `js/painel-94k2.js`: modal da agenda semanal agora atualiza visualmente o status do card (badge e botão ativo) imediatamente após clique em Agendado/Fila/Banho/Secando/Pronto, sem precisar fechar e abrir o modal.
- `js/painel-94k2.js`: corrigido o fluxo de remarcar na agenda semanal (abre/fecha corretamente) e o carregamento de horários agora segue o mesmo padrão do cliente (intervalo configurável, bloqueios, capacidade e slots consecutivos).

### Adicionado
- Criadas as pastas `css/`, `js/` e `assets/img/` para organizar arquivos estáticos do front-end.
- Adicionados os arquivos `css/index.css`, `css/painel-94k2.css`, `js/index.js` e `js/painel-94k2.js` com extração do código inline existente.

### Alterado
- `index.html`: CSS e JavaScript inline externalizados para arquivos dedicados, mantendo a mesma lógica de funcionamento.
- `painel-94k2.html`: CSS e JavaScript inline externalizados para arquivos dedicados, mantendo a mesma lógica de funcionamento.
- `index.html` e `painel-94k2.html`: carregamento de `config/runtime-config.js` ajustado para `defer` visando parse inicial mais leve.
- `README.md`: seção de estrutura do repositório atualizada com a nova organização de pastas.

### Removido
- Removidos blocos de código antigo comentado em `js/index.js` e `js/painel-94k2.js`.

### Adicionado
- Adicionado o botão 'Descrição dos Serviços 📑' no menu inicial (cliente).
- Adicionada nova aba com a tabela descritiva de serviços, exibindo a descrição fixa e os preços P, M e G consultados dinamicamente do Firebase (com zebrado em branco e creme).
- Adicionado `SECURITY.md` com plano emergencial de hardening para Hostinger + Firebase.
- Adicionado `config/runtime-config.example.js` com modelo seguro de configuração para produção na Hostinger.
- Configurado carregamento automático de logo em `index.html` e `painel-94k2.html` via `assets/logo-mellupet.png`, com fallback visual quando o arquivo não existe.
- Espaço visual para logo no `index.html` (site principal) e no `painel-94k2.html` (painel admin).
- Orientação de responsividade com foco em mobile e desktop no fluxo principal.

### Alterado
- `painel-94k2.html`: adicionada a logo também na tela de login do admin, reaproveitando `assets/logo-mellupet.png` com fallback quando o arquivo não existe.
- `painel-94k2.html`: ajustada a consulta da agenda para evitar falha por índice composto no Firestore (remoção de `orderBy` na leitura diária), com ordenação feita no cliente e exibição do código do erro para facilitar diagnóstico.
- Melhorada navegação do painel no celular: abas em grade 2x2, melhor legibilidade e ajustes de campos/filtros para mobile.
- `README.md` atualizado com referência ao checklist de hardening (`SECURITY.md`).
- Externalizada configuração do Firebase e senha do painel para `config/runtime-config.js` (fora do HTML versionado).
- Corrigido layout dos horários no desktop para exibir em grade (evitando um horário por linha inteira).
- Atualizado texto da tela de agendamento para: "Escolha serviço, Porte, Data e Horário".
- Ajustado visual da área de logo: removido tracejado e melhorado posicionamento no site principal e no painel.
- `ROADMAP.md` atualizado com escopo solicitado: site principal, agendamento, painel, edição da primeira página, status/planos, cadastros e análise de migração de banco.
- `README.md` reestruturado para refletir prioridade de agendamento 100% funcional e próximos módulos do produto.
- `index.html` com melhorias de layout/responsividade (breakpoints, grid no formulário e adaptação de slots).
- `painel-94k2.html` com ajuste visual de cabeçalho e comportamento em telas pequenas.
