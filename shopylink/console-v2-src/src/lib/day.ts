/* A demonstration day for the operator's home — rich enough to judge the
   design by. Nothing here is reference data: names, prices and routes are
   invented, and the page says so in its chrome whenever it draws from this
   file rather than from a published register. */
import type { Person } from './channels';

const H = 3600000;
const now = Date.now();

export type Task = {
  id: string;
  ar: string; en: string;
  ref: string;
  lateMs: number;              /* <0 = due soon, not yet late */
  verbAr: string; verbEn: string;
  open: string;                /* the module that owns the act */
  kind: 'measure' | 'deliver' | 'approve' | 'document';
};

export const dayTasks: Task[] = [
  { id: 'T1', ar: 'تسليم أخفق مرّتين — يقرَّر مصيره', en: 'A delivery that failed twice — decide it', ref: 'CON-240703-02', lateMs: 26 * H, verbAr: 'إلى القرار', verbEn: 'To the decision', open: 'ShopyLink_Action_08_Delivery.html', kind: 'deliver' },
  { id: 'T2', ar: 'طرد مستلَم ينتظر القياس', en: 'A parcel received, waiting to be measured', ref: 'CON-240712-01', lateMs: 9 * H, verbAr: 'إلى القياس', verbEn: 'To measuring', open: 'ShopyLink_Action_01_ReceiveParcel.html', kind: 'measure' },
  { id: 'T3', ar: 'حمولة مجمَّعة تنتظر رحلة', en: 'A consolidated load waiting for a trip', ref: 'CON-240711-04', lateMs: 6 * H, verbAr: 'إلى رحلة', verbEn: 'To a trip', open: 'ShopyLink_Action_03_CreateTrip.html', kind: 'document' },
  { id: 'T4', ar: 'طرد وصل مركزك اليوم', en: 'A parcel that reached your centre today', ref: 'CON-240712-03', lateMs: 3 * H, verbAr: 'إلى القياس', verbEn: 'To measuring', open: 'ShopyLink_Action_01_ReceiveParcel.html', kind: 'measure' },
  { id: 'T5', ar: 'طرد ثانٍ ينتظر القياس', en: 'A second parcel waiting to be measured', ref: 'CON-240712-05', lateMs: 1 * H, verbAr: 'إلى القياس', verbEn: 'To measuring', open: 'ShopyLink_Action_01_ReceiveParcel.html', kind: 'measure' },
  { id: 'T6', ar: 'شحنة تصل خلال ساعتين — جهّز الرصيف', en: 'A shipment arriving within two hours — clear the dock', ref: 'TRP-2608-014', lateMs: -2 * H, verbAr: 'إلى التجهيز', verbEn: 'To preparing', open: 'ShopyLink_Action_06_ArrivalReceive.html', kind: 'document' },
];

export const dayNotice = {
  kind: 'policy',
  ar: 'من هذا الشهر كل حساب أعمال بالدفع المسبق ما لم يُمنح تسهيل ائتماني كتابةً.',
  en: 'From this month every business account is prepaid unless a credit facility is granted in writing.',
  by: 'Omar Al-Masri',
  at: '2026-08-28',
};

export const dayFigures = [
  { ar: 'استلمتُ اليوم', en: 'Taken in today', n: 7, tone: 'green' as const },
  { ar: 'ينتظر قياسي', en: 'Waiting on my measure', n: 3, tone: 'amber' as const },
  { ar: 'متأخّر عليّ', en: 'Late on me', n: 1, tone: 'red' as const },
];

export const dayMe: Person = {
  id: 'U-02', name: 'Khaled Omar', role: 'wh', level: 1, status: 'active', onLeave: false,
  perms: ['b1_ind', 'b1_biz', 'b2_con'], duties: ['measure'],
  dutyAr: 'يقيس ويزن ويصوّر كل قطعة تصل مركزه', dutyEn: 'Measures, weighs and photographs every piece reaching his centre',
  reportsTo: 'hubsup', scope: { type: 'list', countries: [], hubs: ['H-DAM'] },
};

