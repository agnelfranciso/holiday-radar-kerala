import PyPDF2

try:
    with open('forecast.pdf', 'rb') as f:
        reader = PyPDF2.PdfReader(f)
        text = ""
        for page in reader.pages:
            text += page.extract_text()
        print(text)
except Exception as e:
    print("Error:", e)
