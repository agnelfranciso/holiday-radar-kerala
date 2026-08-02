import urllib.request
import json

def fetch_geojson():
    url = "https://raw.githubusercontent.com/geohacker/kerala/master/geojsons/district.geojson"
    try:
        req = urllib.request.urlopen(url)
        data = json.loads(req.read())
        
        with open("web-app/src/kerala-districts.json", "w") as f:
            json.dump(data, f)
        print("GeoJSON saved successfully!")
    except Exception as e:
        print(f"Failed to fetch GeoJSON: {str(e)}")

if __name__ == "__main__":
    fetch_geojson()
