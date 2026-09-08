"""Render the checked-in jury memo without adding claims or submission fields."""
from pathlib import Path
import html
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
(root/'public/candidatura.html').write_text('''<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>SALIDA CyL · Candidatura 2026</title><style>body{font:17px/1.6 system-ui,sans-serif;color:#243f3c;background:#fafaf7;margin:0}main{max-width:760px;padding:36px 24px;margin:auto}h1{font-size:2rem;line-height:1.2;color:#124e46}h2{font-size:1.2rem;color:#124e46;margin-top:28px}a{color:#12675b}nav{margin-bottom:28px}@media print{nav{display:none}}</style><main><nav><a href="./">Abrir SALIDA CyL</a> · <a href="candidatura.pdf">Descargar memoria PDF</a></nav>'''+''.join(web)+'</main></html>\n',encoding='utf-8')
print(f'Memoria: {words} palabras, {len(reader.pages)} páginas, {out.stat().st_size} bytes')
