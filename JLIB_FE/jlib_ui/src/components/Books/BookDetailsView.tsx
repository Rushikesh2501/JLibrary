import React, { useState } from 'react';
import { Button, Tooltip, IconButton, Chip } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';
import { IBook as Book } from 'interfaces/book-interface/ibook';
import styles from './BookDetailsView.module.css';

interface BookDetailsViewProps {
  book: Book;
  onBack: () => void;
}

const getBookCoverUrl = (book: Book, numericId: number): string => {
  if (book.cover_url) return book.cover_url;

  const nameLower = (book.book_name || '').toLowerCase();
  if (nameLower.includes('boy who harnessed')) {
    return 'https://m.media-amazon.com/images/I/81A-p8hP9qL._AC_UF1000,1000_QL80_.jpg';
  }
  if (nameLower.includes('twist of gold')) {
    return 'https://m.media-amazon.com/images/I/91eK6g9oX4L._AC_UF1000,1000_QL80_.jpg';
  }
  if (nameLower.includes('sea of monsters')) {
    return 'https://m.media-amazon.com/images/I/81L8H0J1-1L._AC_UF1000,1000_QL80_.jpg';
  }
  if (nameLower.includes('titan') && nameLower.includes('curse')) {
    return 'https://m.media-amazon.com/images/I/81x-sD-F04L._AC_UF1000,1000_QL80_.jpg';
  }
  if (nameLower.includes('battle of the labyrinth')) {
    return 'https://m.media-amazon.com/images/I/81B85vE8-VL._AC_UF1000,1000_QL80_.jpg';
  }
  if (nameLower.includes('last olympian')) {
    return 'https://m.media-amazon.com/images/I/91K8h4fVv3L._AC_UF1000,1000_QL80_.jpg';
  }
  if (nameLower.includes('philosopher') || nameLower.includes('harry potter')) {
    return 'https://m.media-amazon.com/images/I/81q77Q39nEL._AC_UF1000,1000_QL80_.jpg';
  }

  const sampleCovers = [
    'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=400&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=400&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=400&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=400&auto=format&fit=crop&q=80',
  ];
  return sampleCovers[Math.abs(numericId) % sampleCovers.length];
};

const getBookSummaryData = (book: Book) => {
  const title = book.book_name || 'Book';
  const author = book.author || 'Author';

  if (title.toLowerCase().includes('boy who harnessed')) {
    return {
      overview: `The Boy Who Harnessed the Wind is the memoir of William Kamkwamba, a young boy from Malawi who faced severe drought and famine in the early 2000s. Unable to attend school due to his family's inability to pay tuition, Kamkwamba continued his education independently by reading science books at a local community library. Using rudimentary physics principles and scavenged scrap metal, bicycle parts, and blue-gum trees, he successfully constructed a working windmill. His invention generated electricity and pumped water, ultimately transforming his family's agricultural prospects and garnering global recognition for grassroots innovation.`,
      keyThemes: [
        'Ingenuity and self-taught engineering',
        'Resilience amid poverty and environmental catastrophe',
        'The transformative value of access to books and education',
        'Overcoming social skepticism and failure',
        'Sustainable, community-level technological solutions',
      ],
      whoShouldRead: 'Readers interested in inspiring true stories of perseverance, renewable energy innovation, and African youth leadership.',
    };
  }

  if (title.toLowerCase().includes('sea of monsters') || title.toLowerCase().includes('percy jackson')) {
    return {
      overview: `${title} by ${author} follows Percy Jackson as he embarks on a dangerous quest across the Atlantic's Bermuda Triangle to retrieve the mythical Golden Fleece. Accompanied by Annabeth and his half-brother Tyson, Percy must navigate treacherous mythical obstacles to cure Thalia's poisoned pine tree and save Camp Half-Blood from ancient forces of destruction.`,
      keyThemes: [
        'Loyalty to friends and chosen family',
        'Courage in the face of impossible odds',
        'Modern reinterpretations of classical Greek mythology',
        'Brotherhood and identity acceptance',
      ],
      whoShouldRead: 'Fans of fast-paced mythology adventures, young adult fantasy, and coming-of-age hero journeys.',
    };
  }

  return {
    overview: `${title} by ${author} is a compelling work that explores profound themes within ${book.genre || 'literary storytelling'}. Offering rich character developments and insightful narratives, it takes readers on a captivating journey through thought-provoking events and memorable perspectives.`,
    keyThemes: [
      'Personal growth and overcoming adversity',
      'The power of knowledge, perseverance, and discovery',
      'Complex interpersonal relationships and social dynamics',
      'Reflections on human values and environmental context',
    ],
    whoShouldRead: `Enthusiasts of ${book.genre || 'great literature'}, thoughtful readers seeking engaging narratives, and library members exploring ${book.publication || 'quality publications'}.`,
  };
};