/* seed thread per task ref — the console shows it; writing goes through D1 */
export const dayThreads: Record<string, { by: string; at: string; ar: string; en: string }[]> = {
  'CON-240703-02': [
    { by: 'Mona Said', at: '09:12', ar: 'المحاولة الثانية رفضها العميل — الهاتف مغلق.', en: 'Second attempt refused — phone unreachable.' },
    { by: 'Khaled Omar', at: '09:40', ar: 'أُعيدت إلى الرفّ C-4 بانتظار القرار — @منى سعيد للتأكيد.', en: 'Back on shelf C-4 pending the decision — @Mona Said to confirm.' },
  ],
};

/* the dense state: five hundred rows, generated rather than shipped */
export function denseTasks(): Task[] {
  const out: Task[] = [];
  for (let i = 0; i < 500; i++) {
    out.push({
      id: 'D' + i,
      ar: 'تسليم أخفق مرّتين — يقرَّر مصيره', en: 'A delivery that failed twice — decide it',
      ref: 'CON-9' + String(100000 + i).slice(1) + '-01',
      lateMs: (500 - i) * 0.5 * H,
      verbAr: 'إلى القرار', verbEn: 'To the decision',
      open: 'ShopyLink_Action_08_Delivery.html', kind: 'deliver',
    });
  }
  return out;
}

/* ── the day, structured for the redesigned home ─────────────────────── */

export const GROUP_META: Record<Task['kind'], { ar: string; en: string; tone: 'red' | 'amber' | 'sky' | 'green' }> = {
  deliver:  { ar: 'تسليم متعثّر',   en: 'Stalled deliveries', tone: 'red' },
  measure:  { ar: 'قياس واستلام',   en: 'Measure & intake',   tone: 'amber' },
  document: { ar: 'تجميع وتجهيز',   en: 'Consolidate & prepare', tone: 'sky' },
  approve:  { ar: 'موافقات',        en: 'Approvals',          tone: 'green' },
};

export type NewsItem = {
  id: string; kind: string;
  titleAr: string; titleEn: string;
  ar: string; en: string;
  by: string; at: string;
  image?: 'brand' | undefined;   /* 'brand' renders the ink band with the rings */
};

export const dayNews: NewsItem[] = [
  {
    id: 'N1', kind: 'policy',
    titleAr: 'الدفع المسبق لحسابات الأعمال', titleEn: 'Prepaid business accounts',
    ar: 'من هذا الشهر كل حساب أعمال بالدفع المسبق ما لم يُمنح تسهيل ائتماني كتابةً.',
    en: 'From this month every business account is prepaid unless a credit facility is granted in writing.',
    by: 'Omar Al-Masri', at: '2026-08-28', image: 'brand',
  },
  {
    id: 'N2', kind: 'notice',
    titleAr: 'جرد منتصف الشهر يوم الخميس', titleEn: 'Mid-month count on Thursday',
    ar: 'الجرد الدوري في مركز دمشق صباح الخميس — الاستلام يتوقف من الثامنة حتى العاشرة.',
    en: 'Periodic count at the Damascus hub Thursday morning — intake pauses from eight to ten.',
    by: 'Tarek Aziz', at: '2026-08-29',
  },
  {
    id: 'N3', kind: 'advisory',
    titleAr: 'معبر باب الهوى: تفتيش موسّع', titleEn: 'Bab al-Hawa: extended inspection',
    ar: 'تفتيش موسّع على الشاحنات الواردة هذا الأسبوع — أضيفوا ثلاث ساعات لتقدير الوصول.',
    en: 'Extended inspection on inbound trucks this week — add three hours to arrival estimates.',
    by: 'Lina Hamwi', at: '2026-08-30',
  },
];

/* a small event trail per reference, for the task drawer */
export const dayTrail: Record<string, { at: string; ar: string; en: string }[]> = {
  'CON-240703-02': [
    { at: '08-28 14:10', ar: 'خرجت للتوصيل — الجولة RUN-260828-03', en: 'Out for delivery — run RUN-260828-03' },
    { at: '08-28 17:42', ar: 'محاولة أولى أخفقت: العنوان مغلق', en: 'First attempt failed: premises closed' },
    { at: '08-29 11:05', ar: 'محاولة ثانية أخفقت: الهاتف لا يجيب', en: 'Second attempt failed: phone unreachable' },
  ],
  'CON-240712-01': [
    { at: '09:02', ar: 'استُلمت في مركز دمشق — 3 كراتين', en: 'Received at the Damascus hub — 3 cartons' },
  ],
};

