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

    try:
        client = genai.Client(api_key=api_key)
        prompt = f"""
Find and return the bibliographic details for the book with ISBN "{clean_isbn}" or ISBN-13 "{isbn13}".

Return ONLY a valid JSON object matching this schema:
{{
  "title": "Title of the book",
  "nativeTitle": "Title in native language script if applicable",
  "authors": "Author name(s)",
  "publisher": "Publisher name",
  "publishedDate": "Publication year",
  "description": "Short description of the book",
  "pageCount": "Number of pages",
  "language": "Language",
  "edition": "Edition",
  "categories": "Categories or genre",
  "coverUrl": "",
  "isbn": "{clean_isbn}"
}}
If the ISBN does not match any known book in your database, return an empty JSON object: {{}}
"""
        models_to_try = ['gemini-3.5-flash', 'gemini-3.6-flash', 'gemini-flash-latest']
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

                    return {
                        "title": clean_title,
                        "nativeTitle": native_title,
                        "authors": authors,
                        "publisher": data.get("publisher", ""),
                        "publishedDate": str(data.get("publishedDate") or data.get("published_date") or data.get("year") or ""),
                        "description": data.get("description", ""),
                        "pageCount": str(data.get("pageCount") or data.get("pages") or data.get("page_count") or ""),
                        "language": data.get("language", ""),
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
Examine the uploaded book cover photo(s) (front cover, back cover, spine, title/copyright page).
Extract the exact book metadata visible on the covers or from your catalog knowledge base.

Return ONLY a valid JSON object matching this schema:
{
  "title": "Title of the book",
  "nativeTitle": "Title in native language script if applicable",
  "authors": "Author name(s)",
  "publisher": "Publisher name",
  "publishedDate": "Publication year",
  "description": "Short summary or description from back cover text",
  "pageCount": "Number of pages if visible else empty string",
  "language": "Language of the text",
  "edition": "Edition details if visible",
  "categories": "Categories or genre",
  "coverUrl": "",
  "isbn": "ISBN-10 or ISBN-13 barcode text if visible"
}
"""
        contents.append(prompt)

        models_to_try = ['gemini-3.5-flash', 'gemini-3.6-flash', 'gemini-flash-latest']
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

                    return {
                        "title": clean_title,
                        "nativeTitle": native_title,
                        "authors": authors,
                        "publisher": data.get("publisher", ""),
                        "publishedDate": str(data.get("publishedDate") or data.get("published_date") or data.get("year") or ""),
                        "description": data.get("description", ""),
                        "pageCount": str(data.get("pageCount") or data.get("pages") or data.get("page_count") or ""),
                        "language": data.get("language", ""),
                        "edition": data.get("edition", "First edition"),
                        "categories": data.get("categories", ""),
                        "coverUrl": data.get("coverUrl", ""),
                        "isbn": str(data.get("isbn", ""))
                    }
    except Exception as e:
        logger.error(f"Gemini API photo lookup error: {e}")

    return None

