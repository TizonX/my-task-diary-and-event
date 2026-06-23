const TAG_RULES = [
  {
    tag: 'grocery',
    keywords: [
      // dairy
      'milk', 'doodh', 'curd', 'yogurt', 'butter', 'ghee', 'cheese', 'paneer', 'cream',
      // grains & flour
      'rice', 'chawal', 'wheat', 'atta', 'maida', 'besan', 'sooji', 'poha', 'oats', 'bread',
      // pulses
      'dal', 'lentil', 'rajma', 'chana', 'moong', 'masoor', 'toor', 'urad', 'beans', 'peas',
      // vegetables
      'vegetable', 'vegetables', 'sabzi', 'onion', 'pyaz', 'potato', 'aloo', 'tomato', 'tamatar',
      'garlic', 'lehsun', 'ginger', 'adrak', 'carrot', 'gajar', 'spinach', 'palak', 'cabbage',
      'cauliflower', 'gobi', 'broccoli', 'cucumber', 'kakdi', 'capsicum', 'shimla', 'corn',
      'lauki', 'tinda', 'bhindi', 'okra', 'eggplant', 'baingan', 'pumpkin', 'kaddu', 'radish',
      'mooli', 'beetroot', 'mushroom', 'peas', 'matar', 'beans',
      // fruits
      'fruit', 'fruits', 'apple', 'seb', 'banana', 'kela', 'mango', 'aam', 'orange', 'santra',
      'grapes', 'angoor', 'watermelon', 'tarbooz', 'papaya', 'papita', 'pineapple', 'ananas',
      'lemon', 'nimbu', 'guava', 'amrud', 'strawberry', 'pomegranate', 'anar', 'kiwi', 'pear',
      // staples & packaged
      'sugar', 'cheeni', 'salt', 'namak', 'oil', 'tel', 'spice', 'masala', 'haldi', 'turmeric',
      'jeera', 'cumin', 'coriander', 'dhania', 'pepper', 'mirchi', 'chilli',
      // snacks & packaged
      'maggi', 'noodles', 'pasta', 'chips', 'biscuit', 'namkeen', 'snack', 'chocolate',
      'jam', 'pickle', 'achar', 'sauce', 'ketchup', 'vinegar', 'honey',
      // drinks
      'tea', 'chai', 'coffee', 'juice', 'water', 'cold drink', 'soda', 'lassi',
      // general
      'grocery', 'groceries', 'kirana', 'ration',
    ],
  },
  {
    tag: 'clothing',
    keywords: [
      'shirt', 'tshirt', 't-shirt', 'polo', 'jeans', 'pants', 'trouser', 'trousers',
      'dress', 'frock', 'skirt', 'kurta', 'kurti', 'churidar', 'salwar', 'dupatta',
      'saree', 'sari', 'lehenga', 'sherwani', 'dhoti', 'lungi',
      'suit', 'blazer', 'coat', 'jacket', 'hoodie', 'sweater', 'sweatshirt',
      'shorts', 'bermuda', 'capri', 'leggings', 'tights', 'stockings',
      'blouse', 'top', 'crop top', 'tank top', 'vest', 'innerwear', 'underwear',
      'cloth', 'clothes', 'clothing', 'fabric', 'outfit', 'uniform', 'costume',
      'shawl', 'scarf', 'stole', 'gloves', 'cap', 'hat', 'beanie', 'belt',
    ],
  },
  {
    tag: 'footwear',
    keywords: [
      'shoes', 'shoe', 'sandals', 'sandal', 'chappal', 'chappals', 'jutti',
      'boots', 'boot', 'ankle boot', 'combat boots',
      'sneakers', 'sneaker', 'sports shoes', 'running shoes',
      'heels', 'heel', 'stiletto', 'wedge', 'platform',
      'slippers', 'slipper', 'flip flops', 'hawai chappal',
      'loafers', 'moccasins', 'oxford', 'derby', 'brogues',
      'footwear', 'feet', 'sole',
    ],
  },
  {
    tag: 'electronics',
    keywords: [
      'phone', 'mobile', 'smartphone', 'iphone', 'android',
      'laptop', 'computer', 'pc', 'desktop', 'mac', 'macbook',
      'charger', 'cable', 'adapter', 'powerbank', 'power bank',
      'headphones', 'earphones', 'earbuds', 'airpods', 'speaker', 'bluetooth',
      'tablet', 'ipad', 'kindle',
      'keyboard', 'mouse', 'mousepad', 'monitor', 'screen', 'webcam',
      'tv', 'television', 'smart tv',
      'refrigerator', 'fridge', 'washing machine', 'microwave', 'oven',
      'ac', 'air conditioner', 'cooler', 'fan', 'heater',
      'bulb', 'led', 'tube light', 'battery', 'inverter',
      'camera', 'dslr', 'gopro', 'tripod', 'lens',
      'router', 'wifi', 'modem', 'printer', 'scanner',
      'pendrive', 'hard disk', 'ssd', 'ram', 'processor',
    ],
  },
  {
    tag: 'health',
    keywords: [
      'medicine', 'medicines', 'tablet', 'capsule', 'syrup', 'injection', 'vaccine',
      'doctor', 'physician', 'specialist', 'surgeon',
      'hospital', 'clinic', 'pharmacy', 'chemist', 'medical store',
      'checkup', 'check-up', 'appointment', 'consultation', 'test', 'blood test',
      'xray', 'x-ray', 'mri', 'scan', 'ultrasound', 'ecg',
      'prescription', 'diagnosis', 'treatment', 'therapy',
      'gym', 'exercise', 'workout', 'yoga', 'meditation', 'walk', 'run', 'jog',
      'diet', 'nutrition', 'supplement', 'protein', 'vitamin',
      'health', 'fitness', 'weight', 'bp', 'blood pressure', 'sugar level', 'diabetes',
    ],
  },
  {
    tag: 'work',
    keywords: [
      'meeting', 'standup', 'scrum', 'sprint', 'retrospective', 'demo',
      'report', 'presentation', 'slides', 'deck', 'ppt', 'proposal',
      'email', 'mail', 'reply', 'follow up',
      'project', 'deadline', 'milestone', 'delivery', 'release', 'deploy',
      'office', 'client', 'customer', 'stakeholder', 'manager',
      'review', 'submit', 'approve', 'sign off',
      'interview', 'hire', 'onboard',
      'code', 'bug', 'fix', 'feature', 'pr', 'pull request', 'commit',
      'invoice', 'quotation', 'contract',
    ],
  },
  {
    tag: 'finance',
    keywords: [
      'bill', 'electricity bill', 'water bill', 'gas bill', 'phone bill',
      'payment', 'pay', 'recharge', 'topup',
      'rent', 'emi', 'loan', 'mortgage',
      'salary', 'payroll', 'bonus', 'income', 'expense',
      'bank', 'transfer', 'neft', 'imps', 'upi', 'gpay', 'phonepe', 'paytm',
      'tax', 'gst', 'itr', 'income tax', 'filing',
      'insurance', 'premium', 'policy', 'claim',
      'investment', 'sip', 'mutual fund', 'stocks', 'share', 'fd', 'ppf',
      'credit card', 'debit card', 'dues', 'outstanding',
      'subscription', 'netflix', 'amazon prime', 'spotify',
    ],
  },
  {
    tag: 'travel',
    keywords: [
      'ticket', 'flight', 'bus', 'train', 'metro', 'cab', 'auto', 'uber', 'ola', 'rapido',
      'hotel', 'hostel', 'resort', 'airbnb', 'booking', 'reservation',
      'trip', 'tour', 'travel', 'journey', 'visit', 'tour', 'sightseeing',
      'visa', 'passport', 'immigration', 'customs',
      'airport', 'station', 'terminal', 'departure', 'arrival',
      'holiday', 'vacation', 'leave', 'weekend trip', 'road trip',
      'luggage', 'bag', 'backpack', 'suitcase', 'packing',
    ],
  },
  {
    tag: 'food',
    keywords: [
      'restaurant', 'cafe', 'dhaba', 'eatery', 'canteen',
      'dinner', 'lunch', 'breakfast', 'brunch', 'supper',
      'order', 'delivery', 'zomato', 'swiggy', 'dine', 'eat out',
      'pizza', 'burger', 'biryani', 'pasta', 'sushi', 'roll', 'wrap',
      'cake', 'pastry', 'dessert', 'ice cream', 'kulfi', 'mithai', 'sweets',
      'chai', 'coffee', 'juice', 'mocktail', 'cocktail',
    ],
  },
  {
    tag: 'education',
    keywords: [
      'study', 'studies', 'read', 'reading', 'revise', 'revision',
      'book', 'textbook', 'notebook', 'notes', 'syllabus',
      'course', 'tutorial', 'lecture', 'class', 'lesson', 'session',
      'exam', 'test', 'quiz', 'assignment', 'homework', 'project',
      'college', 'university', 'school', 'institute', 'academy',
      'degree', 'certificate', 'diploma', 'admission', 'enroll',
      'learn', 'skill', 'training', 'workshop', 'seminar', 'webinar',
    ],
  },
  {
    tag: 'home',
    keywords: [
      'clean', 'cleaning', 'sweep', 'mop', 'vacuum', 'dust', 'wipe',
      'wash', 'laundry', 'clothes wash', 'utensils',
      'repair', 'fix', 'maintenance', 'service', 'pest control',
      'plumber', 'electrician', 'carpenter', 'painter',
      'furniture', 'sofa', 'bed', 'mattress', 'table', 'chair', 'almirah',
      'curtain', 'bedsheet', 'pillow', 'cushion', 'rug', 'carpet',
      'paint', 'renovation', 'decor', 'interior',
      'grocery delivery', 'milk delivery', 'newspaper',
    ],
  },
  {
    tag: 'personal',
    keywords: [
      'haircut', 'hair', 'salon', 'parlour', 'parlor', 'barber',
      'spa', 'massage', 'facial', 'waxing', 'threading', 'manicure', 'pedicure',
      'grooming', 'shave', 'trim',
      'birthday', 'anniversary', 'wedding', 'engagement', 'ceremony',
      'gift', 'present', 'surprise', 'cake order',
      'call', 'contact', 'meet', 'catch up',
      'family', 'friend', 'relative', 'cousin', 'parent',
      'party', 'celebration', 'get together', 'outing',
    ],
  },
  {
    tag: 'fitness',
    keywords: [
      'gym', 'workout', 'exercise', 'run', 'running', 'jog', 'jogging',
      'walk', 'walking', 'cycling', 'cycle', 'swim', 'swimming',
      'yoga', 'pilates', 'zumba', 'aerobics', 'crossfit',
      'protein', 'supplement', 'creatine', 'pre-workout',
      'weight', 'dumbbell', 'bench press', 'squat', 'plank', 'pushup',
    ],
  },
]

