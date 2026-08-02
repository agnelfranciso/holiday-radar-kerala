import pdfplumber
import json
import urllib.request
import os

def map_rgb_to_color(rgb):
    if not isinstance(rgb, (list, tuple)) or len(rgb) < 3:
        return None
    r, g, b = rgb[0], rgb[1], rgb[2]
    
    # Yellow is high R, high G, low B
    if r > 0.8 and g > 0.8 and b < 0.5:
        return "yellow"
    # Orange is high R, medium G, low B
    elif r > 0.8 and g > 0.3 and g < 0.8 and b < 0.3:
        return "orange"
    # Red is high R, low G, low B
    elif r > 0.8 and g < 0.5 and b < 0.5:
        return "red"
    # Green is low R, high G, low B
    elif r < 0.5 and g > 0.5 and b < 0.5:
        return "green"
    
    return None

def fetch_and_parse():
    url = "https://mausam.imd.gov.in/thiruvananthapuram/mcdata/district_rainfall_forecast.pdf"
    pdf_path = "latest_forecast.pdf"
    
    try:
        urllib.request.urlretrieve(url, pdf_path)
    except Exception as e:
        return {"error": f"Failed to download PDF: {str(e)}"}
        
    try:
        with pdfplumber.open(pdf_path) as pdf:
            page = pdf.pages[0]
            
            # Find all colored rects (exclude white/black/gray)
            colored_rects = []
            for rect in page.rects:
                color = rect.get('non_stroking_color')
                if isinstance(color, (list, tuple)) and len(color) >= 3:
                    # Ignore white/gray
                    if color[0] == color[1] == color[2]:
                        continue
                    colored_rects.append(rect)
            
            # Extract text to find district Y coordinates (only left column to avoid map labels)
            words = page.extract_words()
            left_words = [w for w in words if w['x0'] < 120]
            
            districts = ["Thiruvananthapuram", "Kollam", "Pathanamthitta", "Alappuzha", 
                         "Kottayam", "Idukki", "Ernakulam", "Thrissur", "Palakkad", 
                         "Malappuram", "Kozhikode", "Wayanad", "Kannur", "Kasaragode", "Kasaragod"]
            
            # Find Y coordinates for each district
            district_y = {}
            for word in left_words:
                text = word['text'].replace('Thiruvananthap', 'Thiruvananthapuram').strip()
                for d in districts:
                    if d in text or text in d:
                        # Some words might just be "uram", skip those unless we match exactly or prefix
                        if len(text) > 4:
                            district_y[d] = word['top']
            
            results = []
            # For each district, find the rects that are on the same Y level
            for dist, top_y in district_y.items():
                if dist == "Kasaragod": dist = "Kasaragode"
                
                # Find rects that intersect this Y coordinate (tighter tolerance to avoid other rows)
                row_rects = []
                for rect in colored_rects:
                    if rect['top'] <= top_y + 10 and rect['bottom'] >= top_y - 10:
                        row_rects.append(rect)
                
                # Sort rects by X coordinate (left to right)
                row_rects.sort(key=lambda r: r['x0'])
                
                # Filter out very thin rects (like borders)
                row_rects = [r for r in row_rects if (r['x1'] - r['x0']) > 20]
                
                # Define approximate X centers for the 5 days
                # Today: ~218, Tomorrow: ~292, Day 3: ~366, Day 4: ~440, Day 5: ~514
                centers = [218, 292, 366, 440, 514]
                day_colors = ["green", "green", "green", "green", "green"]
                
                for idx, cx in enumerate(centers):
                    for r in row_rects:
                        if r['x0'] <= cx <= r['x1']:
                            c = map_rgb_to_color(r['non_stroking_color'])
                            if c:
                                day_colors[idx] = c
                                break
                            
                if not any(r['district'] == dist for r in results):
                    results.append({
                        "district": dist,
                        "today": day_colors[0],
                        "tomorrow": day_colors[1],
                        "day_after": day_colors[2],
                        "day_4": day_colors[3],
                        "day_5": day_colors[4]
                    })
            
            # Sort to match standard IMD order
            order = {d: i for i, d in enumerate(districts)}
            results.sort(key=lambda x: order.get(x['district'], 100))
            
            return {"status": "success", "data": results}
    except Exception as e:
        import traceback
        return {"error": f"Parsing failed: {str(e)}\n{traceback.format_exc()}"}
    finally:
        if os.path.exists(pdf_path):
            try:
                os.remove(pdf_path)
            except:
                pass

if __name__ == "__main__":
    result = fetch_and_parse()
    print(json.dumps(result))
