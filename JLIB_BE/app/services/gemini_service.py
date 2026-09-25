import json
import logging
from google import genai
from google.genai import types
from app.core.config import settings
from app.services.openlibrary_service import format_language_name, remove_diacritics, iast_to_devanagari

logger = logging.getLogger(__name__)

def generate_marathi_summary_gemini(
    client: genai.Client,
    title: str,
    author: str,
    genre: str = "",
    existing_desc: str = ""
) -> str:
    """
    Generates or translates a concise 2-4 sentence summary in Marathi (Devanagari) for a Marathi book.
    """
    prompt = f"""Provide a concise, engaging, 2 to 4 sentence summary/overview of the following Marathi book entirely in Marathi (मराठी देवनागरी लिपी):
Book Title: {title}
Author: {author}
Genre: {genre}
Existing notes/overview: {existing_desc}

Requirements:
- The summary MUST be entirely in fluent, grammatically correct Marathi (मराठी).
- Do not use English words or Latin alphabet.
- Keep it engaging, clear, and informative (2-4 sentences).
- Return ONLY the Marathi text summary, with no quotes, formatting, or preamble.
"""
    models_to_try = [
        'gemini-flash-lite-latest',
        'gemini-3.5-flash-lite',
        'gemini-3.1-flash-lite',
        'gemini-3.7-flash',
        'gemini-3.5-flash',
        'gemini-flash-latest',
    ]
    for model_name in models_to_try:
        try:
            res = client.models.generate_content(
                model=model_name,
                contents=prompt,
            )
            if res and res.text and any("\u0900" <= c <= "\u097F" for c in res.text):
                return res.text.strip().strip('"').strip("'")
        except Exception:
            continue

    return f"'{title}' हे {author or 'प्रसिद्ध लेखक'} यांचे {genre or 'साहित्य'} विषयावरील एक महत्त्वपूर्ण व वाचनीय पुस्तक आहे. या पुस्तकात विषयाचे सखोल विश्लेषण आणि विचारप्रवर्तक मांडणी करण्यात आली आहे."


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

    try:
        client = genai.Client(api_key=api_key)
        prompt = f"""
Find and return the bibliographic details for the book with ISBN "{clean_isbn}" or ISBN-13 "{isbn13}".

CRITICAL LANGUAGE INSTRUCTION FOR MARATHI BOOKS:
- If the book language is Marathi (or if the title, author, or publisher is in Marathi / Devanagari script), the "description" field MUST ALWAYS BE WRITTEN IN MARATHI (मराठी देवनागरी लिपी).
- Never return an English description or summary for a Marathi book.

Return ONLY a valid JSON object matching this schema:
{{
  "title": "Title of the book",
  "nativeTitle": "Title in native language script if applicable",
  "authors": "Author name(s)",
  "publisher": "Publisher name",
  "publishedDate": "Publication year",
  "description": "Short description of the book (MUST be in Marathi if the book is in Marathi)",
  "pageCount": "Number of pages",
  "language": "Language",
  "edition": "Edition",
  "categories": "Categories or genre",
  "coverUrl": "",
  "isbn": "{clean_isbn}"
}}
If the ISBN does not match any known book in your database, return an empty JSON object: {{}}
"""
        models_to_try = [
            'gemini-flash-lite-latest',
            'gemini-3.5-flash-lite',
            'gemini-3.1-flash-lite',
            'gemini-3.7-flash',
            'gemini-3.5-flash',
            'gemini-3.6-flash',
            'gemini-flash-latest',
        ]
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
            if data and isinstance(data, dict):
                raw_title = data.get("title") or data.get("book_title") or data.get("name") or ""
                if raw_title:
                    import re
                    clean_title = re.sub(r'\s*\([A-Za-z\s]+\)$', '', raw_title).strip()
                    native_title = data.get("nativeTitle") or data.get("native_title") or ""
                    authors = data.get("authors") or data.get("author") or ""
                    lang = format_language_name(data.get("language", ""))
                    final_title = remove_diacritics(clean_title)
                    if lang in ("Marathi", "मराठी") or lang.lower() == "marathi":
                        final_native = native_title if (native_title and any("\u0900" <= c <= "\u097F" for c in native_title)) else iast_to_devanagari(native_title or clean_title)
                        raw_desc = data.get("description", "") or ""
                        if not any("\u0900" <= c <= "\u097F" for c in raw_desc):
                            raw_desc = generate_marathi_summary_gemini(client, final_title, authors, data.get("categories", ""), raw_desc)
                        final_desc = raw_desc.strip()
                    else:
                        final_native = final_title
                        final_desc = remove_diacritics(data.get("description", ""))

                    return {
                        "title": final_title,
                        "nativeTitle": final_native,
                        "authors": remove_diacritics(authors),
                        "publisher": remove_diacritics(data.get("publisher", "")),
                        "publishedDate": str(data.get("publishedDate") or data.get("published_date") or data.get("year") or ""),
                        "description": final_desc,
                        "pageCount": str(data.get("pageCount") or data.get("pages") or data.get("page_count") or ""),
                        "language": lang,
                        "edition": data.get("edition", "First edition"),
                        "categories": data.get("categories", ""),
                        "coverUrl": data.get("coverUrl", ""),
                        "isbn": str(data.get("isbn", clean_isbn))
                    }
    except Exception as e:
        logger.error(f"Gemini API lookup error for ISBN {isbn}: {e}")

