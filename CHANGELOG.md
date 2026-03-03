# Changelog

Todas as mudanças relevantes deste projeto devem ser registradas aqui.

## [Não lançado]

### Adicionado
- `server.js` com API Node.js (Express + Firebase Admin SDK) para listar, criar e remover administradores via rotas protegidas por token JWT.
- `package.json` com dependências e script de execução do backend de gestão de acessos.
- `painel-94k2.html`: nova seção "Gerenciar Acessos" em Configurações com listagem de admins, cadastro (e-mail/senha) e remoção via API segura.
- `painel-94k2.html`: link "Esqueci minha senha" na tela de login com envio de recuperação por `sendPasswordResetEmail` e feedback visual de sucesso/erro.
- Adicionado o botão 'Descrição dos Serviços 📑' no menu inicial (cliente).
- Adicionada nova aba com a tabela descritiva de serviços, exibindo a descrição fixa e os preços P, M e G consultados dinamicamente do Firebase (com zebrado em branco e creme).
- Adicionado `SECURITY.md` com plano emergencial de hardening para Hostinger + Firebase.
- Adicionado `config/runtime-config.example.js` com modelo seguro de configuração para produção na Hostinger.
- Configurado carregamento automático de logo em `index.html` e `painel-94k2.html` via `assets/logo-mellupet.png`, com fallback visual quando o arquivo não existe.
- Espaço visual para logo no `index.html` (site principal) e no `painel-94k2.html` (painel admin).
- Orientação de responsividade com foco em mobile e desktop no fluxo principal.

### Alterado
- `config/runtime-config.example.js` atualizado com `adminApiBaseUrl` para integração do frontend com o backend Node.js.
- `README.md` atualizado com guia de setup da API de administradores, autenticação por Bearer token e integração com runtime config.
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
