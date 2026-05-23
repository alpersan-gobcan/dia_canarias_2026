import re

with open('data.js', 'r', encoding='utf-8', errors='ignore') as f:
    content = f.read()

# Replace Mesas Jardines
content = re.sub(r'(?i)Mesas Jardines\s*\|\s*Y\s*\|\s*CANCHAS', 'Mesas Jardines y Canchas', content)

# Replace 4 ESO A for act_4_8
def replace_act_4_8(match):
    return match.group(0).replace('4\ufffd ESO A', '1\ufffd ESO A y 4\ufffd ESO A').replace('4 ESO A', '1 ESO A y 4 ESO A')

content = re.sub(r'("id"\s*:\s*"act_4_8".*?"groups"\s*:\s*")(.*?)(")', replace_act_4_8, content, flags=re.DOTALL)

with open('data.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Done")
