import { IBook as Book } from '../interfaces/book-interface/ibook';
import { API_BASE_URL } from '../config/api';

export async function getBooks(): Promise<Book[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/books/`, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch books: ${response.status} ${response.statusText}`);
    }

    const data: Book[] = await response.json();
    return data.map((b) => ({
      ...b,
      native_title: b.book_name_native_lang || b.native_title,
    }));
  } catch (error) {
    console.error('Error fetching books in getBooks:', error);
    throw error;
  }
}


export interface GoogleBookDetails {
  title: string;
  nativeTitle?: string;
  authors: string;
  publisher: string;
  publishedDate: string;
  description: string;
  pageCount: string;
  language: string;
  edition?: string;
  categories: string;
  coverUrl: string;
  isbn: string;
}

const LANGUAGE_NAME_MAP: Record<string, string> = {
  eng: 'English', en: 'English', english: 'English',
  hin: 'Hindi', hi: 'Hindi', hindi: 'Hindi',
  mar: 'Marathi', mr: 'Marathi', marathi: 'Marathi',
  san: 'Sanskrit', sa: 'Sanskrit', sanskrit: 'Sanskrit',
  tam: 'Tamil', ta: 'Tamil', tamil: 'Tamil',
  tel: 'Telugu', te: 'Telugu', telugu: 'Telugu',
  kan: 'Kannada', kn: 'Kannada', kannada: 'Kannada',
  mal: 'Malayalam', ml: 'Malayalam', malayalam: 'Malayalam',
  guj: 'Gujarati', gu: 'Gujarati', gujarati: 'Gujarati',
  ben: 'Bengali', bn: 'Bengali', bengali: 'Bengali',
  pan: 'Punjabi', pa: 'Punjabi', punjabi: 'Punjabi',
  urd: 'Urdu', ur: 'Urdu', urdu: 'Urdu',
  fre: 'French', fra: 'French', fr: 'French', french: 'French',
  ger: 'German', deu: 'German', de: 'German', german: 'German',
  spa: 'Spanish', es: 'Spanish', spanish: 'Spanish',
  ita: 'Italian', it: 'Italian', italian: 'Italian',
  por: 'Portuguese', pt: 'Portuguese', portuguese: 'Portuguese',
  rus: 'Russian', ru: 'Russian', russian: 'Russian',
  chi: 'Chinese', zho: 'Chinese', zh: 'Chinese', chinese: 'Chinese',
  jpn: 'Japanese', ja: 'Japanese', japanese: 'Japanese',
  kor: 'Korean', ko: 'Korean', korean: 'Korean',
  ara: 'Arabic', ar: 'Arabic', arabic: 'Arabic',
  lat: 'Latin', la: 'Latin', latin: 'Latin',
  gre: 'Greek', ell: 'Greek', el: 'Greek', greek: 'Greek',
  heb: 'Hebrew', he: 'Hebrew', hebrew: 'Hebrew',
  dut: 'Dutch', nld: 'Dutch', nl: 'Dutch', dutch: 'Dutch',
  swe: 'Swedish', sv: 'Swedish', swedish: 'Swedish',
  dan: 'Danish', da: 'Danish', danish: 'Danish',
  nor: 'Norwegian', no: 'Norwegian', norwegian: 'Norwegian',
  fin: 'Finnish', fi: 'Finnish', finnish: 'Finnish',
  pol: 'Polish', pl: 'Polish', polish: 'Polish',
  cze: 'Czech', ces: 'Czech', cs: 'Czech', czech: 'Czech',
  tur: 'Turkish', tr: 'Turkish', turkish: 'Turkish',
  per: 'Persian', fas: 'Persian', fa: 'Persian', persian: 'Persian',
  nep: 'Nepali', ne: 'Nepali', nepali: 'Nepali',
  sin: 'Sinhala', si: 'Sinhala', sinhala: 'Sinhala',
  tha: 'Thai', th: 'Thai', thai: 'Thai',
  vie: 'Vietnamese', vi: 'Vietnamese', vietnamese: 'Vietnamese',
  ind: 'Indonesian', id: 'Indonesian', indonesian: 'Indonesian',
};

export function formatLanguageName(codeOrName: string): string {
  if (!codeOrName || !codeOrName.trim()) return 'English';
  const clean = codeOrName.trim().toLowerCase();
  if (LANGUAGE_NAME_MAP[clean]) {
    return LANGUAGE_NAME_MAP[clean];
  }
  try {
    const displayNames = new Intl.DisplayNames(['en'], { type: 'language' });
    const name = displayNames.of(clean);
    if (name) {
      return name.charAt(0).toUpperCase() + name.slice(1);
    }
  } catch (e) {
    // fallback
  }
  return clean.charAt(0).toUpperCase() + clean.slice(1);
}

