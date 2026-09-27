/**
 * Multilingual and Semantic Author Search Utilities
 * Supports:
 * 1. Direct and normalized case-insensitive substring matching
 * 2. Devanagari <-> Latin phonetic transliteration
 * 3. Cross-lingual semantic & synonym expansion (e.g. white <-> pandhra <-> safed <-> पांढरा)
 */

export const SYNONYM_GROUPS: string[][] = [
  // Colors & Color-based names/surnames
  [
    'white', 'pandhra', 'pandhre', 'pandhri', 'safed', 'shweta', 'shwet', 'dhaval', 'gora', 'gore', 'gauri',
    'पांढरा', 'पांढरे', 'पांढरी', 'सफेद', 'श्वेत', 'धवल', 'गोरे', 'गोरा', 'गौरी'
  ],
  [
    'black', 'kala', 'kale', 'kali', 'krushna', 'krishna', 'shyama', 'shyam',
    'काळा', 'काळे', 'काळी', 'काला', 'कृष्ण', 'श्याम'
  ],
  [
    'red', 'lal', 'lale', 'tambda', 'tambde', 'tambdi', 'rakta', 'rohit', 'arun', 'aruna', 'kunkum',
    'लाल', 'तांबडा', 'तांबडे', 'रक्त', 'रोहित', 'अरुण', 'अरुणा'
  ],
  [
    'green', 'hara', 'hare', 'hari', 'hirwa', 'hirwe', 'hirwi', 'harit', 'panna',
    'हिरवा', 'हिरवे', 'हरा', 'हरित', 'पन्ना'
  ],
  [
    'blue', 'neela', 'neele', 'neeli', 'nila', 'nil', 'neelam',
    'निळा', 'निळे', 'नीला', 'नील', 'नीलम'
  ],
  [
    'yellow', 'peela', 'pila', 'pivla', 'pivle', 'pivli', 'pit', 'pitambar',
    'पिवळा', 'पिवळे', 'पीला', 'पीत', 'पीतांबर'
  ],
  [
    'gold', 'golden', 'sona', 'sone', 'sonu', 'suwarna', 'swarna', 'kanchan', 'hem',
    'सोने', 'सोनं', 'सोना', 'सुवर्ण', 'स्वर्ण', 'कांचन', 'हेम'
  ],
  [
    'silver', 'chandi', 'rupere', 'rupera', 'rupali', 'raupya',
    'चांदी', 'रुपेरी', 'रुपारी', 'रौप्य'
  ],
  [
    'copper', 'tamba', 'tamra',
    'तांबे', 'तांब्र'
  ],

  // Titles, Rulers, Dignitaries
  [
    'king', 'raja', 'raje', 'rao', 'nrup', 'bhupal', 'samrat', 'maharaj',
    'भूपाल', 'राजा', 'राजे', 'राव', 'नृप', 'सम्राट', 'महाराज'
  ],
  [
    'father', 'baba', 'babasaheb', 'pita', 'tatya', 'appa', 'bapu',
    'बाबा', 'बाबासाहेब', 'पिता', 'तात्या', 'आप्पा', 'बापू'
  ],
  [
    'mother', 'aai', 'mata', 'janani', 'ma', 'mai',
    'आई', 'माता', 'जननी', 'माँ', 'माई'
  ],
  [
    'brother', 'dada', 'bhau', 'bhrata', 'bandhu',
    'बंधू', 'भाऊ', 'दादा', 'भ्राता'
  ],
  [
    'teacher', 'guru', 'acharya', 'guruji', 'swami', 'pandit', 'shikshak',
    'गुरु', 'गुरू', 'आचार्य', 'गुरुजी', 'स्वामी', 'पंडित', 'शिक्षक'
  ],
  [
    'poet', 'kavi', 'shayar',
    'कवी', 'शायर'
  ],
  [
    'writer', 'lekhak', 'sahityakar', 'granthkar',
    'ग्रंथकार', 'लेखक', 'साहित्यिक'
  ],

  // Celestial, Nature & Elements
  [
    'sun', 'surya', 'ravi', 'bhaskar', 'bhanu', 'aditya', 'dinakar', 'divakar',
    'सूर्य', 'रवी', 'भास्कर', 'भानू', 'आदित्य', 'दिनकर', 'दिवाकर'
  ],
  [
    'moon', 'chandra', 'chanda', 'soma', 'shashi', 'indu', 'vidhu',
    'चंद्र', 'चंदा', 'सोम', 'शशी', 'इंदू', 'विधू'
  ],
  [
    'star', 'tara', 'tare', 'sitara', 'nakshatra',
    'तारा', 'तारे', 'सितारा', 'नक्षत्र'
  ],
  [
    'sky', 'akash', 'aakash', 'aasmaan', 'gagan', 'ambar', 'nabh',
    'व्योम', 'आकाश', 'गगन', 'अंबर', 'नभ'
  ],
  [
    'cloud', 'megh', 'badal', 'jalad', 'ghan', 'abhra',
    'मेघ', 'बादल', 'घन', 'अभ्र'
  ],
  [
    'earth', 'land', 'prithvi', 'dharti', 'bhumi', 'avani', 'dharani', 'vasudha',
    'पृथ्वी', 'धरती', 'भूमी', 'अवनि', 'धरणी', 'वसुधा'
  ],
  [
    'ocean', 'sea', 'sagar', 'samudra', 'sindhu', 'arnav', 'jaladhi',
    'सागर', 'समुद्र', 'सिंधू', 'अर्णव', 'जलधी'
  ],
  [
    'river', 'nadi', 'sarita', 'ganga', 'yamuna', 'tapti',
    'तटिनी', 'नदी', 'सरिता', 'गंगा'
  ],
  [
    'wind', 'air', 'vayu', 'pavan', 'vara', 'hawa', 'marut', 'anil',
    'वारा', 'पवन', 'वायु', 'हवा'
  ],
  [
    'fire', 'aag', 'agni', 'jwala', 'pawak', 'anal', 'vanhi',
    'वह्नी', 'आग', 'अग्नी', 'ज्वाला', 'पावक'
  ],
  [
    'water', 'pani', 'jal', 'neer', 'vari',
    'पाणी', 'जल', 'नीर'
  ],
  [
    'tree', 'vriksha', 'zad', 'taru', 'vruksha',
    'झाड', 'वृक्ष', 'तरू'
  ],
  [
    'flower', 'phool', 'pushpa', 'kusum', 'suman', 'gulab', 'kamal',
    'फूल', 'पुष्प', 'कुसुम', 'सुमन', 'गुलाब', 'कमल'
  ],

  // Animals & Symbols
  [
    'lion', 'singh', 'sinh', 'simha', 'kesari', 'sher', 'sherdil',
    'सिंह', 'केसरी', 'शेर'
  ],
  [
    'elephant', 'hathi', 'gaj', 'gajendra',
    'हत्ती', 'गज', 'गजेंद्र'
  ],
  [
    'bird', 'pakshi', 'vihang', 'khag',
    'पक्षी', 'विहंग', 'खग'
  ],

  // Virtues, Concepts & Qualities
  [
    'light', 'prakash', 'ujed', 'roshni', 'deep', 'deepak', 'pradeep', 'alok', 'jyoti', 'ujwala', 'tej',
    'प्रकाश', 'उजेड', 'रोशनी', 'दीप', 'दीपक', 'प्रदीप', 'आलोक', 'ज्योती', 'तेज'
  ],
  [
    'truth', 'satya', 'sach', 'khare',
    'सत्य', 'सच', 'खरे'
  ],
  [
    'victory', 'vijay', 'jay', 'jaya', 'jeet', 'vijayi',
    'जय', 'विजय', 'जीत', 'विजयी'
  ],
  [
    'peace', 'shanti', 'aman', 'shant',
    'प्रशांत', 'शांत', 'शांती', 'अमन'
  ],
  [
    'joy', 'happiness', 'anand', 'harsh', 'ullas', 'mod', 'khushi', 'santosh',
    'आनंद', 'हर्ष', 'उल्लास', 'मोद', 'खुशी', 'संतोष'
  ],
  [
    'knowledge', 'wisdom', 'dnyan', 'gyan', 'vidya', 'bodh', 'prabodh', 'pandit', 'vidwan',
    'ज्ञान', 'विद्या', 'बोध', 'प्रबोध', 'पंडित', 'विद्वान'
  ],
  [
    'friend', 'mitra', 'sakha', 'dost', 'sneh', 'suhrud',
    'मित्र', 'सखा', 'दोस्त', 'स्नेह', 'सुहृद'
  ],
  [
    'love', 'prem', 'preeti', 'sneha', 'anurag',
    'प्रेम', 'प्रीती', 'स्नेह', 'अनुराग'
  ],
  [
    'great', 'big', 'mahan', 'motha', 'thor', 'vishal', 'viraat',
    'महान', 'मोठा', 'थोर', 'विशाल', 'विराट'
  ],
  [
    'small', 'chota', 'lahan', 'alpa', 'sukshma',
    'लहान', 'छोटा', 'अल्प', 'सूक्ष्म'
  ],
  [
    'new', 'nava', 'naveen', 'nutan', 'nav',
    'नव', 'नवा', 'नवीन', 'नूतन'
  ],
  [
    'old', 'juna', 'purana', 'prachin',
    'जुना', 'जुने', 'पुराना', 'प्राचीन'
  ],
  [
    'god', 'lord', 'dev', 'deva', 'ishwar', 'bhagwan', 'prabhu', 'eesh', 'shiva', 'vishnu', 'ram', 'rama', 'hari',
    'देव', 'ईश्वर', 'भगवान', 'प्रभू', 'प्रभु', 'ईश', 'शिव', 'विष्णू', 'राम', 'हरी'
  ],
  [
    'power', 'shakti', 'bal', 'samarthya',
    'सामर्थ्य', 'शक्ती', 'बल'
  ],
  [
    'book', 'pustak', 'granth', 'pothi',
    'पुस्तक', 'ग्रंथ', 'पोथी'
  ],
  [
    'history', 'itihas', 'aitihasik',
    'इतिहास', 'ऐतिहासिक'
  ]
];

