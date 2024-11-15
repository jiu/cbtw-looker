import pandas as pd
from docx import Document

# Charger le fichier Excel
df = pd.read_excel('SEO audit - CBTW.xlsx', sheet_name='Technical')

# Créer un document Word
doc = Document()

# Filtrer les lignes et colonnes avec la valeur souhaitée
valeur_cible = 'Error'
filtered_df = df[df.isin([valeur_cible]).any(axis=1)]

# Ajouter les données filtrées au document Word
for i, row in filtered_df.iterrows():
    doc.add_paragraph('\t'.join(str(x) for x in row.values))

# Sauvegarder le fichier Word
doc.save('audit-seo.docx')
