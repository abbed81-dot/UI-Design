import type { Shipment, Trip, Notice, Person, Approval, LogEvent } from './channels';
import type { Hub } from './derive';

/* A demonstration day. Nothing here is reference data — the names, the prices
   and the routes are invented, and the page says so in its own chrome whenever
   it is drawing from this file rather than from a register. */

const H = 3600000;
const now = () => Date.now();

export const seedHubs: Hub[] = [
  { id: 'H-DAM', name: 'Damascus Hub', city: 'Damascus', country: 'Syria' },
  { id: 'H-ALP', name: 'Aleppo Hub', city: 'Aleppo', country: 'Syria' },
  { id: 'H-HOM', name: 'Homs Hub', city: 'Homs', country: 'Syria' },
  { id: 'H-LAT', name: 'Latakia Hub', city: 'Latakia', country: 'Syria' },
  { id: 'H-IST', name: 'Istanbul Hub', city: 'Istanbul', country: 'Turkey' },
  { id: 'H-GAZ', name: 'Gaziantep Hub', city: 'Gaziantep', country: 'Turkey' },
  { id: 'H-DXB', name: 'Dubai Hub', city: 'Dubai', country: 'UAE' },
  { id: 'H-YIW', name: 'Yiwu Hub', city: 'Yiwu', country: 'China' },
];

export const seedShips: Shipment[] = [
  { ship: 'CON-240712-01', client: 'Rana Sabbagh', from: 'Dubai', to: 'Damascus', mode: 'air', weight: 58.1, cartons: 3, stage: 'received', at: now() - 9 * H, attempts: 0, open: true },
  { ship: 'CON-240711-04', client: 'Nour Haddad', from: 'Istanbul', to: 'Damascus', mode: 'land', weight: 210.4, cartons: 12, stage: 'consolidated', at: now() - 6 * H, attempts: 0, open: true },
  { ship: 'CON-240711-02', client: 'TechLine Trading', from: 'Yiwu', to: 'Aleppo', mode: 'sea', weight: 1840, cartons: 60, stage: 'loaded', at: now() - 4 * H, attempts: 0, open: true },
  { ship: 'CON-240710-07', client: 'Bayt al-Zayt', from: 'Dubai', to: 'Homs', mode: 'air', weight: 33.2, cartons: 2, stage: 'departed', at: now() - 30 * H, attempts: 0, open: true },
  { ship: 'CON-240709-03', client: 'Marwan Deeb', from: 'Istanbul', to: 'Latakia', mode: 'land', weight: 96, cartons: 5, stage: 'arrived', at: now() - 3 * H, attempts: 0, open: true },
  { ship: 'CON-240708-01', client: 'Sahar Textiles', from: 'Yiwu', to: 'Damascus', mode: 'sea', weight: 2410, cartons: 88, stage: 'cleared', at: now() - 2 * H, attempts: 0, open: true },
  { ship: 'CON-240707-05', client: 'Firas Antaki', from: 'Dubai', to: 'Damascus', mode: 'air', weight: 12.5, cartons: 1, stage: 'assigned', at: now() - 2 * H, attempts: 1, open: true },
  { ship: 'CON-240703-02', client: 'Lama Sultan', from: 'Istanbul', to: 'Aleppo', mode: 'land', weight: 44, cartons: 3, stage: 'assigned', at: now() - 26 * H, attempts: 2, open: true },
  { ship: 'CON-240701-02', client: 'Ziad Halabi', from: 'Dubai', to: 'Damascus', mode: 'air', weight: 8.4, cartons: 1, stage: 'assigned', at: now() - 4 * H, attempts: 2, open: true },
  { ship: 'CON-240628-09', client: 'Rim Ayoub', from: 'Yiwu', to: 'Homs', mode: 'sea', weight: 640, cartons: 22, stage: 'delivered', at: now() - 50 * H, attempts: 0, open: false },
];

export const seedTrips: Trip[] = [
  { trip: 'TRP-2608-014', from: 'Yiwu', to: 'Aleppo', stage: 'departed', mode: 'sea', at: now() - 40 * H },
  { trip: 'TRP-2608-011', from: 'Istanbul', to: 'Damascus', stage: 'arrived', mode: 'land', at: now() - 70 * H },
];

export const seedNotices: Notice[] = [
  {
    id: 'N-1',
    kind: 'policy',
    ar: 'من هذا الشهر كل حساب أعمال بالدفع المسبق ما لم يُمنح تسهيل ائتماني كتابةً.',
    en: 'From this month every business account is prepaid unless a credit facility is granted in writing.',
    by: 'Omar Al-Masri',
    at: '2026-08-28',
    audience: { all: true },
  },
];

export const seedMe: Person = {
  id: 'U-02', name: 'Khaled Omar', role: 'wh', level: 1, status: 'active', onLeave: false,
  perms: ['b1_ind', 'b1_biz', 'b2_con'], duties: ['measure'],
  dutyAr: 'يقيس ويستلم في مركزه', dutyEn: 'Receives and measures at his centre',
  reportsTo: 'hubsup', scope: { type: 'list', countries: [], hubs: ['H-DAM'] },
};

export const seedApprovals: Approval[] = [];
export const seedEvents: LogEvent[] = [];