const devanagariToLatinCharMap: Record<string, string> = {
  'क': 'k', 'ख': 'kh', 'ग': 'g', 'घ': 'gh', 'ङ': 'ng',
  'च': 'ch', 'छ': 'chh', 'ज': 'j', 'झ': 'jh', 'ञ': 'ny',
  'ट': 't', 'ठ': 'th', 'ड': 'd', 'ढ': 'dh', 'ण': 'n',
  'त': 't', 'थ': 'th', 'द': 'd', 'ध': 'dh', 'न': 'n',
  'प': 'p', 'फ': 'ph', 'ब': 'b', 'भ': 'bh', 'म': 'm',
  'य': 'y', 'र': 'r', 'ल': 'l', 'व': 'v', 'श': 'sh',
  'ष': 'sh', 'स': 's', 'ह': 'h', 'ळ': 'l', 'क्ष': 'ksh',
  'ज्ञ': 'dny', 'श्र': 'shr',
  'अ': 'a', 'आ': 'a', 'इ': 'i', 'ई': 'i', 'उ': 'u', 'ऊ': 'u',
  'ऋ': 'r', 'ए': 'e', 'ऐ': 'ai', 'ओ': 'o', 'औ': 'au',
  'ा': 'a', 'ि': 'i', 'ी': 'i', 'ु': 'u', 'ू': 'u',
  'े': 'e', 'ै': 'ai', 'ो': 'o', 'ौ': 'au', 'ं': 'n', 'ँ': 'n', 'ः': 'h', '्': ''
};

