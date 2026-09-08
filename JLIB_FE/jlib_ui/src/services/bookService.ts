import { IBook as Book } from '../interfaces/book-interface/ibook';

const API_BASE_URL = process.env.REACT_APP_LOCAL_API_BASE_URL || '';

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

  // 1. Open Library Search Endpoint
  for (const targetIsbn of isbnsToTry) {
    try {
      // Try isbn parameter first, then q parameter
      const openLibUrls = [
        `https://openlibrary.org/search.json?isbn=${targetIsbn}`,
        `https://openlibrary.org/search.json?q=${targetIsbn}`
      ];

      for (const openLibUrl of openLibUrls) {
        const openLibRes = await fetch(openLibUrl, {
          headers: {
            'User-Agent': 'JLibraryApp/1.0 (contact@jlibrary.app)',
            'Accept': 'application/json',
          },
        });

        if (openLibRes.ok) {
          const openLibData = await openLibRes.json();
          if (openLibData.docs && openLibData.docs.length > 0) {
            const doc = openLibData.docs[0];
            const authorsList = Array.isArray(doc.author_name) ? doc.author_name.join(', ') : '';
            const publishersList = Array.isArray(doc.publisher) ? doc.publisher[0] : (doc.publisher || '');
            const publishedDate = Array.isArray(doc.publish_year) ? String(doc.publish_year[0]) : (doc.first_publish_year ? String(doc.first_publish_year) : '');
            const coverId = doc.cover_i ? doc.cover_i : null;
            const coverUrl = coverId ? `https://covers.openlibrary.org/b/id/${coverId}-M.jpg` : '';

            return {
              title: doc.title || '',
              authors: authorsList,
              publisher: publishersList,
              publishedDate: publishedDate,
              description: '',
              pageCount: doc.number_of_pages_median ? String(doc.number_of_pages_median) : '',
              language: Array.isArray(doc.language) ? doc.language[0].toUpperCase() : '',
              categories: Array.isArray(doc.subject) ? doc.subject.slice(0, 3).join(', ') : '',
              coverUrl: coverUrl,
              isbn: cleanIsbn,
            };
          }
        }
      }
    } catch (err) {
      console.warn('Open Library search.json lookup failed:', err);
    }
  }

  // 2. Open Library Books API Format
  for (const targetIsbn of isbnsToTry) {
    try {
      const openLibUrl = `https://openlibrary.org/api/books?bibkeys=ISBN:${targetIsbn}&format=json&jscmd=data`;
      const openLibRes = await fetch(openLibUrl, {
        headers: {
          'User-Agent': 'JLibraryApp/1.0 (contact@jlibrary.app)',
          'Accept': 'application/json',
        },
      });

      if (openLibRes.ok) {
        const openLibData = await openLibRes.json();
        const bookKey = `ISBN:${targetIsbn}`;
        if (openLibData[bookKey]) {
          const item = openLibData[bookKey];
          const authorsList = Array.isArray(item.authors)
            ? item.authors.map((a: any) => a.name).join(', ')
            : '';
          const publishersList = Array.isArray(item.publishers)
            ? item.publishers.map((p: any) => p.name).join(', ')
            : '';
          const coverUrl = item.cover?.medium || item.cover?.large || item.cover?.small || '';

          return {
            title: item.title || '',
            authors: authorsList,
            publisher: publishersList,
            publishedDate: item.publish_date ? item.publish_date.substring(0, 4) : '',
            description: typeof item.notes === 'string' ? item.notes : '',
            pageCount: item.number_of_pages ? String(item.number_of_pages) : '',
            language: '',
            categories: Array.isArray(item.subjects) ? item.subjects.slice(0, 3).map((s: any) => s.name).join(', ') : '',
            coverUrl: coverUrl,
            isbn: cleanIsbn,
          };
        }
      }
    } catch (err) {
      console.warn('Open Library API lookup failed:', err);
    }
  }

  // 3. Fallback Provider: Google Books API
  for (const targetIsbn of isbnsToTry) {
    try {
      const apiKey = process.env.REACT_APP_GOOGLE_BOOKS_API_KEY;
      const keyParam = apiKey ? `&key=${apiKey}` : '';
      const googleUrl = `https://www.googleapis.com/books/v1/volumes?q=isbn:${targetIsbn}${keyParam}`;
      const response = await fetch(googleUrl);
      
      if (response.status === 429) {
        console.warn('Google Books API rate limited (429)');
        continue;
      }

      if (!response.ok) {
        continue;
      }

      const data = await response.json();
      if (!data.items || data.items.length === 0) {
        continue;
      }

      const volumeInfo = data.items[0].volumeInfo || {};
      const imageLinks = volumeInfo.imageLinks || {};

      let coverUrl = imageLinks.thumbnail || imageLinks.smallThumbnail || '';
      if (coverUrl.startsWith('http://')) {
        coverUrl = coverUrl.replace('http://', 'https://');
      }

      return {
        title: volumeInfo.title || '',
        authors: Array.isArray(volumeInfo.authors) ? volumeInfo.authors.join(', ') : (volumeInfo.authors || ''),
        publisher: volumeInfo.publisher || '',
        publishedDate: volumeInfo.publishedDate ? volumeInfo.publishedDate.substring(0, 4) : '',
        description: volumeInfo.description || '',
        pageCount: volumeInfo.pageCount ? String(volumeInfo.pageCount) : '',
        language: volumeInfo.language ? volumeInfo.language.toUpperCase() : '',
        categories: Array.isArray(volumeInfo.categories) ? volumeInfo.categories.join(', ') : (volumeInfo.categories || ''),
        coverUrl: coverUrl,
        isbn: cleanIsbn,
      };
    } catch (error) {
      console.error('Error fetching book details from Google Books API:', error);
    }
  }

  return null;
}
