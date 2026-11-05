"""Build the editable explanatory note from docs/coursework.md using python-docx."""
from pathlib import Path
import re
from docx import Document
from docx.shared import Cm, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_CELL_VERTICAL_ALIGNMENT
from docx.oxml import OxmlElement
from docx.oxml.ns import qn

ROOT = Path(__file__).resolve().parents[1]
LINES = (ROOT / "docs/coursework.md").read_text().splitlines()
doc = Document()
section = doc.sections[0]
section.page_width, section.page_height = Cm(21), Cm(29.7)
section.top_margin = section.bottom_margin = Cm(2)
section.left_margin, section.right_margin = Cm(3), Cm(1.5)
section.different_first_page_header_footer = True
for name in ["Normal", "Title", "Subtitle", "Heading 1", "Heading 2", "Heading 3"]:
    style = doc.styles[name]
    style.font.name = "Times New Roman"
    style.font.color.rgb = RGBColor(0, 0, 0)
    fonts = style.element.get_or_add_rPr().rFonts
    for attr in list(fonts.attrib):
        if "theme" in attr.lower(): del fonts.attrib[attr]
    for attr in ["ascii", "hAnsi", "eastAsia", "cs"]:
        fonts.set(qn(f"w:{attr}"), "Times New Roman")
    for border in style.element.xpath("./w:pPr/w:pBdr"):
        border.getparent().remove(border)
normal = doc.styles["Normal"]
normal.font.size = Pt(14)
normal.paragraph_format.line_spacing = 1.5
normal.paragraph_format.space_after = Pt(6)
normal.paragraph_format.first_line_indent = Cm(1.25)
normal.paragraph_format.widow_control = True
normal.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
for name, size in [("Heading 1", 16), ("Heading 2", 14), ("Heading 3", 14)]:
    style = doc.styles[name]
    style.font.size = Pt(size)
    style.font.bold = True
    style.paragraph_format.space_before = Pt(15)
    style.paragraph_format.space_after = Pt(10)
    style.paragraph_format.first_line_indent = Cm(0)
    style.paragraph_format.keep_with_next = True
    style.paragraph_format.line_spacing = 1.25
    style.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.LEFT
doc.styles["Title"].font.size = Pt(21)
doc.styles["Title"].font.bold = True
doc.styles["Title"].paragraph_format.first_line_indent = Cm(0)
doc.core_properties.title = "Приложение для планирования учебного семестра"
doc.core_properties.subject = "Курсовая работа по веб-программированию II"
doc.core_properties.author = "arniiii"
doc.core_properties.last_modified_by = "arniiii"
doc.core_properties.comments = ""


def centered(text, size=14, space_before=0, space_after=8, style=None):
    p = doc.add_paragraph(style=style)
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.first_line_indent = Cm(0)
    p.paragraph_format.space_before = Pt(space_before)
    p.paragraph_format.space_after = Pt(space_after)
    run = p.add_run(text)
    run.font.size = Pt(size)
    return p


centered("КУРСОВАЯ РАБОТА", 16, 70, 15)
centered("по дисциплине Веб-программирование II", 14, 0, 55)
centered("Приложение для планирования\nучебного семестра", 21, 0, 22, "Title")
centered("Пояснительная записка", 14, 0, 70)
for text in ["Выполнил  ______________________________", "Группа  _________________________________", "Руководитель  ___________________________"]:
    p = doc.add_paragraph(text)
    p.paragraph_format.first_line_indent = Cm(0)
    p.paragraph_format.left_indent = Cm(6)
    p.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.LEFT
    p.paragraph_format.space_after = Pt(8)
    for run in p.runs: run.font.size = Pt(12)
centered("2026", 14, 50)
doc.add_page_break()
doc.add_heading("Содержание", 1)
for line in LINES:
    if line.startswith("## ") or line.startswith("### "):
        level = 2 if line.startswith("### ") else 1
        p = doc.add_paragraph(line.lstrip("# "))
        p.paragraph_format.first_line_indent = Cm(0)
        p.paragraph_format.left_indent = Cm(0.65 if level == 2 else 0)
        p.paragraph_format.line_spacing = 1.1
        p.paragraph_format.space_after = Pt(4 if level == 1 else 2)
        for run in p.runs:
            run.font.size = Pt(11 if level == 2 else 12)
            run.bold = level == 1


def inline(paragraph, text):
    for piece in re.split(r"(`[^`]+`|\*\*[^*]+\*\*)", text):
        if piece.startswith("`") and piece.endswith("`"):
            run = paragraph.add_run(piece[1:-1]); run.font.name = "Courier New"; run.font.size = Pt(11)
        elif piece.startswith("**") and piece.endswith("**"):
            paragraph.add_run(piece[2:-2]).bold = True
        else:
            paragraph.add_run(piece)


