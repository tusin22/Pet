import re

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Apply secondary colors to 'Pronto' badge
    content = content.replace('.status-pronto { background-color: #c8e6c9; color: #1b5e20; }', '.status-pronto { background-color: #C4C4A3; color: #333333; }')

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

process_file('index.html')
process_file('painel-94k2.html')
