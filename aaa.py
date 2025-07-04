import os

def stampa_file_formattati(cartella):
    """
    Stampa tutti i file nella cartella specificata con percorso relativo
    rispetto alla cartella base, senza mostrare la cartella base stessa.
    Ogni percorso è stampato con virgolette e virgola.
    """
    # Prendiamo il path assoluto della cartella base per confronto
    base_assoluto = os.path.abspath(cartella)

    for root, dirs, files in os.walk(cartella):
        for file in files:
            percorso_assoluto = os.path.join(root, file)
            # Percorso relativo rispetto alla cartella base, quindi senza 'public/'
            percorso_ridotto = os.path.relpath(percorso_assoluto, base_assoluto)
            print(f'"{percorso_ridotto}",')

# Chiamata
stampa_file_formattati('./public/')
