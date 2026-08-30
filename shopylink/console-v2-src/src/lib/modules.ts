/* The console does not reimplement a module. It opens the one that owns the
   work, by its filename — so what a person does here and what he does there is
   the same act, recorded once.

   The B/C code is the identity and the filename is a description: C11 is
   Pricing, not Claims, and Action_B5_BorderFees is not B5. A name invented
   here opens onto nothing, which is how Claims became unreachable from this
   console for a week. Every name below is checked against the package by the
   contract. */

export type Item = { file: string; ar: string; en: string; perm?: string };
export type Category = { id: string; ar: string; en: string; items: Item[] };

export const CATEGORIES: Category[] = [
  {
    id: 'intake', ar: 'الاستلام', en: 'Intake',
    items: [
      { file: 'ShopyLink_Action_01_ReceiveParcel.html', ar: 'استلام طرد', en: 'Receive a parcel', perm: 'b1_ind' },
      { file: 'ShopyLink_Action_02_Consolidation.html', ar: 'التجميع', en: 'Consolidation', perm: 'b2_con' },
      { file: 'ShopyLink_Addresses.html', ar: 'العناوين', en: 'Addresses', perm: 'b0_reg' },
      { file: 'ShopyLink_SmartRegistration.html', ar: 'تسجيل عميل', en: 'Register a client', perm: 'b0_reg' },
    ],
  },
  {
    id: 'trips', ar: 'الرحلات', en: 'Trips',
    items: [
      { file: 'ShopyLink_Action_03_CreateTrip.html', ar: 'إنشاء رحلة', en: 'Create a trip', perm: 't_create' },
      { file: 'ShopyLink_Action_04_Loading.html', ar: 'التحميل', en: 'Loading', perm: 't_depart' },
      { file: 'ShopyLink_Action_05_TripJourney.html', ar: 'الرحلة', en: 'Trip journey', perm: 't_depart' },
      { file: 'ShopyLink_Action_B5_BorderFees.html', ar: 'رسوم الحدود', en: 'Border fees', perm: 't_customs' },
      { file: 'ShopyLink_Doc_VGM.html', ar: 'شهادة الوزن', en: 'VGM certificate', perm: 't_customs' },
    ],
  },
  {
    id: 'destination', ar: 'الوجهة', en: 'Destination',
    items: [
      { file: 'ShopyLink_Action_06_ArrivalReceive.html', ar: 'الوصول والاستلام', en: 'Arrival & receive', perm: 'b6_conf' },
      { file: 'ShopyLink_Action_07_Dispatcher.html', ar: 'التوزيع', en: 'Dispatcher', perm: 'b7_assign' },
      { file: 'ShopyLink_Action_08_Delivery.html', ar: 'التسليم', en: 'Delivery', perm: 'b8_mon' },
      { file: 'ShopyLink_Action_C10_Zones.html', ar: 'المناطق', en: 'Zones', perm: 'b7_assign' },
    ],
  },
  {
    id: 'money', ar: 'المال', en: 'Money',
    items: [
      { file: 'ShopyLink_Action_09_Billing.html', ar: 'الفوترة', en: 'Billing', perm: 'b9_build' },
      { file: 'ShopyLink_Pricing.html', ar: 'التسعير', en: 'Pricing', perm: 'pr_base' },
      /* Claims — the file carries no C-code, and inventing one for it opened
         this row onto a page that does not exist. */
      { file: 'ShopyLink_Action_Claims.html', ar: 'المطالبات', en: 'Claims', perm: 'b9_build' },
      { file: 'ShopyLink_Action_Cards.html', ar: 'البطاقات', en: 'Cards', perm: 'pr_cards' },
    ],
  },
  {
    id: 'network', ar: 'الشبكة', en: 'Network',
    items: [
      { file: 'ShopyLink_Action_C7_Hubs.html', ar: 'المراكز', en: 'Hubs', perm: 'nw_map' },
      { file: 'ShopyLink_Action_C8_Agents.html', ar: 'الوكلاء', en: 'Agents', perm: 'nw_agents' },
      { file: 'ShopyLink_Action_C1_Trucks.html', ar: 'الشاحنات', en: 'Trucks', perm: 'nw_fleet' },
      { file: 'ShopyLink_Action_C2_Drivers.html', ar: 'السائقون', en: 'Drivers', perm: 'nw_fleet' },
    ],
  },
  {
    id: 'admin', ar: 'الإدارة', en: 'Administration',
    items: [
      { file: 'ShopyLink_Action_C9_Staff.html', ar: 'الموظفون', en: 'Staff', perm: 'st_manage' },
      { file: 'ShopyLink_Action_C12_Approvals.html', ar: 'الموافقات', en: 'Approvals', perm: 'st_roles' },
      { file: 'ShopyLink_D1_Control.html', ar: 'لوحة التحكّم', en: 'Control board', perm: 'st_manage' },
    ],
  },
];
