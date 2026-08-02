import pdfplumber
import json

def get_color_from_rects(cell_bbox, rects):
    # bbox is (x0, top, x1, bottom)
    x0, top, x1, bottom = cell_bbox
    
    best_overlap = 0
    best_color = None
    
    for rect in rects:
        rx0, rtop, rx1, rbottom = rect['x0'], rect['top'], rect['x1'], rect['bottom']
        
        # Calculate overlap
        overlap_x = max(0, min(x1, rx1) - max(x0, rx0))
        overlap_y = max(0, min(bottom, rbottom) - max(top, rtop))
        overlap_area = overlap_x * overlap_y
        
        if overlap_area > best_overlap:
            color = rect.get('non_stroking_color')
            if color is not None:
                if isinstance(color, (list, tuple)):
                    best_overlap = overlap_area
                    best_color = tuple(color)
                # We ignore single float grayscale colors because they are just borders/text/white backgrounds
                
    return best_color

def parse_pdf():
    try:
        with pdfplumber.open("forecast.pdf") as pdf:
            page = pdf.pages[0]
            tables = page.find_tables()
            if not tables:
                print(json.dumps({"error": "No tables found"}))
                return
                
            table = tables[0]
            cells = table.cells
            
            results = []
            rects = page.rects
            
            for row_idx, row in enumerate(cells):
                if row_idx > 4:
                    break
                row_data = []
                for col_idx, cell in enumerate(row):
                    if cell:
                        color = get_color_from_rects(cell, rects)
                        text = page.crop(cell).extract_text()
                        row_data.append({"text": text.replace('\n', ' ') if text else "", "color": color})
                    else:
                        row_data.append(None)
                results.append(row_data)
                
            print(json.dumps({"debug_rows": results}))
    except Exception as e:
        import traceback
        print(json.dumps({"error": str(e), "traceback": traceback.format_exc()}))

if __name__ == "__main__":
    parse_pdf()
