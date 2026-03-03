import re

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Apply new primary and background colors
    content = content.replace('--primary: #4CAF50;', '--primary: #4E797C;')
    content = content.replace('--background: #f4f4f9;', '--background: #FAF4F2;')

    # Update hardcoded green hex colors
    content = content.replace('#4CAF50', 'var(--primary)')
    content = content.replace('#45a049', '#3D6163') # primary hover
    content = content.replace('#43a047', '#3D6163') # primary hover
    content = content.replace('#43A047', '#3D6163') # primary hover

    # Update light green backgrounds
    content = content.replace('background-color: #e8f5e9;', 'background-color: #EED5D4;')

    # Update header in index.html
    if 'index.html' in filepath:
        content = content.replace('<h2>Agendar Banho</h2>', '<h2>Agendar Serviços</h2>')
        content = content.replace('<button id="btn-agendar" class="menu-btn">Agendar Banho 🛁</button>', '<button id="btn-agendar" class="menu-btn">Agendar Serviços 🛁</button>')

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

process_file('index.html')
process_file('painel-94k2.html')