export const devanagariToLatin = (str: string): string => {
  let res = '';
  for (const ch of str) {
    res += devanagariToLatinCharMap[ch] !== undefined ? devanagariToLatinCharMap[ch] : ch;
  }
  return res.toLowerCase();
};

export const normalizeAuthorString = (str: string): string => {
  return str.toLowerCase().replace(/[^a-z0-9\u0900-\u097F]/g, '');
};

/**
 * Returns all synonym expansions for a given query word or phrase,
 * including English words, Marathi/Hindi Latin transliterations, and Devanagari terms.
 */
export const getSynonymExpansions = (query: string): string[] => {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  const qDevLat = devanagariToLatin(q);
  const expansions = new Set<string>([q, qDevLat]);

  for (const group of SYNONYM_GROUPS) {
    const matchesGroup = group.some((word) => {
      const w = word.toLowerCase();
      const wDevLat = devanagariToLatin(w);
      return (
        w === q ||
        wDevLat === qDevLat ||
        q.includes(w) ||
        w.includes(q) ||
        qDevLat.includes(wDevLat) ||
        wDevLat.includes(qDevLat)
      );
    });

    if (matchesGroup) {
      group.forEach((word) => {
        expansions.add(word.toLowerCase());
        expansions.add(devanagariToLatin(word));
      });
    }
  }

  return Array.from(expansions);
};

/**
 * Core matching function: Checks whether an author's name matches a search query
 * via direct substring, transliteration, or cross-language synonym expansion.
 */
export const matchesAuthor = (authorName: string | undefined | null, query: string): boolean => {
  if (!query || !query.trim()) return true;
  if (!authorName) return false;

  const rawAuthor = authorName.toLowerCase().trim();
  const authorDevLat = devanagariToLatin(rawAuthor);
  const normAuthor = normalizeAuthorString(rawAuthor);
  const normAuthorDevLat = normalizeAuthorString(authorDevLat);

  const queryExpansions = getSynonymExpansions(query);

  for (const exp of queryExpansions) {
    const expClean = exp.trim();
    if (!expClean) continue;
    const normExp = normalizeAuthorString(expClean);

    // 1. Direct contains in raw author or dev-latin transliterated author
    if (rawAuthor.includes(expClean) || authorDevLat.includes(expClean)) {
      return true;
    }

    // 2. Normalized contains (ignoring punctuation/spaces)
    if (normExp && (normAuthor.includes(normExp) || normAuthorDevLat.includes(normExp))) {
      return true;
    }

    // 3. Sub-word or token matches
    const authorWords = rawAuthor.split(/[\s,./()-]+/).filter(Boolean);
    const authorDevLatWords = authorDevLat.split(/[\s,./()-]+/).filter(Boolean);
    const allWords = [...authorWords, ...authorDevLatWords];

    for (const w of allWords) {
      if (w.startsWith(expClean) || expClean.startsWith(w) || w.includes(expClean)) {
        return true;
      }
    }
  }

  return false;
};
