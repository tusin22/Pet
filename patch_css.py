with open('index.html', 'r') as f:
    content = f.read()

content = content.replace('css/index.css?v=27', 'css/index.css?v=28')

with open('index.html', 'w') as f:
    f.write(content)

with open('agendamento-pacote.html', 'r') as f:
    content = f.read()

content = content.replace('css/index.css?v=27', 'css/index.css?v=28')

with open('agendamento-pacote.html', 'w') as f:
    f.write(content)
