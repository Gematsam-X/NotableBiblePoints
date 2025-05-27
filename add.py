import os
import re

# Percorsi
cartella_js = './src/js'
file_html = './src/index.html'

# Ottieni tutti i file JS nella cartella (esclude le sottocartelle)
file_js = [f for f in os.listdir(cartella_js) if os.path.isfile(os.path.join(cartella_js, f))]

# Costruisci i tag script
tag_script = [f'<script type="module" src="js/{nome_file}"></script>' for nome_file in sorted(file_js)]

# Leggi l'HTML attuale
with open(file_html, 'r', encoding='utf-8') as f:
    contenuto_html = f.read()

# Filtra solo i tag non già presenti nel file
tag_script_non_presenti = [tag for tag in tag_script if tag not in contenuto_html]

# Se non ci sono tag nuovi, stampa un messaggio e esci
if not tag_script_non_presenti:
    print("Tutti i tag <script> sono già presenti nel file HTML! 💤")
    exit()

# Crea il blocco da inserire
blocco_script = '\n' + '\n'.join(tag_script_non_presenti) + '\n'

# Inserisce prima del </body> se presente
if '</body>' in contenuto_html:
    nuovo_contenuto = re.sub(r'</body>', f'{blocco_script}</body>', contenuto_html, count=1, flags=re.IGNORECASE)
else:
    print("⚠️ Nessun tag </body> trovato, aggiunta in fondo al file!")
    nuovo_contenuto = contenuto_html.strip() + blocco_script

# Sovrascrive il file HTML
with open(file_html, 'w', encoding='utf-8') as f:
    f.write(nuovo_contenuto)

print(f"Aggiunti {len(tag_script_non_presenti)} nuovi tag <script> in {file_html} 😎")