export const dayDetails: Record<string, { client: string; route: string; weight: string; cartons: number }> = {
  'CON-240703-02': { client: 'Lama Sultan',   route: 'Istanbul ← Aleppo',  weight: '44.0 kg', cartons: 3 },
  'CON-240712-01': { client: 'Rana Sabbagh',  route: 'Dubai ← Damascus',   weight: '58.1 kg', cartons: 3 },
  'CON-240711-04': { client: 'Nour Haddad',   route: 'Istanbul ← Damascus', weight: '210.4 kg', cartons: 12 },
  'CON-240712-03': { client: 'Firas Antaki',  route: 'Dubai ← Damascus',   weight: '12.5 kg', cartons: 1 },
  'CON-240712-05': { client: 'Sahar Textiles', route: 'Yiwu ← Damascus',   weight: '96.0 kg', cartons: 5 },
  'TRP-2608-014':  { client: '—',             route: 'Yiwu ← Aleppo',      weight: '1,840 kg', cartons: 60 },
};

/* seven days of intake, for the KPI sparklines — invented, like all of it */
export const weekIntake = [4, 6, 3, 8, 5, 9, 7];
export const weekMeasured = [3, 6, 3, 7, 5, 8, 6];
export const weekLate = [1, 0, 2, 1, 0, 1, 1];

/* the people a thread can name — the demonstration roster, bilingual */
export const dayStaff: { ar: string; en: string; role: string }[] = [
  { ar: 'خالد عمر',    en: 'Khaled Omar',   role: 'wh' },
  { ar: 'طارق عزيز',   en: 'Tarek Aziz',    role: 'hubsup' },
  { ar: 'منى سعيد',    en: 'Mona Said',     role: 'disp' },
  { ar: 'عمر المصري',  en: 'Omar Al-Masri', role: 'admin' },
  { ar: 'رنا يوسف',    en: 'Rana Yousef',   role: 'acct' },
  { ar: 'لينا حموي',   en: 'Lina Hamwi',    role: 'customs' },
];

/* ── an intake REGISTERED IN THIS PROTOTYPE ───────────────────────────
   The console is a window, so in the package this act belongs to B1 — but the
   prototype must let the owner WORK it: the form records here, the record
   becomes a measuring task on the day's queue, and it survives the session
   through the artifact state. */
export type Intake = {
  ref: string; client: string; from: string; to: string;
  mode: 'air' | 'land' | 'sea'; weight: number; cartons: number; at: number;
};

export function intakeToTask(i: Intake): Task {
  return {
    id: 'IN-' + i.ref,
    ar: 'طرد مستلَم ينتظر القياس', en: 'A parcel received, waiting to be measured',
    ref: i.ref, lateMs: Date.now() - i.at - 8 * H,
    verbAr: 'إلى القياس', verbEn: 'To measuring',
    open: 'ShopyLink_Action_01_ReceiveParcel.html', kind: 'measure',
  };
}

export function nextRef(existing: string[]): string {
  const d = new Date();
  const stamp = String(d.getFullYear()).slice(2) + String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0');
  let n = 1;
  const mk = () => 'CON-' + stamp + '-' + String(n).padStart(2, '0');
  while (existing.indexOf(mk()) > -1) n++;
  return mk();
}

/* trips still boarding — what the add-to-trip flow offers */
export const openTrips = [
  { ref: 'TRP-2608-021', to: 'Damascus', mode: 'land', departsAr: 'تنطلق غداً 06:00', departsEn: 'departs tomorrow 06:00' },
  { ref: 'TRP-2608-022', to: 'Aleppo',   mode: 'land', departsAr: 'تنطلق الخميس',      departsEn: 'departs Thursday' },
];