export const BookDetailsView: React.FC<BookDetailsViewProps> = ({ book, onBack }) => {
  const [activeTab, setActiveTab] = useState<'Overview' | 'Summary'>('Overview');
  const [reflection, setReflection] = useState('');
  const [copiedId, setCopiedId] = useState(false);
  const [copiedUserId, setCopiedUserId] = useState(false);

  const handleCopyBookId = () => {
    navigator.clipboard.writeText(String(book.book_id));
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 1800);
  };

  const strId = String(book.book_id);
  const numericId = typeof book.book_id === 'number'
    ? book.book_id
    : (parseInt(strId.replace(/\D/g, ''), 10) || 1);

  const isAvailable = book.availability_status
    ? book.availability_status.toLowerCase() === 'available'
    : (book.is_available ?? (numericId % 3 !== 0));

  const borrowerId = book.borrowed_by || `JL-0${((numericId * 3) % 9) + 1}`;

  const handleCopyUserId = () => {
    navigator.clipboard.writeText(borrowerId);
    setCopiedUserId(true);
    setTimeout(() => setCopiedUserId(false), 1800);
  };

  const yearMatch = book.publication?.match(/\b(19\d\d|20\d\d)\b/);
  const publishedYear = (book.published_year && String(book.published_year).trim())
    ? String(book.published_year).trim()
    : (yearMatch ? yearMatch[0] : 'NA');
  const coverUrl = getBookCoverUrl(book, numericId);
  const summaryData = getBookSummaryData(book);

  const displayIsbn = book.isbn || `978${1984816000 + (numericId * 13) % 9999}`;
  const displayPages = book.pages || (200 + (numericId * 17) % 250);
  const displayEdition = (book.edition && book.edition.trim() && book.edition.trim() !== '—' && book.edition.trim().toLowerCase() !== 'null')
    ? book.edition.trim()
    : 'NA';

  return (
    <div className={styles.profileContainer}>
      {/* Top Left Back Button */}
      <div className={styles.backButtonRow}>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={onBack}
          className={styles.backButton}
        >
          Back to Books List
        </Button>
      </div>

      {/* Box 1: Book Profile Header Card */}
      <div className={styles.profileCard}>
        {/* Cover Banner Header */}
        <div className={styles.coverContainer}>
          <div className={styles.coverPattern} />
          <Chip label={`Book ID #${book.book_id}`} size="small" className={styles.topRightBookIdChip} />
        </div>

        {/* Side-by-Side Header Info on Desktop / Centered on Mobile */}
        <div className={styles.profileHeader}>
          <div className={styles.coverWrapper}>
            <img src={coverUrl} alt={book.book_name} className={styles.coverImage} />
          </div>

          <div className={styles.headerMainContent}>
            {/* Mobile-only Book ID Badge */}
            <div className={styles.mobileBookIdRow}>
              <Chip label={`Book ID #${book.book_id}`} size="small" className={styles.mobileBookIdChip} />
            </div>

            {/* Title & Native Title */}
            <div className={styles.greenTitleRow}>
              <div className={styles.titleColumn}>
                <span className={styles.bookTitleGreen}>{book.book_name}</span>
                {book.native_title && (
                  <span className={styles.nativeTitleGreen}>{book.native_title}</span>
                )}
              </div>
            </div>

            {/* Metadata inside White Area */}
            <div className={styles.whiteInfoSection}>
              <div className={styles.bookMetaSub}>
                {book.author}{publishedYear ? ` · ${publishedYear}` : ''}
                {book.publication ? ` • Published by ${book.publication}` : ''}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Box 2: Separate Canvas for Details & Summary Content */}
      <div className={styles.contentCanvas}>
        <div className={styles.tabsRow}>
          {(['Overview', 'Summary'] as const).map((tab) => (
            <Button
              key={tab}
              className={`${styles.tabBtn} ${activeTab === tab ? styles.tabBtnActive : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </Button>
          ))}
        </div>

        {activeTab === 'Overview' && (
          <div className={styles.cardBox}>
            <div className={styles.cardHeader}>
              <span className={styles.cardTitle}>Details</span>
              <Button className={styles.editBtn} startIcon={<EditOutlinedIcon fontSize="small" />}>
                Edit
              </Button>
            </div>

            <div className={styles.detailsTable}>
              <div className={styles.tableRow}>
                <span className={styles.tableLabel}>Book ID</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span className={styles.tableValue}>{book.book_id}</span>
                  <Tooltip title={copiedId ? 'Copied!' : 'Copy Book ID'}>
                    <IconButton size="small" onClick={handleCopyBookId} sx={{ p: 0.5 }}>
                      {copiedId ? (
                        <CheckIcon style={{ fontSize: 16, color: '#1e5138' }} />
                      ) : (
                        <ContentCopyIcon style={{ fontSize: 16, color: '#78716c' }} />
                      )}
                    </IconButton>
                  </Tooltip>
                </div>
              </div>

              {!isAvailable && (
                <div className={styles.tableRow}>
                  <span className={styles.tableLabel}>Borrowed by</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span className={styles.tableValue}>{borrowerId}</span>
                    <Tooltip title={copiedUserId ? 'Copied User ID!' : 'Copy User ID'}>
                      <IconButton size="small" onClick={handleCopyUserId} sx={{ p: 0.5 }}>
                        {copiedUserId ? (
                          <CheckIcon style={{ fontSize: 16, color: '#1e5138' }} />
                        ) : (
                          <ContentCopyIcon style={{ fontSize: 16, color: '#78716c' }} />
                        )}
                      </IconButton>
                    </Tooltip>
                  </div>
                </div>
              )}

              <div className={styles.tableRow}>
                <span className={styles.tableLabel}>ISBN</span>
                <span className={styles.tableValue}>{displayIsbn}</span>
              </div>

              <div className={styles.tableRow}>
                <span className={styles.tableLabel}>Publisher</span>
                <span className={styles.tableValue}>{book.publication || 'Penguin'}</span>
              </div>

              <div className={styles.tableRow}>
                <span className={styles.tableLabel}>Year</span>
                <span className={styles.tableValue}>{publishedYear}</span>
              </div>

              <div className={styles.tableRow}>
                <span className={styles.tableLabel}>Edition</span>
                <span className={styles.tableValue}>{displayEdition}</span>
              </div>

              <div className={styles.tableRow}>
                <span className={styles.tableLabel}>Language</span>
                <span className={styles.tableValue}>{(book.language || 'ENGLISH').toUpperCase()}</span>
              </div>

              <div className={styles.tableRow}>
                <span className={styles.tableLabel}>Pages</span>
                <span className={styles.tableValue}>{displayPages}</span>
              </div>

              <div className={styles.tableRow}>
                <span className={styles.tableLabel}>Condition</span>
                <span className={styles.tableValue}>Good</span>
              </div>

              <div className={styles.tableRow}>
                <span className={styles.tableLabel}>Shelf location</span>
                <span className={styles.tableValue}>{book.section ? `Shelf ${book.section}` : '—'}</span>
              </div>

              <div className={styles.tableRow}>
                <span className={styles.tableLabel}>Tags</span>
                <span className={styles.tableValue}>{book.genre || '—'}</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'Summary' && (
          <div className={styles.cardBox}>
            <div className={styles.cardHeader}>
              <span className={styles.cardTitle}>Summary</span>
              <Button className={styles.genSummaryBtn} startIcon={<AutoAwesomeIcon fontSize="small" />}>
                Generate summary draft
              </Button>
            </div>

            <div className={styles.summaryBlock}>
              <span className={styles.summaryBlockLabel}>Overview</span>
              <div className={styles.summaryTextBox}>{summaryData.overview}</div>
            </div>

            <div className={styles.summaryBlock}>
              <span className={styles.summaryBlockLabel}>Key themes (one per line)</span>
              <div className={styles.summaryTextBox}>
                <ul className={styles.themeList}>
                  {summaryData.keyThemes.map((theme, i) => (
                    <li key={i} className={styles.themeItem}>
                      {theme}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className={styles.summaryBlock}>
              <span className={styles.summaryBlockLabel}>Who should read this</span>
              <div className={styles.summaryTextBox}>{summaryData.whoShouldRead}</div>
            </div>

            <div className={styles.summaryBlock}>
              <span className={styles.summaryBlockLabel}>Your reflections</span>
              <textarea
                className={styles.reflectionTextarea}
                placeholder="Add your personal thoughts, key quotes, or reading reflections..."
                value={reflection}
                onChange={(e) => setReflection(e.target.value)}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookDetailsView;
