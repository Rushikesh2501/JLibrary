import json
import logging
import ssl
import urllib.request
import urllib.error

logger = logging.getLogger(__name__)


def _get_ssl_context():
    try:
        import certifi
    except Exception:
        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE
        return ctx


LANGUAGE_MAP = {
    "eng": "English", "en": "English", "english": "English",
    "hin": "Hindi", "hi": "Hindi", "hindi": "Hindi",
    "mar": "Marathi", "mr": "Marathi", "marathi": "Marathi",
    "san": "Sanskrit", "sa": "Sanskrit", "sanskrit": "Sanskrit",
    "tam": "Tamil", "ta": "Tamil", "tamil": "Tamil",
    "tel": "Telugu", "te": "Telugu", "telugu": "Telugu",
    "kan": "Kannada", "kn": "Kannada", "kannada": "Kannada",
    "mal": "Malayalam", "ml": "Malayalam", "malayalam": "Malayalam",
    "guj": "Gujarati", "gu": "Gujarati", "gujarati": "Gujarati",
    "ben": "Bengali", "bn": "Bengali", "bengali": "Bengali",
    "pan": "Punjabi", "pa": "Punjabi", "punjabi": "Punjabi",
    "urd": "Urdu", "ur": "Urdu", "urdu": "Urdu",
    "fre": "French", "fra": "French", "fr": "French", "french": "French",
    "ger": "German", "deu": "German", "de": "German", "german": "German",
    "spa": "Spanish", "es": "Spanish", "spanish": "Spanish",
    "ita": "Italian", "it": "Italian", "italian": "Italian",
    "por": "Portuguese", "pt": "Portuguese", "portuguese": "Portuguese",
    "rus": "Russian", "ru": "Russian", "russian": "Russian",
    "chi": "Chinese", "zho": "Chinese", "zh": "Chinese", "chinese": "Chinese",
    "jpn": "Japanese", "ja": "Japanese", "japanese": "Japanese",
    "kor": "Korean", "ko": "Korean", "korean": "Korean",
    "ara": "Arabic", "ar": "Arabic", "arabic": "Arabic",
    "lat": "Latin", "la": "Latin", "latin": "Latin",
    "gre": "Greek", "ell": "Greek", "el": "Greek", "greek": "Greek",
    "heb": "Hebrew", "he": "Hebrew", "hebrew": "Hebrew",
    "dut": "Dutch", "nld": "Dutch", "nl": "Dutch", "dutch": "Dutch",
    "swe": "Swedish", "sv": "Swedish", "swedish": "Swedish",
    "dan": "Danish", "da": "Danish", "danish": "Danish",
    "nor": "Norwegian", "no": "Norwegian", "norwegian": "Norwegian",
    "fin": "Finnish", "fi": "Finnish", "finnish": "Finnish",
    "pol": "Polish", "pl": "Polish", "polish": "Polish",
    "cze": "Czech", "ces": "Czech", "cs": "Czech", "czech": "Czech",
    "tur": "Turkish", "tr": "Turkish", "turkish": "Turkish",
    "per": "Persian", "fas": "Persian", "fa": "Persian", "persian": "Persian",
    "nep": "Nepali", "ne": "Nepali", "nepali": "Nepali",
    "sin": "Sinhala", "si": "Sinhala", "sinhala": "Sinhala",
    "tha": "Thai", "th": "Thai", "thai": "Thai",
    "vie": "Vietnamese", "vi": "Vietnamese", "vietnamese": "Vietnamese",
    "ind": "Indonesian", "id": "Indonesian", "indonesian": "Indonesian",
}


def format_language_name(code: str) -> str:
    if not code:
        return "English"
    c = code.strip().lower()
    return LANGUAGE_MAP.get(c, code.strip().capitalize())


def remove_diacritics(text: str) -> str:
    if not text:
        return ""
    import unicodedata
    result = []
    for c in unicodedata.normalize("NFD", text):
        if unicodedata.category(c) == "Mn":
            if (0x0300 <= ord(c) <= 0x036F) or (0x1AB0 <= ord(c) <= 0x1AFF) or (0x1DC0 <= ord(c) <= 0x1DFF) or (0x20D0 <= ord(c) <= 0x20FF):
                continue
        result.append(c)
    return unicodedata.normalize("NFC", "".join(result))


