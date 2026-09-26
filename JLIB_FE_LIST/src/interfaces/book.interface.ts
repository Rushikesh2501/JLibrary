export interface Book {
  book_id: string;
  book_name: string;
  book_name_native_lang?: string | null;
  native_title?: string | null;
  author: string;
  publication?: string | null;
  genre?: string | null;
  section?: string | null;
  availability_status: string;
  borrowed_by?: string | null;
  number_of_times_borrowed?: number | null;
  date_added?: string | null;
  date_modified?: string | null;
  cover_url?: string | null;
  description?: string | null;
  isbn?: string | null;
  published_year?: string | number | null;
  year?: string | number | null;
  edition?: string | null;
  language?: string | null;
  pages?: string | number | null;
  reading_status?: string | null;
}

export type ViewMode = 'grid' | 'list';

export type SortOption =
  | 'title-asc'
  | 'title-desc'
  | 'date-added'
  | 'date-modified'
  | 'id-asc'
  | 'id-desc'
  | 'author-asc'
  | 'year-desc'
  | 'borrowed-desc';
