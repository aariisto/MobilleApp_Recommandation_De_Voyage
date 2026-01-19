import json
import os
import requests
import time
from PIL import Image
from io import BytesIO

# Configuration
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
JSON_PATH = os.path.join(SCRIPT_DIR, "../DONNEE_V2_ALGO/cities_categories_gpt_final.json")
OUTPUT_DIR = os.path.join(SCRIPT_DIR, "../../frontend/assets/city_images")
JS_OUTPUT_PATH = os.path.join(SCRIPT_DIR, "../../frontend/src/data/cityImages.js")
UNSPLASH_ACCESS_KEY = os.getenv("UNSPLASH_ACCESS_KEY")

# Create directories
os.makedirs(OUTPUT_DIR, exist_ok=True)
os.makedirs(os.path.dirname(JS_OUTPUT_PATH), exist_ok=True)

def search_unsplash(query):
    if not UNSPLASH_ACCESS_KEY:
        raise ValueError("Please set UNSPLASH_ACCESS_KEY environment variable")
    
    url = "https://api.unsplash.com/search/photos"
    params = {
        "query": f"{query} city travel landmark",
        "per_page": 1,
        "orientation": "landscape"
    }
    headers = {
        "Authorization": f"Client-ID {UNSPLASH_ACCESS_KEY}"
    }
    
    response = requests.get(url, params=params, headers=headers)
    if response.status_code == 200:
        data = response.json()
        if data['results']:
            return data['results'][0]['urls']['regular']
    elif response.status_code in [403, 429]:
        print(f"   [API Critical Error] {response.status_code}: Rate Limit Reached or Forbidden.")
        raise Exception("STOP_script_rate_limit")
    else:
        print(f"   [API Error] {response.status_code}: {response.text}")
    return None

def download_and_optimize(url, filename):
    try:
        response = requests.get(url)
        if response.status_code == 200:
            img = Image.open(BytesIO(response.content))
            
            # Convert to RGB if necessary
            if img.mode in ("RGBA", "P"):
                img = img.convert("RGB")
            
            # Resize (max width 800px)
            max_width = 800
            w_percent = (max_width / float(img.size[0]))
            h_size = int((float(img.size[1]) * float(w_percent)))
            img = img.resize((max_width, h_size), Image.Resampling.LANCZOS)
            
            # Save as WebP
            output_path = os.path.join(OUTPUT_DIR, filename)
            img.save(output_path, "WEBP", quality=80)
            return True
    except Exception as e:
        print(f"Error processing {url}: {e}")
    return False

def main():
    if not os.path.exists(JSON_PATH):
        print(f"File not found: {JSON_PATH}")
        return

    with open(JSON_PATH, 'r', encoding='utf-8') as f:
        cities = json.load(f)

    js_mapping = "const cityImages = {\n"
    
    total = len(cities)
    print(f"Found {total} cities to process.")

    for i, city in enumerate(cities):
        name = city['name']
        safe_name = name.replace(" ", "_").replace(".", "").replace("-", "_") # clean name for filename
        filename = f"{safe_name}.webp"
        
        # Check if already exists to skip
        if os.path.exists(os.path.join(OUTPUT_DIR, filename)):
            print(f"[{i+1}/{total}] Skipping {name} (already exists)")
        else:
            print(f"[{i+1}/{total}] Downloading {name}...")
            try:
                url = search_unsplash(name)
                if url:
                    success = download_and_optimize(url, filename)
                    if success:
                        print(f"   -> Saved {filename}")
                    else:
                        print(f"   -> Failed to download/save")
                else:
                    print(f"   -> No image found on Unsplash")
            except Exception as e:
                if "STOP_script_rate_limit" in str(e):
                    print("\n🛑 ARRÊT D'URGENCE: Limite API atteinte.")
                    print("Redémarrez le script plus tard avec une nouvelle clé.")
                    break
                print(f"   -> Error: {e}")
            
            # Respect API limits (50 requests/hr for free tier generally, but demo is 50/hr)
            # Assuming user has a key, we sleep a bit just in case.
            time.sleep(1) 

        # Add to JS mapping ONLY if file exists
        if os.path.exists(os.path.join(OUTPUT_DIR, filename)):
             js_mapping += f"  '{name}': require('../../assets/city_images/{filename}'),\n"

    js_mapping += "};\n\nexport default cityImages;"

    with open(JS_OUTPUT_PATH, 'w', encoding='utf-8') as f:
        f.write(js_mapping)
    
    print(f"\nProcessing complete!")
    print(f"Images saved in: {OUTPUT_DIR}")
    print(f"Mapping file created at: {JS_OUTPUT_PATH}")

if __name__ == "__main__":
    if not UNSPLASH_ACCESS_KEY:
        print("⚠️  WARNING: UNSPLASH_ACCESS_KEY is not set.")
        key = input("Enter your Unsplash Access Key: ").strip()
        if key:
            UNSPLASH_ACCESS_KEY = key
            os.environ["UNSPLASH_ACCESS_KEY"] = key
            main()
        else:
            print("Cannot proceed without API key.")
    else:
        main()
