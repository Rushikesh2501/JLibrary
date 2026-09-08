export interface Book {
  book_id: number | string;
  book_name: string;
  genre: string | null;
  author: string;
  publication: string | null;
  section: string | null;
  availability_status?: string | null;
  borrowed_by?: string | null;
  status?: string;
  is_available?: boolean;
  cover_url?: string;
  published_year?: number | string;
  language?: string;
  isbn?: string;
  edition?: string;
  pages?: number | string;
  reading_status?: string;
  description?: string;
  native_title?: string;
}

export type IBook = Book;