export function cleanDiacritics(str: string): string {
  if (!str) return '';
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

export function iastToDevanagari(text: string): string {
  if (!text) return '';
  if (/[\u0900-\u097F]/.test(text)) return text;

  const vowels: Record<string, string> = {
    'a': 'अ', 'ā': 'आ', 'i': 'इ', 'ī': 'ई', 'u': 'उ', 'ū': 'ऊ',
    'ṛ': 'ऋ', 'ṝ': 'ॠ', 'ḷ': 'ऌ', 'e': 'ए', 'ai': 'ऐ', 'o': 'ओ', 'au': 'औ',
  };
  const matras: Record<string, string> = {
    'ā': 'ा', 'i': 'ि', 'ī': 'ी', 'u': 'ु', 'ū': 'ू',
    'ṛ': 'ृ', 'ṝ': 'ॄ', 'e': 'े', 'ai': 'ै', 'o': 'ो', 'au': 'ौ',
  };
  const consonants: Record<string, string> = {
    'k': 'क', 'kh': 'ख', 'g': 'ग', 'gh': 'घ', 'ṅ': 'ङ',
    'c': 'च', 'ch': 'छ', 'j': 'ज', 'jh': 'झ', 'ñ': 'ञ',
    'ṭ': 'ट', 'ṭh': 'ठ', 'ḍ': 'ड', 'ḍh': 'ढ', 'ṇ': 'ण',
    't': 'त', 'th': 'थ', 'd': 'द', 'dh': 'ध', 'n': 'न',
    'p': 'प', 'ph': 'फ', 'b': 'ब', 'bh': 'भ', 'm': 'म',
    'y': 'य', 'r': 'र', 'l': 'ल', 'v': 'व', 'w': 'व',
    'ś': 'श', 'ṣ': 'ष', 's': 'स', 'h': 'ह',
    'ḻ': 'ळ', 'lh': 'ळ',
  };

  const consKeys = Object.keys(consonants).sort((a, b) => b.length - a.length);
  const vowelKeys = Object.keys(vowels).sort((a, b) => b.length - a.length);

  let result = '';
  const words = text.split(/(\s+|[^\wāīūṛṝḷṅñṭḍṇśṣḻṁḥ])/i);

  for (const w of words) {
    if (!w || /^\s+$/.test(w) || !/[a-zA-Zāīūṛṝḷṅñṭḍṇśṣḻṁḥ]/i.test(w)) {
      result += w;
      continue;
    }

    let i = 0;
    const lower = w.toLowerCase();
    let wordDev = '';

    while (i < lower.length) {
      let matchedCons = '';
      for (const k of consKeys) {
        if (lower.startsWith(k, i)) {
          matchedCons = k;
          break;
        }
      }

      if (matchedCons) {
        i += matchedCons.length;
        const consChar = consonants[matchedCons];

        let matchedVowel = '';
        for (const vk of vowelKeys) {
          if (lower.startsWith(vk, i)) {
            matchedVowel = vk;
            break;
          }
        }

        if (matchedVowel) {
          i += matchedVowel.length;
          if (matchedVowel === 'a') {
            wordDev += consChar;
          } else {
            wordDev += consChar + matras[matchedVowel];
          }
        } else {
          wordDev += consChar;
        }
      } else {
        let matchedVowel = '';
        for (const vk of vowelKeys) {
          if (lower.startsWith(vk, i)) {
            matchedVowel = vk;
            break;
          }
        }
        if (matchedVowel) {
          wordDev += vowels[matchedVowel];
          i += matchedVowel.length;
        } else {
          wordDev += w[i];
          i++;
        }
      }
    }
    result += wordDev;
  }
  return result;
}

export function determineNativeTitle(rawTitle: string, rawNative: string, language: string): string {
  const cleanTitle = cleanDiacritics(rawTitle);
  const lang = formatLanguageName(language);
  if (lang.toLowerCase() === 'marathi') {
    if (rawNative && /[\u0900-\u097F]/.test(rawNative)) {
      return rawNative;
    }
    if (/[\u0900-\u097F]/.test(rawTitle)) {
      return rawTitle;
    }
    return iastToDevanagari(rawNative || rawTitle);
  }
  // If not Marathi, put English/main title only
  return cleanTitle;
}

export async function fetchBookDetailsByIsbn(isbn: string): Promise<GoogleBookDetails | null> {
  let cleanIsbn = isbn.replace(/[^0-9X]/gi, '').toUpperCase();
  if (!cleanIsbn) return null;

  // Function to convert 10-digit ISBN to 13-digit ISBN (starts with 978)
  const convertIsbn10To13 = (isbn10: string): string => {
    if (isbn10.length !== 10) return isbn10;
    const base = '978' + isbn10.substring(0, 9);
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      sum += parseInt(base[i], 10) * (i % 2 === 0 ? 1 : 3);
    }
    const checkDigit = (10 - (sum % 10)) % 10;
    return base + checkDigit;
  };

  const isbn13Candidate = cleanIsbn.length === 10 ? convertIsbn10To13(cleanIsbn) : cleanIsbn;
  const isbnsToTry = Array.from(new Set([cleanIsbn, isbn13Candidate]));

  // 1. Primary Provider: Open Library Search API (before Gemini)
  try {
    for (const targetIsbn of isbnsToTry) {
      const openLibRes = await fetch(`https://openlibrary.org/search.json?isbn=${encodeURIComponent(targetIsbn)}&limit=1`, {
        headers: {
          'Accept': 'application/json',
        },
      });

      if (openLibRes.ok) {
        const data = await openLibRes.json();
        if (data && data.docs && data.docs.length > 0) {
          const doc = data.docs[0];
          const title = doc.title || '';
          const subtitle = doc.subtitle || '';
          const fullTitle = subtitle && !title.toLowerCase().includes(subtitle.toLowerCase())
            ? `${title}: ${subtitle}`
            : title;

          const authors = Array.isArray(doc.author_name)
            ? doc.author_name.join(', ')
            : (doc.author_name || '');

          const publisher = Array.isArray(doc.publisher)
            ? doc.publisher.slice(0, 2).join(', ')
            : (doc.publisher || '');

          const publishedYear = doc.first_publish_year
            ? String(doc.first_publish_year)
            : (Array.isArray(doc.publish_year) && doc.publish_year[0] ? String(doc.publish_year[0]) : '');

          const pages = doc.number_of_pages_median ? String(doc.number_of_pages_median) : '';

          const language = Array.isArray(doc.language) && doc.language[0]
            ? doc.language[0]
            : (doc.language || 'eng');
          const langName = formatLanguageName(language);

          const rawTitle = fullTitle;
          const cleanTitle = cleanDiacritics(fullTitle);
          const nativeTitle = determineNativeTitle(rawTitle, '', langName);

          const categories = Array.isArray(doc.subject)
            ? doc.subject.slice(0, 3).join(', ')
            : '';

          let coverUrl = '';
          if (doc.cover_i) {
            coverUrl = `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`;
          } else if (doc.cover_edition_key) {
            coverUrl = `https://covers.openlibrary.org/b/olid/${doc.cover_edition_key}-L.jpg`;
          }

          return {
            title: cleanTitle,
            nativeTitle,
            authors: cleanDiacritics(authors),
            publisher: cleanDiacritics(publisher),
            publishedDate: publishedYear,
            description: cleanDiacritics(subtitle || ''),
            pageCount: pages,
            language: langName,
            edition: doc.edition_count ? String(doc.edition_count) : 'NA',
            categories,
            coverUrl,
            isbn: cleanIsbn,
          };
        }
      }
    }
  } catch (err) {
    console.warn('Open Library ISBN lookup failed, falling back to backend:', err);
  }

  // 2. Secondary Provider: JLibrary Backend Gemini LLM Endpoint (/books/isbn/{isbn})
  try {
    for (const targetIsbn of isbnsToTry) {
      const backendRes = await fetch(`${API_BASE_URL}/books/isbn/${targetIsbn}`, {
        headers: {
          'Accept': 'application/json',
        },
      });

      if (backendRes.ok) {
        const backendData = await backendRes.json();
        if (backendData && backendData.found && backendData.book) {
          const b = backendData.book;
          const rawTitle = b.title || '';
          const cleanTitle = cleanDiacritics(rawTitle);
          const langName = formatLanguageName(b.language || '');
          const nativeTitle = determineNativeTitle(rawTitle, b.nativeTitle || '', langName);

          return {
            title: cleanTitle,
            nativeTitle,
            authors: cleanDiacritics(b.authors || ''),
            publisher: cleanDiacritics(b.publisher || ''),
            publishedDate: b.publishedDate || '',
            description: cleanDiacritics(b.description || ''),
            pageCount: b.pageCount || '',
            language: langName,
            edition: b.edition || '',
            categories: b.categories || '',
            coverUrl: b.coverUrl || '',
            isbn: cleanIsbn,
          };
        }
      }
    }
  } catch (err) {
    console.warn('Backend Gemini ISBN lookup failed:', err);
  }

  return null;
}

