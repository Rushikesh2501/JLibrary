import type { Book } from '../interfaces/book.interface';
import { API_BASE_URL } from '../config/api';

/**
 * Safely resolves a book's cover photo URL.
 * Routes Supabase storage URLs through the backend /books/{book_id}/cover endpoint
 * to bypass any ISP/DNS restrictions on *.supabase.co.
 */
export function getSafeBookCoverUrl(book?: Book | null): string | undefined {
  if (!book) return undefined;
  const rawUrl = book.cover_url;
  if (!rawUrl || !rawUrl.trim()) return undefined;

  const trimmed = rawUrl.trim();
  if (trimmed.startsWith('data:')) {
    return trimmed;
  }
  if (trimmed.includes('supabase.co')) {
    const queryMatch = trimmed.match(/\?.*$/);
    const query = queryMatch ? queryMatch[0] : '';
    return `${API_BASE_URL}/books/${encodeURIComponent(book.book_id)}/cover${query}`;
  }
  return trimmed;
}

/**
 * Fetch all books from the library API.
 */
export async function getBooks(): Promise<Book[]> {
  const response = await fetch(`${API_BASE_URL}/books/`, {
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to load books collection (${response.status} ${response.statusText})`);
  }

  const data: Book[] = await response.json();
  return data.map((b) => ({
    ...b,
    native_title: b.book_name_native_lang || b.native_title,
    year: b.published_year || b.year,
  }));
}

/**
 * Fetch a single book by ID.
 */
export async function getBookById(bookId: string): Promise<Book> {
  const response = await fetch(`${API_BASE_URL}/books/${encodeURIComponent(bookId)}`, {
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to load book ${bookId} (${response.status} ${response.statusText})`);
  }

  const data: Book = await response.json();
  return {
    ...data,
    native_title: data.book_name_native_lang || data.native_title,
    year: data.published_year || data.year,
  };
}
