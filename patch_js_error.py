with open("js/painel-94k2.js", "r") as f:
    content = f.read()

content = content.replace("if(!overlay) { await showCustomAlert(message); resolve(); return; }", "if(!overlay) { alert(message); resolve(); return; }")
content = content.replace("if(!overlay) { resolve(await showCustomConfirm(message)); return; }", "if(!overlay) { resolve(confirm(message)); return; }")
content = content.replace("if(!overlay) { resolve(await showCustomPrompt(message)); return; }", "if(!overlay) { resolve(prompt(message)); return; }")

with open("js/painel-94k2.js", "w") as f:
    f.write(content)
