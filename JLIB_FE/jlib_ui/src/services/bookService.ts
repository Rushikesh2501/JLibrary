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

  // 0. Primary Provider: JLibrary Backend Gemini LLM Endpoint (/books/isbn/{isbn})
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
          return {
            title: b.title || '',
            nativeTitle: b.nativeTitle || '',
            authors: b.authors || '',
            publisher: b.publisher || '',
            publishedDate: b.publishedDate || '',
            description: b.description || '',
            pageCount: b.pageCount || '',
            language: b.language || '',
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
        return {
          title: b.title || '',
          nativeTitle: b.nativeTitle || '',
          authors: b.authors || '',
          publisher: b.publisher || '',
          publishedDate: b.publishedDate || '',
          description: b.description || '',
          pageCount: b.pageCount || '',
          language: b.language || '',
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
  const payload = {
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
  const payload = {
    book_name: bookData.book_name,
    book_name_native_lang: bookData.book_name_native_lang || bookData.native_title || null,
    author: bookData.author,
    genre: bookData.genre,
    publication: bookData.publication,
    section: bookData.section,
    availability_status: bookData.availability_status,
    borrowed_by: bookData.borrowed_by,
  };

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

export async function getNextBookId(prefix: string = 'JL-'): Promise<string> {
  try {
    const response = await fetch(`${API_BASE_URL}/books/next-id?prefix=${encodeURIComponent(prefix)}`, {
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
  return `${prefix}1`;
}

