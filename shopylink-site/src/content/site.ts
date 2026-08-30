/**
 * Every string on the page, in both scripts.
 *
 * Copy follows the Brand Guide's voice section: clear over clever, short
 * sentences, we say what we do — receive, consolidate, deliver — and skip the
 * hype. The English lines here are the Guide's own "Lines we'd write".
 */

export type Locale = "ar" | "en";

export const LOCALES: readonly Locale[] = ["ar", "en"] as const;

export const DIRECTION: Record<Locale, "rtl" | "ltr"> = {
  ar: "rtl",
  en: "ltr",
};

export type CityKey = "dubai" | "guangzhou" | "istanbul" | "newyork";

/**
 * Home — the door every route converges on, and the clock's reference.
 * Change this and both the scene's convergence point and the masthead clock
 * follow it; they read the same constant.
 */
export const HOME = {
  lat: 33.51,
  lon: 36.29,
  timezone: "Asia/Damascus",
  name: { ar: "دمشق", en: "Damascus" },
  country: { ar: "سوريا", en: "Syria" },
} as const;

export type City = {
  key: CityKey;
  /** index in the scene's station order — station 0 is the world view */
  station: number;
  lat: number;
  lon: number;
  /** IANA zone — the masthead clock switches to this when the camera arrives */
  timezone: string;
  name: Record<Locale, string>;
  country: Record<Locale, string>;
  /** what you actually shop there */
  markets: Record<Locale, readonly string[]>;
  note: Record<Locale, string>;
};

export const CITIES: readonly City[] = [
  {
    key: "dubai",
    station: 1,
    lat: 25.2,
    lon: 55.27,
    timezone: "Asia/Dubai",
    name: { ar: "دبي", en: "Dubai" },
    country: { ar: "الإمارات", en: "UAE" },
    markets: {
      ar: ["دبي مول", "ديرة", "دراغون مارت", "السوق الكبير"],
      en: ["Dubai Mall", "Deira", "Dragon Mart", "Gold Souk"],
    },
    note: {
      ar: "عنوانك في الخليج. نستلم اليوم، ونشحن في نفس الأسبوع.",
      en: "Your address in the Gulf. We receive today and ship the same week.",
    },
  },
  {
    key: "guangzhou",
    station: 2,
    lat: 23.13,
    lon: 113.26,
    timezone: "Asia/Shanghai",
    name: { ar: "قوانغجو", en: "Guangzhou" },
    country: { ar: "الصين", en: "China" },
    markets: {
      ar: ["بايون", "شاهه", "معرض كانتون", "شي سان هانغ"],
      en: ["Baiyun", "Shahe", "Canton Fair", "Shi San Hang"],
    },
    note: {
      ar: "اشترِ من عشرة موردين، ويصلك طرد واحد.",
      en: "Buy from ten suppliers. One parcel arrives.",
    },
  },
  {
    key: "istanbul",
    station: 3,
    lat: 41.01,
    lon: 28.98,
    timezone: "Europe/Istanbul",
    name: { ar: "إسطنبول", en: "Istanbul" },
    country: { ar: "تركيا", en: "Türkiye" },
    markets: {
      ar: ["السوق المسقوف", "لاليلي", "عثمان بيه", "مرتر"],
      en: ["Grand Bazaar", "Laleli", "Osmanbey", "Merter"],
    },
    note: {
      ar: "الأقمشة والملابس والجلديات — مجمّعة قبل أن تغادر.",
      en: "Textiles, clothing, leather — consolidated before it leaves.",
    },
  },
  {
    key: "newyork",
    station: 4,
    lat: 40.71,
    lon: -74.01,
    timezone: "America/New_York",
    name: { ar: "نيويورك", en: "New York" },
    country: { ar: "أمريكا", en: "USA" },
    markets: {
      ar: ["الجادة الخامسة", "سوهو", "بروكلين", "المتاجر الإلكترونية"],
      en: ["Fifth Ave", "SoHo", "Brooklyn", "US online stores"],
    },
    note: {
      ar: "متاجر لا تشحن خارج أمريكا — تشحن إلينا.",
      en: "Stores that will not ship abroad will ship to us.",
    },
  },
] as const;

