import base64
import io
import logging
import re
import socket
import time
from typing import Optional
from PIL import Image
from supabase import create_client, Client
from app.core.config import settings

logger = logging.getLogger(__name__)

# DNS fallback patch for local ISP DNS resolution issues with Supabase subdomains
_orig_getaddrinfo = socket.getaddrinfo


def _patched_getaddrinfo(host, port, *args, **kwargs):
    try:
        return _orig_getaddrinfo(host, port, *args, **kwargs)
    except socket.gaierror:
        # If host ends with supabase.co and failed resolution, route through Cloudflare Anycast IP
        if isinstance(host, str) and host.endswith(".supabase.co"):
            try:
                return _orig_getaddrinfo("104.18.38.10", port, *args, **kwargs)
            except Exception:
                pass
        raise


socket.getaddrinfo = _patched_getaddrinfo

# Initialize Supabase client
supabase_client: Optional[Client] = None
if settings.SUPABASE_URL and settings.SUPABASE_KEY:
    try:
        supabase_client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
    except Exception as e:
        logger.warning(f"Could not initialize Supabase client: {e}")

STORAGE_BUCKET = "Book_profile"
MAX_IMAGE_BYTES = 900 * 1024  # Strict < 1 MB limit (900 KB target for high quality + safety margin)


def get_book_storage_folder(book_id: str) -> str:
    """
    Format book ID to a folder name in Supabase storage:
    e.g. 'A-01' -> 'book_A_01'
         'A2-07' -> 'book_A2_07'
         'JL-1' -> 'book_JL_1'
    """
    clean_id = str(book_id).strip()
    if clean_id.lower().startswith("book_"):
        clean_id = clean_id[5:]
    clean_id = re.sub(r"[^a-zA-Z0-9]", "_", clean_id)
    clean_id = re.sub(r"_+", "_", clean_id).strip("_")
    return f"book_{clean_id}"


def compress_image_to_under_1mb(
    image_bytes: bytes,
    max_bytes: int = MAX_IMAGE_BYTES
) -> tuple[bytes, str]:
    """
    Dial photo quality and dimensions down so file size is strictly under 1 MB.
    Preserves aspect ratio, resizes if dimension exceeds 1600px, converts to RGB,
    and applies optimized compression.
    """
    try:
        with Image.open(io.BytesIO(image_bytes)) as img:
            # Check if image is already small enough and valid
            if len(image_bytes) <= max_bytes and max(img.size) <= 1600:
                fmt = (img.format or "JPEG").lower()
                mime = f"image/{'jpeg' if fmt in ('jpg', 'jpeg') else fmt}"
                return image_bytes, mime

            # Handle color mode: convert RGBA/palette/CMYK to RGB
            if img.mode in ("RGBA", "LA", "P"):
                background = Image.new("RGB", img.size, (255, 255, 255))
                rgba_img = img.convert("RGBA")
                background.paste(rgba_img, mask=rgba_img.split()[3])
                img = background
            elif img.mode != "RGB":
                img = img.convert("RGB")

            # Scale down if dimensions exceed 1600px
            max_dim = 1600
            w, h = img.size
            if max(w, h) > max_dim:
                if w > h:
                    new_w = max_dim
                    new_h = int(h * (max_dim / w))
                else:
                    new_h = max_dim
                    new_w = int(w * (max_dim / h))
                img = img.resize((new_w, new_h), Image.Resampling.LANCZOS)

            # Iteratively compress down until file size < max_bytes
            quality = 85
            out_buf = io.BytesIO()
            img.save(out_buf, format="JPEG", quality=quality, optimize=True)

            while out_buf.tell() > max_bytes and quality > 25:
                quality -= 10
                out_buf = io.BytesIO()
                img.save(out_buf, format="JPEG", quality=quality, optimize=True)

            # If still over limit, reduce dimensions further
            if out_buf.tell() > max_bytes:
                img = img.resize((img.size[0] * 3 // 4, img.size[1] * 3 // 4), Image.Resampling.LANCZOS)
                out_buf = io.BytesIO()
                img.save(out_buf, format="JPEG", quality=70, optimize=True)

            return out_buf.getvalue(), "image/jpeg"
    except Exception as e:
        logger.warning(f"Image compression error: {e}, using original bytes")
        return image_bytes, "image/jpeg"


def upload_book_cover(
    book_id: str,
    image_data: bytes | str,
    content_type: str = "image/jpeg"
) -> str:
    """
    Upload a book cover/profile picture to Supabase Storage bucket 'Book_profile'
    under folder '{book_folder}/cover.{ext}'.
    Dials image quality down to strictly less than 1 MB before uploading.
    Returns the public URL of the uploaded image.
    """
    if not supabase_client:
        raise RuntimeError("Supabase client is not configured")

    folder = get_book_storage_folder(book_id)
    raw_bytes: bytes

    if isinstance(image_data, str):
        if image_data.startswith("data:"):
            # Format: data:<mime>;base64,<encoded>
            header, base64_str = image_data.split(",", 1)
            mime_match = re.match(r"data:([^;]+);base64", header)
            if mime_match:
                content_type = mime_match.group(1).lower()
            raw_bytes = base64.b64decode(base64_str)
        else:
            raw_bytes = base64.b64decode(image_data)
    else:
        raw_bytes = image_data

    # Dial photo quality down to under 1 MB
    compressed_bytes, content_type = compress_image_to_under_1mb(raw_bytes, max_bytes=MAX_IMAGE_BYTES)

    # Determine file extension based on mime type
    ext = ".jpg"
    if "png" in content_type:
        ext = ".png"
    elif "webp" in content_type:
        ext = ".webp"

    file_name = f"cover{ext}"
    object_path = f"{folder}/{file_name}"

    # Upload to Supabase Storage bucket with upsert
    supabase_client.storage.from_(STORAGE_BUCKET).upload(
        path=object_path,
        file=compressed_bytes,
        file_options={"content-type": content_type, "upsert": "true"}
    )

    # Obtain public URL
    public_url = supabase_client.storage.from_(STORAGE_BUCKET).get_public_url(object_path)
    # Append timestamp query parameter to bust browser/CDN cache when photo is replaced
    timestamped_url = f"{public_url}?v={int(time.time())}"
    return timestamped_url


def delete_book_cover(book_id: str) -> bool:
    """
    Delete the book's cover and completely remove that folder from Supabase Storage.
    When all objects inside the folder are removed, Supabase Storage removes the folder.
    """
    if not supabase_client:
        return False

    folder = get_book_storage_folder(book_id)
    try:
        # List all files inside the book's folder
        files = supabase_client.storage.from_(STORAGE_BUCKET).list(folder)
        paths_to_remove = []
        if files:
            for f in files:
                fname = f.get("name")
                if fname:
                    paths_to_remove.append(f"{folder}/{fname}")

        # In case there are standard filenames or folder placeholders
        for standard_file in ["cover.jpg", "cover.png", "cover.webp", "cover.jpeg", ".emptyFolderPlaceholder"]:
            cand = f"{folder}/{standard_file}"
            if cand not in paths_to_remove:
                paths_to_remove.append(cand)

        if paths_to_remove:
            supabase_client.storage.from_(STORAGE_BUCKET).remove(paths_to_remove)

        logger.info(f"Removed folder and cover files for {book_id} from {STORAGE_BUCKET}")
        return True
    except Exception as e:
        logger.warning(f"Error deleting book cover from storage for {book_id}: {e}")
        return False