async function compressImageForUpload(file: File): Promise<File> {
  // If file is already smaller than 800KB, send directly
  if (file.size <= 800 * 1024) {
    return file;
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const maxDimension = 1600;
        let { width, height } = img;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(file);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file);
              return;
            }
            const cleanName = file.name.replace(/\.[^.]+$/, '.jpg');
            const compressed = new File([blob], cleanName, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve(compressed);
          },
          'image/jpeg',
          0.82
        );
      };
      img.onerror = () => resolve(file);
      img.src = e.target?.result as string;
    };
    reader.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
}

export async function fetchBookDetailsByPhoto(
  frontFile: File | null,
  backFile: File | null
): Promise<GoogleBookDetails | null> {
  if (!frontFile && !backFile) return null;

  const [processedFront, processedBack] = await Promise.all([
    frontFile ? compressImageForUpload(frontFile) : null,
    backFile ? compressImageForUpload(backFile) : null,
  ]);

  const formData = new FormData();
  if (processedFront) {
    formData.append('front_cover', processedFront, processedFront.name);
  }
  if (processedBack) {
    formData.append('back_cover', processedBack, processedBack.name);
  }

  try {
    const res = await fetch(`${API_BASE_URL}/books/photo`, {
      method: 'POST',
      body: formData,
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.found && data.book) {
        const b = data.book;
        const rawTitle = b.title || '';
        const cleanTitle = cleanDiacritics(rawTitle);
        const langName = formatLanguageName(b.language || '');
        const nativeTitle = determineNativeTitle(rawTitle, b.nativeTitle || '', langName);

        return {
          title: cleanTitle,
          nativeTitle,
          authors: cleanDiacritics(b.authors || ''),
          publisher: cleanDiacritics(b.publisher || ''),
          publishedDate: b.publishedDate || '',
          description: cleanDiacritics(b.description || ''),
          pageCount: b.pageCount || '',
          language: langName,
          edition: b.edition || '',
          categories: b.categories || '',
          coverUrl: b.coverUrl || '',
          isbn: b.isbn || '',
        };
      }
    }
  } catch (err) {
    console.error('Backend Gemini Photo lookup error:', err);
  }

  return null;
}