export const COPY = {
  /** the wordmark, split — the scene sits in the seam between the two halves */
  markLeft: { ar: "شوبي", en: "shopy" },
  markRight: { ar: "لينك", en: "link" },

  tagline: { ar: "العالم إلى البيت", en: "world · to · door" },

  promise: {
    ar: "عنوان لك في كل عواصم التسوّق — ونوصّل طردك إلى البيت.",
    en: "An address in every shopping capital — and the parcel brought home.",
  },

  lead: {
    ar: "تتسوّق من كل العالم، ونحن نستلم ونجمّع ونوصّل إلى بابك — من الإمارات والصين وأمريكا وتركيا.",
    en: "You shop the world. We receive, consolidate, and deliver to your door — from the UAE, China, the USA and Türkiye.",
  },

  ctaPrimary: { ar: "افتح عنوانك", en: "Open your address" },
  ctaSecondary: { ar: "تابع طردًا", en: "Track a parcel" },

  scroll: { ar: "مرّر", en: "Scroll" },
  localTime: { ar: "التوقيت", en: "Local time" },
  aheadOfYou: { ar: "متقدّمة", en: "ahead" },
  behindYou: { ar: "متأخّرة", en: "behind" },
  sameTime: { ar: "نفس توقيتك", en: "same as you" },
  marketsLabel: { ar: "الأسواق", en: "Markets" },
  stepsLabel: { ar: "كيف تعمل", en: "How it works" },

  steps: {
    ar: [
      { n: "٠١", t: "نستلم", d: "يصل الطرد إلى عنوانك في السوق." },
      { n: "٠٢", t: "نجمّع", d: "نضم طرودك في صندوق واحد ونزن ونصوّر." },
      { n: "٠٣", t: "نوصّل", d: "يخرج الشحن إلى بابك، وتتابعه من السلة حتى الباب." },
    ],
    en: [
      { n: "01", t: "Receive", d: "Your parcel arrives at your address in the market." },
      { n: "02", t: "Consolidate", d: "We combine your parcels into one box, weigh it and photograph it." },
      { n: "03", t: "Deliver", d: "It ships to your door, and you track it from cart to doorstep." },
    ],
  },

  switchTo: { ar: "English", en: "العربية" },
  loading: { ar: "جارٍ التحميل", en: "Loading" },

  footerContact: { ar: "hello@shopylink.co", en: "hello@shopylink.co" },
  site: { ar: "shopylink.co", en: "shopylink.co" },
} as const;

/**
 * Cookie consent copy.
 *
 * The starter ships this component with its English strings written into the
 * markup, which the project's own hard rule #4 forbids ("no hardcoded values —
 * props/hooks for content"). Lifting them here is what makes the surface
 * translatable at all; the components now read this block.
 */
export const COOKIE = {
  bannerLabel: { ar: "الموافقة على الكوكيز", en: "Cookie consent" },
  title: { ar: "هذا الموقع يستخدم الكوكيز", en: "This website uses cookies" },
  bannerBody: {
    ar: "نستخدم الكوكيز لإبقاء الموقع يعمل، ولنعرف كيف يُستخدم، ولنحسّن ما نبنيه بعده. اقبل الكل، أو ارفض غير الضروري، أو اختر فئةً فئة. راجع ",
    en: "We use cookies to keep the site working, learn how it’s used, and improve what we ship next. Accept everything, reject the non-essential, or pick category by category. See our ",
  },
  privacyLink: { ar: "سياسة الخصوصية", en: "privacy policy" },

  acceptAll: { ar: "قبول الكل", en: "Accept all" },
  rejectAll: { ar: "رفض الكل", en: "Reject all" },
  manage: { ar: "إدارة التفضيلات", en: "Manage preferences" },
  save: { ar: "حفظ التفضيلات", en: "Save preferences" },

  modalTitle: { ar: "تفضيلات الكوكيز", en: "Cookie preferences" },
  modalClose: { ar: "إغلاق تفضيلات الكوكيز", en: "Close cookie preferences" },
  modalBody: {
    ar: "اختر فئات الكوكيز التي تسمح لنا باستخدامها. يمكنك تغيير ذلك في أي وقت. راجع ",
    en: "Choose which categories of cookies we’re allowed to use. You can change this any time. See our ",
  },

  categories: {
    necessary: {
      title: { ar: "ضرورية تمامًا", en: "Strictly necessary" },
      body: {
        ar: "لازمة لعمل الموقع — تسجيل الدخول والأمان والتنقّل بين الصفحات. لا يمكن إيقافها.",
        en: "Required for the site to work — sign-in, security, page navigation. These can’t be turned off.",
      },
    },
    analytics: {
      title: { ar: "التحليلات", en: "Analytics" },
      body: {
        ar: "إحصاءات استخدام مجهولة الهوية، لنعرف أي الصفحات تفيد وأيها لا. لا يُبنى منها ملف شخصي.",
        en: "Anonymised usage stats so we know which pages help and which fall flat. No personal profile is built.",
      },
    },
    marketing: {
      title: { ar: "التسويق", en: "Marketing" },
      body: {
        ar: "تتيح لنا قياس أداء الإعلانات وإعادة عرض محتوى لم تُكمل قراءته. يمكنك الانسحاب في أي وقت.",
        en: "Lets us measure ad performance and re-show content you didn’t get to finish reading. Opt out anytime.",
      },
    },
  },
} as const;
