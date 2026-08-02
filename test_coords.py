import pdfplumber
import os

pdf_path = "latest_forecast.pdf"
with pdfplumber.open(pdf_path) as pdf:
    page = pdf.pages[0]
    words = page.extract_words()
    y = [w['top'] for w in words if 'Thrissur' in w['text']][0]
    colored = [r for r in page.rects if r.get('non_stroking_color') and isinstance(r['non_stroking_color'], (list,tuple)) and len(r['non_stroking_color'])>=3 and r['non_stroking_color'][0]!=r['non_stroking_color'][1]]
    row = [r for r in colored if r['top'] <= y + 25 and r['bottom'] >= y - 25 and (r['x1']-r['x0'])>20]
    
    # define centers
    centers = [218, 292, 366, 440, 514]
    for idx, c in enumerate(centers):
        for r in row:
            if r['x0'] <= c <= r['x1']:
                print(f"Day {idx+1}: {r['non_stroking_color']}")
                break
