import sys

with open('CHANGELOG.md', 'r') as f:
    content = f.read()

new_entry = """### Alterado
- Preparado bloco de código das regras de segurança do Firestore (`firestore.rules`) para ser fornecido ao usuário, permitindo leitura e atualização da coleção `carteiras` e criação na coleção `appointments` por clientes (sem autenticação) para resolver o erro de permissão no agendamento de pacotes.

"""

content = content.replace("## [Não lançado]\n", "## [Não lançado]\n\n" + new_entry)

with open('CHANGELOG.md', 'w') as f:
    f.write(content)
