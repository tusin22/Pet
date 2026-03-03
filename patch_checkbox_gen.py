import re

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

search_str = """
        div.innerHTML = `
            <input type="checkbox" name="serviceOption" value="${service}" id="srv-${service.replace(/\s+/g, '')}" disabled style="width: auto; transform: scale(1.2);">
            <label for="srv-${service.replace(/\s+/g, '')}" style="margin: 0; font-weight: normal; cursor: pointer;">${service}</label>
        `;
"""

replace_str = """
        const isChecked = service === 'Banho Master' ? 'checked' : '';
        div.innerHTML = `
            <input type="checkbox" name="serviceOption" value="${service}" id="srv-${service.replace(/\s+/g, '')}" disabled ${isChecked} style="width: auto; transform: scale(1.2);">
            <label for="srv-${service.replace(/\s+/g, '')}" style="margin: 0; font-weight: normal; cursor: pointer;">${service}</label>
        `;
"""

if search_str in content:
    content = content.replace(search_str, replace_str)
else:
    print("Could not find block to replace.")

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)
