# Segurança — Plano emergencial de hardening (Hostinger + Firebase)

## 1) Remover segredos do código HTML (feito)
- Firebase config e senha do painel passaram para `config/runtime-config.js` (não versionado).
- Modelo em `config/runtime-config.example.js`.

## 2) Proteger o painel em camada de servidor (urgente)
- Ativar proteção por senha do diretório no Hostinger para o arquivo do painel.
- Não confiar apenas no prompt do navegador.

## 3) Reforçar Firestore Rules (urgente)
- Bloquear escrita pública não autenticada.
- Permitir somente operações estritamente necessárias por perfil.
- Validar schema e campos permitidos no write.

## 4) Ativar autenticação de administrador
- Criar contas admin reais (Firebase Auth).
- Trocar validação por senha local para sessão autenticada.

## 5) Rotação de segredos
- Trocar senha atual do painel imediatamente.
- Revisar e rotacionar credenciais usadas em produção.

## 6) Auditoria mínima contínua
- Revisão semanal de logs de acesso/erros.
- Teste mensal do fluxo de agendamento e permissões.
