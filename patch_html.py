with open('index.html', 'r') as f:
    content = f.read()

content = content.replace('js/index.js?v=28', 'js/index.js?v=29')

with open('index.html', 'w') as f:
    f.write(content)

with open('agendamento-pacote.html', 'r') as f:
    content = f.read()

content = content.replace('js/agendamento-pacote.js?v=27', 'js/agendamento-pacote.js?v=28')

with open('agendamento-pacote.html', 'w') as f:
    f.write(content)