export function detectTags(text) {
  const lower = text.toLowerCase()
  const detected = []

  for (const rule of TAG_RULES) {
    for (const keyword of rule.keywords) {
      if (lower.includes(keyword)) {
        if (!detected.includes(rule.tag)) detected.push(rule.tag)
        break
      }
    }
  }

  return detected
}

// ── Item splitter ─────────────────────────────────────────────────────────────

// Build flat keyword set for O(1) lookup — used to detect space-separated item lists
const KNOWN_ITEMS = new Set(TAG_RULES.flatMap(r => r.keywords).map(k => k.toLowerCase()))

// Matches "I have to buy X", "need to get X", "buy X", etc. at the start of the string
const BUY_VERB_RE = /^(?:i\s+)?(?:(?:have|need|want|would\s+like|gotta|got)\s+to\s+)?(?:also\s+)?(?:buy|get|purchase|pick\s+up|grab|order|bring|fetch)\s+/i

function cleanItem(s) {
  return s.trim().replace(/^(?:a|an|the|some|few)\s+/i, '').trim()
}

function cap(s) {
  if (!s) return s
  return s.charAt(0).toUpperCase() + s.slice(1)
}

// Further split a single item string by spaces if every word is a known product keyword
// e.g. "milk bread" → ["Milk", "Bread"]  |  "Submit report" → ["Submit report"]
function deepSplitBySpaces(item) {
  const words = item.trim().split(/\s+/)
  if (words.length >= 2 && words.every(w => KNOWN_ITEMS.has(w.toLowerCase()))) {
    return words.map(cap)
  }
  return [cap(item)]
}

