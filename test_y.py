import pdfplumber

with pdfplumber.open('forecast.pdf') as pdf:
    page = pdf.pages[0]
    
    colored_rects = []
    for rect in page.rects:
        color = rect.get('non_stroking_color')
        if isinstance(color, (list, tuple)) and len(color) >= 3:
            if color[0] == color[1] == color[2]:
                continue
            colored_rects.append(rect)
            
    for r in colored_rects:
        if round(r['top']) == 174:
            print(f"Thiruvananthapuram Rect: x0={r['x0']:.1f}, x1={r['x1']:.1f}, color={r['non_stroking_color']}")
            
    for r in colored_rects:
        if round(r['top']) == 648:
            print(f"Kasaragode Rect: x0={r['x0']:.1f}, x1={r['x1']:.1f}, color={r['non_stroking_color']}")