def _prepare_image_for_gemini(image_bytes: bytes, mime_type: str) -> tuple[bytes, str]:
    """
    Convert HEIC/HEIF images to JPEG for Gemini multimodal API compatibility.
    """
    if "heic" in mime_type.lower() or "heif" in mime_type.lower() or image_bytes[:12].endswith(b'ftypheic') or image_bytes[:12].endswith(b'ftypheif') or image_bytes[:12].endswith(b'ftypmif1'):
        try:
            import io
            import pillow_heif
            from PIL import Image
            pillow_heif.register_heif_opener()
            img = Image.open(io.BytesIO(image_bytes))
            output_io = io.BytesIO()
            img.convert("RGB").save(output_io, format="JPEG", quality=90)
            return output_io.getvalue(), "image/jpeg"
        except Exception as err:
            logger.warning(f"HEIC image conversion error: {err}")
    return image_bytes, mime_type if mime_type else "image/jpeg"


def lookup_book_by_photo_gemini(
    front_bytes: bytes | None = None,
    front_mime: str = "image/jpeg",
    back_bytes: bytes | None = None,
    back_mime: str = "image/jpeg"
) -> dict | None:
    """
    Extract book details from front/back cover photographs using Google Gemini Vision LLM.
    """
    api_key = settings.GEMINI_API_KEY
    if not api_key:
        logger.warning("GEMINI_API_KEY is not set in environment settings.")
        return None

    if not front_bytes and not back_bytes:
        return None

    try:
        client = genai.Client(api_key=api_key)
        contents = []

        if front_bytes:
            proc_bytes, proc_mime = _prepare_image_for_gemini(front_bytes, front_mime)
            contents.append(types.Part.from_bytes(data=proc_bytes, mime_type=proc_mime))

        if back_bytes:
            proc_bytes, proc_mime = _prepare_image_for_gemini(back_bytes, back_mime)
            contents.append(types.Part.from_bytes(data=proc_bytes, mime_type=proc_mime))

        prompt = """
Examine the uploaded book cover photo(s) (front cover and/or back cover).
Extract the exact book metadata visible on the covers or from your catalog knowledge base.

CRITICAL INSTRUCTION FOR BACK COVER & DESCRIPTION:
- If a BACK COVER photo is provided, read the text printed on the back cover (such as the synopsis, blurb, summary, story overview, or author/review notes).
- Take that text (or a clear, engaging 2 to 4 sentence excerpt/summary from the back cover) and put it into the "description" field.
- If only the front cover is provided, generate a concise, informative 2-3 sentence overview of the book's premise/subject for the "description" field.
- Do NOT leave "description" empty.

CRITICAL LANGUAGE INSTRUCTION FOR MARATHI BOOKS:
- If the book is in Marathi (or if the cover, title, or back cover blurb is in Marathi/Devanagari script), the "description" field MUST ALWAYS BE WRITTEN IN MARATHI (मराठी देवनागरी लिपी).
- Even if the back cover text is in English or only front cover is provided, write/translate the synopsis/overview into authentic, fluent Marathi (मराठी).
- Never return an English description or summary for a Marathi book.

CRITICAL INSTRUCTION FOR ISBN:
- STRICT REQUIREMENT: Only return an ISBN if an ISBN barcode or numerical ISBN (e.g. 978-...) is VISIBLY PRINTED on the uploaded photo(s).
- If NO ISBN is visibly printed on the photo(s), you MUST return "" (empty string) for "isbn".
- DO NOT pull, guess, or hallucinate an ISBN from your external knowledge base if it is not visible on the photo.

Return ONLY a valid JSON object matching this schema:
{
  "title": "Title of the book",
  "nativeTitle": "Title in native language script if applicable",
  "authors": "Author name(s)",
  "publisher": "Publisher name",
  "publishedDate": "Publication year",
  "description": "Synopsis or summary extracted from the back cover text, or a concise book overview (MUST be in Marathi if the book is in Marathi)",
  "pageCount": "Number of pages if visible else empty string",
  "language": "Language of the text",
  "edition": "Edition details if visible",
  "categories": "Categories or genre",
  "coverUrl": "",
  "isbn": "ISBN-10 or ISBN-13 barcode text ONLY if visible on the photo, else empty string \"\""
}
"""
        contents.append(prompt)

        models_to_try = [
            'gemini-flash-lite-latest',
            'gemini-3.5-flash-lite',
            'gemini-3.1-flash-lite',
            'gemini-3.7-flash',
            'gemini-3.5-flash',
            'gemini-3.6-flash',
            'gemini-flash-latest',
        ]
        response_text = None

        for model_name in models_to_try:
            try:
                res = client.models.generate_content(
                    model=model_name,
                    contents=contents,
                    config=types.GenerateContentConfig(
                        response_mime_type="application/json"
                    )
                )
                if res and res.text:
                    response_text = res.text
                    break
            except Exception as model_err:
                logger.warning(f"Gemini photo model {model_name} failed: {model_err}")
                continue

        if response_text:
            data = json.loads(response_text.strip())
            if data and isinstance(data, dict):
                raw_title = data.get("title") or data.get("book_title") or data.get("name") or ""
                if raw_title:
                    import re
                    clean_title = re.sub(r'\s*\([A-Za-z\s]+\)$', '', raw_title).strip()
                    native_title = data.get("nativeTitle") or data.get("native_title") or ""
                    authors = data.get("authors") or data.get("author") or ""
                    lang = format_language_name(data.get("language", ""))
                    final_title = remove_diacritics(clean_title)
                    if lang in ("Marathi", "मराठी") or lang.lower() == "marathi":
                        final_native = native_title if (native_title and any("\u0900" <= c <= "\u097F" for c in native_title)) else iast_to_devanagari(native_title or clean_title)
                        raw_desc = data.get("description", "") or ""
                        if not any("\u0900" <= c <= "\u097F" for c in raw_desc):
                            raw_desc = generate_marathi_summary_gemini(client, final_title, authors, data.get("categories", ""), raw_desc)
                        final_desc = raw_desc.strip()
                    else:
                        final_native = final_title
                        final_desc = remove_diacritics(data.get("description", "")) or "N/A"

                    raw_isbn = str(data.get("isbn") or "").strip()
                    clean_isbn_digits = "".join(c for c in raw_isbn if c.isdigit() or c.upper() == 'X')
                    final_isbn = clean_isbn_digits if len(clean_isbn_digits) in (10, 13) else ""

                    return {
                        "title": final_title,
                        "nativeTitle": final_native or "N/A",
                        "authors": remove_diacritics(authors) or "N/A",
                        "publisher": remove_diacritics(data.get("publisher", "")) or "N/A",
                        "publishedDate": str(data.get("publishedDate") or data.get("published_date") or data.get("year") or "").strip() or "N/A",
                        "description": final_desc,
                        "pageCount": str(data.get("pageCount") or data.get("pages") or data.get("page_count") or "").strip() or "N/A",
                        "language": lang or "N/A",
                        "edition": str(data.get("edition") or "").strip() or "N/A",
                        "categories": str(data.get("categories") or "").strip() or "N/A",
                        "coverUrl": data.get("coverUrl", ""),
                        "isbn": final_isbn
                    }
    except Exception as e:
        logger.error(f"Gemini API photo lookup error: {e}")

    return None