def table(rows):
    content = [row for row in rows if not re.fullmatch(r"[\s|:\-]+", row)]
    cells = [[cell.strip() for cell in row.strip("|").split("|")] for row in content]
    result = doc.add_table(rows=0, cols=len(cells[0]))
    result.alignment = WD_TABLE_ALIGNMENT.CENTER
    result.autofit = False
    widths = [3.2, 8.0, 5.3] if len(cells[0]) == 3 else [4.2, 12.3]
    total = 16.5
    factor = total / sum(widths)
    widths = [value * factor for value in widths]
    for index, width in enumerate(widths):
        result.columns[index].width = Cm(width)
    for row_index, values in enumerate(cells):
        row = result.add_row()
        trpr = row._tr.get_or_add_trPr()
        trpr.append(OxmlElement("w:cantSplit"))
        if row_index == 0: trpr.append(OxmlElement("w:tblHeader"))
        for col, value in enumerate(values):
            cell = row.cells[col]
            cell.width = Cm(widths[col])
            cell.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER
            props = cell._tc.get_or_add_tcPr()
            borders = OxmlElement("w:tcBorders")
            for side in ["top", "left", "bottom", "right"]:
                border = OxmlElement(f"w:{side}")
                for key, val in {"val": "single", "sz": "5", "color": "D9D9D9"}.items(): border.set(qn(f"w:{key}"), val)
                borders.append(border)
            props.append(borders)
            margins = OxmlElement("w:tcMar")
            for side, val in [("top", "100"), ("bottom", "100"), ("left", "110"), ("right", "110")]:
                margin = OxmlElement(f"w:{side}"); margin.set(qn("w:w"), val); margin.set(qn("w:type"), "dxa"); margins.append(margin)
            props.append(margins)
            if row_index == 0:
                shading = OxmlElement("w:shd"); shading.set(qn("w:fill"), "E8EDF1"); props.append(shading)
            p = cell.paragraphs[0]
            p.paragraph_format.first_line_indent = Cm(0)
            p.paragraph_format.line_spacing = 1.1
            p.paragraph_format.space_after = Pt(0)
            p.alignment = WD_ALIGN_PARAGRAPH.LEFT
            inline(p, value)
            for run in p.runs: run.font.size = Pt(11); run.bold = row_index == 0
    after = doc.add_paragraph()
    after.paragraph_format.space_after = Pt(2)
    after.paragraph_format.line_spacing = 0.5


i = 0
while i < len(LINES):
    line = LINES[i]
    if not line or line.startswith("# "):
        i += 1; continue
    if line.startswith("## "):
        heading = doc.add_heading(line[3:], 1)
        heading.paragraph_format.page_break_before = True
    elif line.startswith("### "):
        doc.add_heading(line[4:], 2)
    elif line.startswith("|"):
        rows = []
        while i < len(LINES) and LINES[i].startswith("|"):
            rows.append(LINES[i]); i += 1
        table(rows)
        continue
    else:
        p = doc.add_paragraph()
        inline(p, line)
        if re.match(r"^\d+\. ", line):
            p.paragraph_format.first_line_indent = Cm(0)
            p.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.LEFT
            for run in p.runs: run.font.size = Pt(11)
    i += 1

screenshots = [("overview.jpg", "Обзор учебного плана"), ("search.jpg", "Поиск задания и фильтр по статусу")]
available = [(name, label) for name, label in screenshots if (ROOT / "docs/screenshots" / name).exists()]
if available:
    heading = doc.add_heading("Приложение А Интерфейс приложения", 1)
    heading.paragraph_format.page_break_before = True
    for index, (name, label) in enumerate(available, 1):
        p = doc.add_paragraph()
        p.paragraph_format.first_line_indent = Cm(0)
        p.paragraph_format.keep_with_next = True
        p.add_run().add_picture(str(ROOT / "docs/screenshots" / name), width=Cm(15.3))
        caption = doc.add_paragraph(f"Рисунок А{index}  {label}")
        caption.paragraph_format.first_line_indent = Cm(0)
        caption.alignment = WD_ALIGN_PARAGRAPH.CENTER
        for run in caption.runs: run.font.size = Pt(11)

footer = section.footer.paragraphs[0]
footer.alignment = WD_ALIGN_PARAGRAPH.CENTER
footer.paragraph_format.first_line_indent = Cm(0)
field = OxmlElement("w:fldSimple"); field.set(qn("w:instr"), "PAGE"); footer._p.append(field)
doc.save(ROOT / "docs/coursework.docx")
print(ROOT / "docs/coursework.docx")
