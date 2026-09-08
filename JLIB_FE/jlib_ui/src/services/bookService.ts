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
    return data;
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