export async function createBook(bookData: Partial<Book>, prefix: string = 'JL-'): Promise<Book> {
  const payload: any = {
    book_name: bookData.book_name,
    book_name_native_lang: bookData.book_name_native_lang || bookData.native_title || null,
    author: bookData.author,
    genre: bookData.genre || 'General',
    publication: bookData.publication || 'Self Published',
    section: bookData.section || 'General',
    availability_status: bookData.availability_status || (bookData.is_available ? 'Available' : 'Unavailable'),
    borrowed_by: bookData.borrowed_by || null,
    book_id: bookData.book_id || undefined,
  };
  if (bookData.cover_url) {
    payload.cover_url = bookData.cover_url;
  }

  const response = await fetch(`${API_BASE_URL}/books/?prefix=${encodeURIComponent(prefix)}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to create book: ${response.status} ${errorText}`);
  }

  const created: Book = await response.json();
  return {
    ...bookData,
    ...created,
    native_title: created.book_name_native_lang || bookData.native_title,
  };
}

export async function updateBook(bookId: string, bookData: Partial<Book>): Promise<Book> {
  const payload: any = {
    book_name: bookData.book_name,
    book_name_native_lang: bookData.book_name_native_lang || bookData.native_title || null,
    author: bookData.author,
    genre: bookData.genre,
    publication: bookData.publication,
    section: bookData.section,
    availability_status: bookData.availability_status,
    borrowed_by: bookData.borrowed_by,
  };
  if (bookData.cover_url !== undefined) {
    payload.cover_url = bookData.cover_url;
  }

  const response = await fetch(`${API_BASE_URL}/books/${encodeURIComponent(bookId)}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to update book: ${response.status} ${errorText}`);
  }

  const updated: Book = await response.json();
  return {
    ...bookData,
    ...updated,
  };
}

export async function uploadBookCover(bookId: string, file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/books/${encodeURIComponent(bookId)}/cover`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to upload cover: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  return data.cover_url;
}

export async function deleteBookCover(bookId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/books/${encodeURIComponent(bookId)}/cover`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to delete cover: ${response.status} ${errorText}`);
  }
}

export async function getNextBookId(prefix: string = 'JL-'): Promise<string> {
  const cleanPrefix = (prefix || 'JL-').trim().toUpperCase();
  const normalizedPrefix = cleanPrefix.endsWith('-') ? cleanPrefix : `${cleanPrefix}-`;

  try {
    const response = await fetch(`${API_BASE_URL}/books/next-id?prefix=${encodeURIComponent(normalizedPrefix)}`, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      if (data && data.next_book_id) {
        return data.next_book_id;
      }
    }
  } catch (err) {
    console.warn('Failed to fetch next book id from backend:', err);
  }
  return `${normalizedPrefix}1`;
}

export async function deleteBook(bookId: string): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`${API_BASE_URL}/books/delete-book/${encodeURIComponent(bookId)}`, {
    method: 'DELETE',
    headers: {
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to delete book: ${response.status} ${errorText}`);
  }

  return response.json();
}


