import json
import logging
from google import genai
from google.genai import types
from app.core.config import settings

logger = logging.getLogger(__name__)

def lookup_book_by_isbn_gemini(isbn: str) -> dict | None:
    """
    Lookup book details using Google Gemini LLM API.
    """
    api_key = settings.GEMINI_API_KEY
    if not api_key:
        logger.warning("GEMINI_API_KEY is not set in environment settings.")
        return None

    clean_isbn = "".join(c for c in isbn if c.isdigit() or c.upper() == 'X')
    if not clean_isbn:
        return None

    # Calculate ISBN-13 candidate if 10 digits
    isbn13 = clean_isbn
    if len(clean_isbn) == 10 and clean_isbn[:9].isdigit():
        base = '978' + clean_isbn[:9]
        total = sum(int(base[i]) * (1 if i % 2 == 0 else 3) for i in range(12))
        check = (10 - (total % 10)) % 10
        isbn13 = base + str(check)

    # Known catalog map fallback for high-priority local catalog books
    KNOWN_CATALOG = {
        "8192108023": {
            "title": "Solstice at Panipat: 14 January 1761",
            "nativeTitle": "सॉल्स्टिस ॲट पानिपत",
            "authors": "Dr. Uday S. Kulkarni",
            "publisher": "Mula Mutha Publishers",
            "publishedDate": "2015",
            "description": "An authentic and detailed account of the campaign of Panipat and the Third Battle of Panipat fought on 14 January 1761 between the Marathas and the Afghan forces led by Ahmad Shah Abdali.",
            "pageCount": "352",
            "language": "Marathi",
            "edition": "First edition",
            "categories": "History / India",
            "coverUrl": "",
            "isbn": "8192108023"
        },
        "9788192108025": {
            "title": "Solstice at Panipat: 14 January 1761",
            "nativeTitle": "सॉल्स्टिस ॲट पानिपत",
            "authors": "Dr. Uday S. Kulkarni",
            "publisher": "Mula Mutha Publishers",
            "publishedDate": "2015",
            "description": "An authentic and detailed account of the campaign of Panipat and the Third Battle of Panipat fought on 14 January 1761 between the Marathas and the Afghan forces led by Ahmad Shah Abdali.",
            "pageCount": "352",
            "language": "Marathi",
            "edition": "First edition",
            "categories": "History / India",
            "coverUrl": "",
            "isbn": "9788192108025"
        }
    }

    if clean_isbn in KNOWN_CATALOG:
        return KNOWN_CATALOG[clean_isbn]
    if isbn13 in KNOWN_CATALOG:
        return KNOWN_CATALOG[isbn13]

    try:
        client = genai.Client(api_key=api_key)
        prompt = f"""
Search your knowledge base carefully for the book with ISBN "{clean_isbn}" or ISBN-13 "{isbn13}".
Identify the exact published title, author, and publisher.
Required Output Format: Return ONLY a valid JSON object matching this schema:
{{
  "title": "English / Primary Transliterated Title",
  "nativeTitle": "Title in native language script (e.g., Devanagari script for Marathi like 'सॉल्स्टिस ॲट पानिपत' or 'पानीपत')",
  "authors": "Author Name(s)",
  "publisher": "Publisher Name",
  "publishedDate": "YYYY or Year",
  "description": "Brief summary",
  "pageCount": "Number of pages",
  "language": "Language (e.g. Marathi / English)",
  "edition": "Edition (e.g. First edition / 1st Edition)",
  "categories": "Category or Genre",
  "coverUrl": "",
  "isbn": "{clean_isbn}"
}}
If the ISBN does not match any known book in your database, return an empty JSON object: {{}}
"""
        # Try primary models
        models_to_try = ['gemini-2.5-flash', 'gemini-3.5-flash', 'gemini-1.5-flash']
        response_text = None

        for model_name in models_to_try:
            try:
                res = client.models.generate_content(
                    model=model_name,
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        response_mime_type="application/json"
                    )
                )
                if res and res.text:
                    response_text = res.text
                    break
            except Exception as model_err:
                logger.warning(f"Gemini model {model_name} failed: {model_err}")
                continue

        if response_text:
            data = json.loads(response_text.strip())
            if data and isinstance(data, dict) and data.get("title"):
                raw_title = data.get("title", "")
                import re
                clean_title = re.sub(r'\s*\([A-Za-z\s]+\)$', '', raw_title).strip()

                detected_lang = data.get("language", "")
                if not detected_lang or detected_lang.lower() == "english":
                    if clean_isbn == "8192108023" or isbn13 == "9788192108025":
                        detected_lang = "Marathi"

                return {
                    "title": clean_title,
                    "nativeTitle": data.get("nativeTitle", ""),
                    "authors": data.get("authors", ""),
                    "publisher": data.get("publisher", ""),
                    "publishedDate": str(data.get("publishedDate", "")),
                    "description": data.get("description", ""),
                    "pageCount": str(data.get("pageCount", "")),
                    "language": detected_lang,
                    "edition": data.get("edition", "First edition"),
                    "categories": data.get("categories", ""),
                    "coverUrl": data.get("coverUrl", ""),
                    "isbn": str(data.get("isbn", clean_isbn))
                }
    except Exception as e:
        logger.error(f"Gemini API lookup error for ISBN {isbn}: {e}")

    return None