def iast_to_devanagari(text: str) -> str:
    if not text:
        return ""
    # If already contains Devanagari, return as is
    if any("\u0900" <= c <= "\u097F" for c in text):
        return text

    vowels = {
        "a": "अ", "ā": "आ", "i": "इ", "ī": "ई", "u": "उ", "ū": "ऊ",
        "ṛ": "ऋ", "ṝ": "ॠ", "ḷ": "ऌ", "e": "ए", "ai": "ऐ", "o": "ओ", "au": "औ"
    }
    matras = {
        "ā": "ा", "i": "ि", "ī": "ी", "u": "ु", "ū": "ू",
        "ṛ": "ृ", "ṝ": "ॄ", "e": "े", "ai": "ै", "o": "ो", "au": "ौ"
    }
    consonants = {
        "k": "क", "kh": "ख", "g": "ग", "gh": "घ", "ṅ": "ङ",
        "c": "च", "ch": "छ", "j": "ज", "jh": "झ", "ñ": "ञ",
        "ṭ": "ट", "ṭh": "ठ", "ḍ": "ड", "ḍh": "ढ", "ṇ": "ण",
        "t": "त", "th": "थ", "d": "द", "dh": "ध", "n": "न",
        "p": "प", "ph": "फ", "b": "ब", "bh": "भ", "m": "म",
        "y": "य", "r": "र", "l": "ल", "v": "व", "w": "व",
        "ś": "श", "ṣ": "ष", "s": "स", "h": "ह",
        "ḻ": "ळ", "lh": "ळ"
    }

    cons_keys = sorted(consonants.keys(), key=len, reverse=True)
    vowel_keys = sorted(vowels.keys(), key=len, reverse=True)

    import re
    words = re.split(r"(\s+|[^\wāīūṛṝḷṅñṭḍṇśṣḻṁḥ])", text, flags=re.IGNORECASE)
    result = []

    for w in words:
        if not w or w.isspace() or not re.search(r"[a-zA-Zāīūṛṝḷṅñṭḍṇśṣḻṁḥ]", w):
            result.append(w)
            continue

        i = 0
        lower = w.lower()
        word_dev = []

        while i < len(lower):
            matched_cons = None
            for k in cons_keys:
                if lower.startswith(k, i):
                    matched_cons = k
                    break

            if matched_cons:
                i += len(matched_cons)
                cons_char = consonants[matched_cons]

                matched_vowel = None
                for vk in vowel_keys:
                    if lower.startswith(vk, i):
                        matched_vowel = vk
                        break

                if matched_vowel:
                    i += len(matched_vowel)
                    if matched_vowel == "a":
                        word_dev.append(cons_char)
                    else:
                        word_dev.append(cons_char + matras[matched_vowel])
                else:
                    word_dev.append(cons_char)
            else:
                matched_vowel = None
                for vk in vowel_keys:
                    if lower.startswith(vk, i):
                        matched_vowel = vk
                        break
                if matched_vowel:
                    word_dev.append(vowels[matched_vowel])
                    i += len(matched_vowel)
                else:
                    word_dev.append(w[i])
                    i += 1

        result.append("".join(word_dev))

    return "".join(result)


def lookup_book_by_isbn_openlibrary(isbn: str) -> dict | None:
    """
    Lookup book details by ISBN using Open Library Search API:
    https://openlibrary.org/search.json?isbn={isbn}&limit=1
    """
    clean_isbn = "".join(c for c in isbn if c.isdigit() or c.upper() == 'X')
    if not clean_isbn:
        return None

    # Try clean ISBN and ISBN-13 candidate if 10 digits
    isbns_to_try = [clean_isbn]
    if len(clean_isbn) == 10 and clean_isbn[:9].isdigit():
        base = '978' + clean_isbn[:9]
        total = sum(int(base[i]) * (1 if i % 2 == 0 else 3) for i in range(12))
        check = (10 - (total % 10)) % 10
        isbns_to_try.append(base + str(check))

    for target_isbn in isbns_to_try:
        url = f"https://openlibrary.org/search.json?isbn={target_isbn}&limit=1"
        try:
            req = urllib.request.Request(
                url,
                headers={
                    "User-Agent": "JLibrary/1.0 (https://github.com/Rushikesh2501/JLibrary)",
                    "Accept": "application/json"
                }
            )
            with urllib.request.urlopen(req, context=_get_ssl_context(), timeout=10) as response:
                if response.status != 200:
                    continue
                data = json.loads(response.read().decode('utf-8'))
                docs = data.get("docs", [])
                if not docs:
                    continue

                doc = docs[0]
                title = doc.get("title") or ""
                subtitle = doc.get("subtitle") or ""
                full_title = f"{title}: {subtitle}" if subtitle and subtitle.lower() not in title.lower() else title

                authors = doc.get("author_name", [])
                authors_str = ", ".join(authors) if isinstance(authors, list) else str(authors or "")

                publisher = doc.get("publisher", [])
                publisher_str = ", ".join(publisher[:2]) if isinstance(publisher, list) else str(publisher or "")

                pub_year = doc.get("first_publish_year")
                if not pub_year:
                    p_list = doc.get("publish_year", [])
                    pub_year = p_list[0] if isinstance(p_list, list) and p_list else ""

                pages = doc.get("number_of_pages_median") or ""

                languages = doc.get("language", [])
                lang_str = languages[0] if isinstance(languages, list) and languages else str(languages or "eng")
                formatted_lang = format_language_name(lang_str)

                # Clean diacritics to normal Latin characters (e.g. Sahakāradhurīṇa -> Sahakaradhurina)
                clean_title = remove_diacritics(full_title)
                clean_authors = remove_diacritics(authors_str)
                clean_publisher = remove_diacritics(publisher_str)

                # Native title rule:
                # If language is Marathi -> try to put Marathi title in Devanagari script
                # Else -> put English/main title
                if formatted_lang.lower() == "marathi":
                    native_title = iast_to_devanagari(full_title)
                else:
                    native_title = clean_title

                categories = doc.get("subject", [])
                categories_str = ", ".join(categories[:3]) if isinstance(categories, list) else ""

                cover_url = ""
                if doc.get("cover_i"):
                    cover_url = f"https://covers.openlibrary.org/b/id/{doc['cover_i']}-L.jpg"
                elif doc.get("cover_edition_key"):
                    cover_url = f"https://covers.openlibrary.org/b/olid/{doc['cover_edition_key']}-L.jpg"

                return {
                    "title": clean_title,
                    "nativeTitle": native_title,
                    "authors": clean_authors,
                    "publisher": clean_publisher,
                    "publishedDate": str(pub_year) if pub_year else "",
                    "description": remove_diacritics(subtitle or ""),
                    "pageCount": str(pages) if pages else "",
                    "language": formatted_lang,
                    "edition": str(doc.get("edition_count", "NA")),
                    "categories": categories_str,
                    "coverUrl": cover_url,
                    "isbn": clean_isbn,
                    "source": "openlibrary"
                }
        except Exception as e:
            logger.warning(f"OpenLibrary lookup failed for ISBN {target_isbn}: {e}")
            continue

    return None
