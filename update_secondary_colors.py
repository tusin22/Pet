import re

def replace_color(content, old, new):
    return re.sub(re.escape(old), new, content, flags=re.IGNORECASE)

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Apply secondary colors
    content = replace_color(content, '#ffe0b2', '#EED5D4') # Fila badge (light pink)
    content = replace_color(content, '#e65100', '#C49595') # Fila text (terracotta)
    content = replace_color(content, '#b3e5fc', '#A2BABD') # Banho badge (grey blue)
    content = replace_color(content, '#01579b', '#333333') # Banho text
    content = replace_color(content, '#e1bee7', '#C4C4A3') # Secando badge (sage)
    content = replace_color(content, '#4a148c', '#333333') # Secando text

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

process_file('index.html')
process_file('painel-94k2.html')