/**
 * Returns an array of item strings if the message is a list, otherwise null.
 *
 *   "I have to buy milk bread and maggie" → ["Milk", "Bread", "Maggie"]
 *   "Buy milk, bread, maggie"             → ["Milk", "Bread", "Maggie"]
 *   "milk bread and eggs"                 → ["Milk", "Bread", "Eggs"]
 *   "Buy shoes and shirt"                 → ["Shoes", "Shirt"]
 *   "Buy groceries"                       → null (single item)
 */
export function splitIntoItems(text) {
  let working = text.trim()

  // Remove notification instructions so they don't pollute item text
  working = working
    .replace(/(?:so\s+)?(?:send\s+(?:me\s+)?(?:a\s+)?notification|notify\s+me|give\s+me\s+(?:a\s+)?(?:reminder|notification)|remind\s+me|set\s+(?:a\s+)?reminder).*$/gi, '')
    .trim()

  // Strip buy-type verb prefix
  const hadVerb = BUY_VERB_RE.test(working)
  if (hadVerb) working = working.replace(BUY_VERB_RE, '').trim()

  // Strip date/time noise so they don't become items
  working = working
    .replace(/\b(?:on\s+)?\d{1,2}(?:st|nd|rd|th)?\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*(?:\s+at\s+\d{1,2}(?::\d{2})?\s*(?:am|pm)?)?/gi, '')
    .replace(/\bat\s+\d{1,2}(?::\d{2})?\s*(?:am|pm)?/gi, '')
    .replace(/\b(?:today|tomorrow|yesterday|monday|tuesday|wednesday|thursday|friday|saturday|sunday|next\s+week|next\s+month)\b/gi, '')
    .replace(/\b(?:so|also|please)\b/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim()

  if (!working) return null

  // 1. Comma-separated (most reliable signal of a list)
  if (working.includes(',')) {
    const parts = working
      .replace(/,\s*and\s+/gi, ',')
      .split(/,+/)
      .map(cleanItem)
      .filter(s => s.length > 0)
      .flatMap(deepSplitBySpaces)
    if (parts.length >= 2) return parts
  }

  // 2. "and"-separated
  const andParts = working
    .split(/\s+and\s+/i)
    .map(cleanItem)
    .filter(s => s.length > 0)

  if (andParts.length >= 2) {
    const expanded = andParts.flatMap(deepSplitBySpaces)
    return expanded.length >= 2 ? expanded : null
  }

  // 3. After buy verb: space-separated words that are all known product keywords
  if (hadVerb) {
    const words = working.split(/\s+/).filter(s => s.length > 1)
    if (words.length >= 2 && words.every(w => KNOWN_ITEMS.has(w.toLowerCase()))) {
      return words.map(cap)
    }
  }

  return null
}
