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
}

export type IBook = Book;
