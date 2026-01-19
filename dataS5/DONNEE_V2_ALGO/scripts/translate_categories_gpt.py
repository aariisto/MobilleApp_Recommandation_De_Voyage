<<<<<<< HEAD
import json
import os
import time

try:
    from deep_translator import GoogleTranslator
except Exception as e:
    raise SystemExit(
        "deep-translator est requis. Installez-le avec: pip install deep-translator"
    ) from e


def translate_categories_gpt():
    """
    Traduit en français la valeur de 'categories_gpt' pour chaque ville.
    Crée un nouveau fichier cities_categories_gpt_fr.json.
    """
    script_dir = os.path.dirname(os.path.abspath(__file__))
    base_dir = os.path.dirname(script_dir)

    input_path = os.path.join(base_dir, "cities_categories_gpt_final.json")
    output_path = os.path.join(base_dir, "cities_categories_gpt_fr.json")

    with open(input_path, "r", encoding="utf-8") as f:
        cities_data = json.load(f)

    translator = GoogleTranslator(source="en", target="fr")

    translated_data = []
    total = len(cities_data)

    for index, city in enumerate(cities_data, start=1):
        text = city.get("categories_gpt", "")
        if not text:
            translated_text = text
        else:
            try:
                translated_text = translator.translate(text)
            except Exception:
                translated_text = text

        translated_city = {
            "id": city.get("id"),
            "name": city.get("name"),
            "categories_gpt": translated_text,
        }
        translated_data.append(translated_city)

        if index % 10 == 0 or index == total:
            print(f"{index}/{total} traduits")

        time.sleep(0.1)

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(translated_data, f, indent=2, ensure_ascii=False)

    print(f"\n✅ Fichier sauvegardé: {output_path}")


if __name__ == "__main__":
    translate_categories_gpt()
=======
import json
import os
import time

try:
    from deep_translator import GoogleTranslator
except Exception as e:
    raise SystemExit(
        "deep-translator est requis. Installez-le avec: pip install deep-translator"
    ) from e


def translate_categories_gpt():
    """
    Traduit en français la valeur de 'categories_gpt' pour chaque ville.
    Crée un nouveau fichier cities_categories_gpt_fr.json.
    """
    script_dir = os.path.dirname(os.path.abspath(__file__))
    base_dir = os.path.dirname(script_dir)

    input_path = os.path.join(base_dir, "cities_categories_gpt_final.json")
    output_path = os.path.join(base_dir, "cities_categories_gpt_fr.json")

    with open(input_path, "r", encoding="utf-8") as f:
        cities_data = json.load(f)

    translator = GoogleTranslator(source="en", target="fr")

    translated_data = []
    total = len(cities_data)

    for index, city in enumerate(cities_data, start=1):
        text = city.get("categories_gpt", "")
        if not text:
            translated_text = text
        else:
            try:
                translated_text = translator.translate(text)
            except Exception:
                translated_text = text

        translated_city = {
            "id": city.get("id"),
            "name": city.get("name"),
            "categories_gpt": translated_text,
        }
        translated_data.append(translated_city)

        if index % 10 == 0 or index == total:
            print(f"{index}/{total} traduits")

        time.sleep(0.1)

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(translated_data, f, indent=2, ensure_ascii=False)

    print(f"\n✅ Fichier sauvegardé: {output_path}")


if __name__ == "__main__":
    translate_categories_gpt()
>>>>>>> main
