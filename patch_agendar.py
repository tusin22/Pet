import re

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Modify the logic inside the 'btn-agendar' click listener
search_str = """
        // Reset and disable checkboxes
        document.querySelectorAll('input[name="serviceOption"]').forEach(cb => {
            cb.checked = false;
            cb.disabled = true;
        });
"""

replace_str = """
        // Reset and disable checkboxes, but pre-select Banho Master
        document.querySelectorAll('input[name="serviceOption"]').forEach(cb => {
            if (cb.value === 'Banho Master') {
                cb.checked = true;
            } else {
                cb.checked = false;
            }
            cb.disabled = true;
        });
"""

if search_str in content:
    content = content.replace(search_str, replace_str)
else:
    print("Could not find block to replace.")

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)
