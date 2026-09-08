"""Render the checked-in jury memo without adding claims or submission fields."""
from pathlib import Path
import html
import json
import hashlib
from reportlab import rl_config
rl_config.invariant = 1
import re
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, KeepTogether
from pypdf import PdfReader

root = Path(__file__).resolve().parents[2]
source = (root / 'docs/contest/jury-memo.md').read_text(encoding='utf-8')
if len(source.split()) > 1000:
    raise ValueError('La memoria supera 1.000 palabras')
styles = getSampleStyleSheet()
styles.add(ParagraphStyle(name='MemoBody', fontName='Helvetica', fontSize=10, leading=14, spaceAfter=8, textColor=colors.HexColor('#243f3c')))
styles.add(ParagraphStyle(name='MemoTitle', fontName='Helvetica-Bold', fontSize=23, leading=27, spaceAfter=17, textColor=colors.HexColor('#124e46')))
styles.add(ParagraphStyle(name='MemoHeading', fontName='Helvetica-Bold', fontSize=12, leading=16, spaceBefore=9, spaceAfter=5, textColor=colors.HexColor('#124e46'), keepWithNext=True))

def inline(text):
    text = html.escape(text)
    text = re.sub(r'\*\*(.*?)\*\*', r'<b>\1</b>', text)
    text = re.sub(r'\[([^]]+)\]\((https?://[^)]+)\)', r'<a href="\2" color="#12675b">\1</a>', text)
    return text

story = []
web = []
for block in source.strip().split('\n\n'):
    if block.startswith('# '):
        text = block[2:]; style = 'MemoTitle'; tag = 'h1'
    elif block.startswith('## '):
        text = block[3:]; style = 'MemoHeading'; tag = 'h2'
    else:
        text = block.replace('\n',' '); style = 'MemoBody'; tag = 'p'
    story.append(Paragraph(inline(text), styles[style]))
    web.append(f'<{tag}>{inline(text)}</{tag}>')

out = root / 'public/candidatura.pdf'
doc = SimpleDocTemplate(str(out), pagesize=A4, rightMargin=48, leftMargin=48, topMargin=42, bottomMargin=40, title='SALIDA CyL - Memoria de candidatura 2026', author='SALIDA CyL')
def footer(canvas, document):
    canvas.setFont('Helvetica',8); canvas.setFillColor(colors.HexColor('#47635d'))
    canvas.drawRightString(A4[0]-48,24,str(document.page))
doc.build(story,onFirstPage=footer,onLaterPages=footer)
reader=PdfReader(out)
words=sum(len(page.extract_text().split()) for page in reader.pages)
if words>1000: raise ValueError('El PDF supera 1.000 palabras')
publication = json.loads((root / 'config/publication.json').read_text(encoding='utf-8'))
canonical = html.escape(publication['canonicalRootUrl'] + 'candidatura.html', quote=True)
description = 'Memoria de SALIDA CyL para el X Concurso de Datos Abiertos de Castilla y León 2026: utilidad, fuentes, cobertura y límites.'
social = html.escape(publication['canonicalRootUrl'] + 'salida-cyl-social.png', quote=True)
head = f"""<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>SALIDA CyL · Candidatura 2026</title><meta name="description" content="{description}"><link rel="canonical" href="{canonical}"><meta property="og:title" content="SALIDA CyL · Candidatura 2026"><meta property="og:description" content="{description}"><meta property="og:type" content="website"><meta property="og:url" content="{canonical}"><meta property="og:image" content="{social}"><meta name="twitter:card" content="summary_large_image"><link rel="stylesheet" href="candidatura.css"></head><body><main><nav><a href="./">Abrir SALIDA CyL</a> · <a href="candidatura.pdf">Descargar memoria PDF</a></nav>"""
(root/'public/candidatura.html').write_text(head+''.join(web)+'</main></body></html>\n',encoding='utf-8', newline='\n')
print(f'Memoria: {words} palabras, {len(reader.pages)} páginas, {out.stat().st_size} bytes')

(root / "public/candidatura.css").write_text('body{font:17px/1.6 system-ui,sans-serif;color:#243f3c;background:#fafaf7;margin:0}main{max-width:760px;padding:36px 24px;margin:auto}h1{font-size:2rem;line-height:1.2;color:#124e46}h2{font-size:1.2rem;color:#124e46;margin-top:28px}a{color:#12675b}nav{margin-bottom:28px}@media print{nav{display:none}}\n', encoding="utf-8", newline="\n")

files = ['docs/contest/jury-memo.md', 'scripts/release/renderJuryMemoPdf.py', 'config/publication.json', 'public/candidatura.html', 'public/candidatura.css', 'public/candidatura.pdf']
manifest = {'schemaVersion': 1, 'pdfWords': words, 'pdfPages': len(reader.pages), 'sha256': {name: hashlib.sha256((root / name).read_bytes()).hexdigest() for name in files}}
(root/'docs/contest/memo-artifacts.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2)+'\n',encoding='utf-8', newline='\n')
