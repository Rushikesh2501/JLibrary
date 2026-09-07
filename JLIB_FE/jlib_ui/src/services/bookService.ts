import { IBook as Book } from '../interfaces/book-interface/ibook';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || '';

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
