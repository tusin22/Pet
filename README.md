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


## Backend Node.js para gestão de administradores

Foi adicionado um backend `server.js` com Express + Firebase Admin SDK para operações seguras de acessos administrativos.

### Rotas

- `GET /admins` — lista usuários do Firebase Auth.
- `POST /admins` — cria novo admin com `email` e `password`.
- `DELETE /admins/:uid` — remove usuário/admin pelo UID.

Todas as rotas exigem token JWT Firebase no header:

```
Authorization: Bearer <ID_TOKEN_DO_ADMIN_LOGADO>
```

### Setup rápido

1. Instale dependências:
   ```bash
   npm install
   ```
2. Configure credenciais do Firebase Admin:
   - opção A: variável `FIREBASE_SERVICE_ACCOUNT_JSON` com o JSON completo da service account.
   - opção B: usar credencial padrão da infraestrutura (`applicationDefault`).
3. (Opcional) Defina `ADMIN_PANEL_ORIGIN` para restringir CORS ao domínio do painel.
4. Inicie a API:
   ```bash
   npm start
   ```

### Integração com o painel

No `config/runtime-config.js` (não versionado), defina:

```js
window.__MELLUPET_CONFIG = {
  firebase: { /* ... */ },
  adminPanelPassword: "...",
  adminApiBaseUrl: "https://seu-backend-node"
};
```

Com isso, a seção **Gerenciar Acessos** em `painel-94k2.html` passa a listar/cadastrar/remover administradores consumindo a API protegida.

## Referências de gestão

- Planejamento completo: `ROADMAP.md`.
- Registro contínuo das mudanças: `CHANGELOG.md`.
- Checklist de hardening: `SECURITY.md`.


## Como inserir a logo agora

1. Crie (ou use) a pasta `assets/` na raiz do projeto.
2. Salve sua logo com o nome **`logo-mellupet.png`** em `assets/logo-mellupet.png`.
3. Recarregue `index.html` e `painel-94k2.html`: a imagem será exibida automaticamente.

> Se o arquivo não existir, o sistema mostra um bloco de fallback com instrução do caminho esperado.


## Segurança urgente (Hostinger)

1. Copie `config/runtime-config.example.js` para `config/runtime-config.js` e preencha os dados reais.
2. **Não versione** `config/runtime-config.js` (já está no `.gitignore`).
3. Troque imediatamente a senha do painel e defina `adminPanelPassword` forte no runtime config.
4. Revise as regras do Firestore para bloquear escrita indevida e permitir apenas o necessário.
5. No Hostinger, proteja o painel com camada extra (ex.: diretório protegido/senha do servidor), não apenas prompt no navegador.
