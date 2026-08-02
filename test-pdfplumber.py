import pdfplumber
import json

def parse_pdf():
    try:
        with pdfplumber.open("forecast.pdf") as pdf:
            page = pdf.pages[0]
            # Extract tables
            table = page.extract_table()
            
            # Since IMD PDFs might use colored rects, let's also check for rects
            colors = set()
            if page.rects:
                for rect in page.rects:
                    color = rect.get('non_stroking_color')
                    if color is not None:
                        if isinstance(color, (list, tuple)):
                            colors.add(tuple(color))
                        else:
                            colors.add(color)
            
            print(json.dumps({"table": table, "colors": list(colors)}))
    except Exception as e:
        print(json.dumps({"error": str(e)}))

if __name__ == "__main__":
    parse_pdf()
