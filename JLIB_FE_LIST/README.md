# JLIB_FE_LIST — JLibrary Books Catalog & Reader Portal

A dedicated, modern, read-only public catalog web application for **JLibrary**.

## Features & Highlights

- **Strictly Read-Only**: Users can browse, search, and view detailed records. **No edit, no delete, and no add actions**.
- **Distinct Visual Identity**: Built with a sophisticated Midnight Slate & Warm Gold theme, Google Fonts (`Playfair Display`, `Plus Jakarta Sans`, and `Noto Sans Devanagari` for Marathi titles), and custom CSS Modules.
- **Shared Components Architecture**:
  - `Badge` (`Badge.module.css`): Status, language, and category tags.
  - `Button` (`Button.module.css`): Reusable buttons with variants.
  - `SearchInput` (`SearchInput.module.css`): Live search with clear action.
  - `Select` (`Select.module.css`): Accessible custom dropdown filter.
  - `Modal` (`Modal.module.css`): Accessible backdrop-blurred modal for book details.
  - `Skeleton` (`Skeleton.module.css`): Shimmer loading placeholders.
- **Catalog Browsing**:
  - **Grid & List Views**: Instant toggle between card grid and table list.
  - **Live Search**: Searches English title, Marathi / native script title, author, book ID, genre, section/shelf, and ISBN.
  - **Filters**: Availability ("All", "Available Only", "Borrowed"), Shelf / Section, Language, and Sort Options (Title A-Z, Z-A, ID, Most Borrowed, Year).
  - **Fast Pagination**: 24 items per page for ultra-responsive rendering across hundreds of books.
- **Book Details View**:
  - Cover photo display with fallback image and Supabase storage proxy support.
  - English & Devanagari titles, author, publication, year, language, edition, pages.
  - Copy Book ID and Copy ISBN to clipboard with visual feedback.
  - Synopsis & summary view.

## Running Locally

1. **Ensure Backend is running**:
   ```bash
   cd ../JLIB_BE
   source .venv/bin/activate
   uvicorn app.main:app --reload --port 8000
   ```

2. **Start the Frontend**:
   ```bash
   cd JLIB_FE_LIST
   npm start
   # or
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.
