/* The console does not reimplement a module. It opens the one that owns the
   work, by its filename — so what a person does here and what he does there is
   the same act, recorded once.

   The B/C code is the identity and the filename is a description: C11 is
   Pricing, not Claims, and Action_B5_BorderFees is not B5. A name invented
   here opens onto nothing, which is how Claims became unreachable from this
   console for a week. Every name below is checked against the package by the
   contract. */

export type Item = { file: string; ar: string; en: string; perm?: string; descAr?: string; descEn?: string };
export type Category = { id: string; ar: string; en: string; items: Item[] };

export const CATEGORIES: Category[] = [
  {
    id: 'intake', ar: 'الاستلام', en: 'Intake',
    items: [
      { file: 'ShopyLink_Action_01_ReceiveParcel.html', ar: 'استلام طرد', en: 'Receive a parcel', perm: 'b1_ind', descAr: 'استلام الطرود في المركز: وزن وقياس وتصوير وطباعة ملصق لكل قطعة.', descEn: 'Intake at the centre: weigh, measure, photograph and label every piece.' },
      { file: 'ShopyLink_Action_02_Consolidation.html', ar: 'التجميع', en: 'Consolidation', perm: 'b2_con', descAr: 'تجميع طرود العملاء في حمولات جاهزة للرحلة.', descEn: 'Consolidate client parcels into trip-ready loads.' },
      { file: 'ShopyLink_Addresses.html', ar: 'العناوين', en: 'Addresses', perm: 'b0_reg', descAr: 'عناوين التسوّق التي تُمنح للعملاء في بلدان الشراء.', descEn: 'The shopping addresses issued to clients in the buying countries.' },
      { file: 'ShopyLink_SmartRegistration.html', ar: 'تسجيل عميل', en: 'Register a client', perm: 'b0_reg', descAr: 'تسجيل عميل جديد وإصدار عنوانه.', descEn: 'Register a new client and issue their address.' },
    ],
  },
  {
    id: 'trips', ar: 'الرحلات', en: 'Trips',
    items: [
      { file: 'ShopyLink_Action_03_CreateTrip.html', ar: 'إنشاء رحلة', en: 'Create a trip', perm: 't_create', descAr: 'إنشاء رحلة وإسناد الشاحنة والسائق وأوراقها.', descEn: 'Create a trip; assign the truck, the driver and its papers.' },
      { file: 'ShopyLink_Action_04_Loading.html', ar: 'التحميل', en: 'Loading', perm: 't_depart', descAr: 'تحميل الشاحنة وتسليم العهدة للسائق.', descEn: 'Load the truck and hand the driver his float.' },
      { file: 'ShopyLink_Action_05_TripJourney.html', ar: 'الرحلة', en: 'Trip journey', perm: 't_depart', descAr: 'الرحلة ومعابرها حتى الوصول.', descEn: 'The journey and its crossings, to arrival.' },
      { file: 'ShopyLink_Action_B5_BorderFees.html', ar: 'رسوم الحدود', en: 'Border fees', perm: 't_customs', descAr: 'رسوم المعابر: من دفع، وتسويتها، وعلى من تقع.', descEn: 'Border money: who paid, its settlement, who bears it.' },
      { file: 'ShopyLink_Doc_VGM.html', ar: 'شهادة الوزن', en: 'VGM certificate', perm: 't_customs', descAr: 'شهادة الوزن الموثَّق للحاويات البحرية.', descEn: 'The verified gross mass certificate for sea containers.' },
    ],
  },
  {
    id: 'destination', ar: 'الوجهة', en: 'Destination',
    items: [
      { file: 'ShopyLink_Action_06_ArrivalReceive.html', ar: 'الوصول والاستلام', en: 'Arrival & receive', perm: 'b6_conf', descAr: 'استقبال الرحلة في مركز الوجهة وفكّ حمولتها.', descEn: 'Receive the trip at the destination hub and break its load.' },
      { file: 'ShopyLink_Action_07_Dispatcher.html', ar: 'التوزيع', en: 'Dispatcher', perm: 'b7_assign', descAr: 'توزيع الشحنات الواصلة على جولات السائقين.', descEn: 'Assign arrived shipments to driver runs.' },
      { file: 'ShopyLink_Action_08_Delivery.html', ar: 'التسليم', en: 'Delivery', perm: 'b8_mon', descAr: 'التسليم الأخير: المحاولات والإثباتات والمرتجعات.', descEn: 'The last mile: attempts, proof, returns.' },
      { file: 'ShopyLink_Action_C10_Zones.html', ar: 'المناطق', en: 'Zones', perm: 'b7_assign', descAr: 'مناطق التوزيع وأحياؤها وأجورها.', descEn: 'Delivery zones, their districts and fees.' },
    ],
  },
  {
    id: 'money', ar: 'المال', en: 'Money',
    items: [
      { file: 'ShopyLink_Action_09_Billing.html', ar: 'الفوترة', en: 'Billing', perm: 'b9_build', descAr: 'عروض الأسعار والفواتير: بناءً وإصداراً وتحصيلاً.', descEn: 'Quotations and invoices: build, issue, collect.' },
      { file: 'ShopyLink_Pricing.html', ar: 'التسعير', en: 'Pricing', perm: 'pr_base', descAr: 'التعرفة: خطوط أساس، أسعار متفقة، خدمات، بطاقات.', descEn: 'The tariff: base lanes, agreed prices, services, cards.' },
      /* Claims — the file carries no C-code, and inventing one for it opened
         this row onto a page that does not exist. */
      { file: 'ShopyLink_Action_Claims.html', ar: 'المطالبات', en: 'Claims', perm: 'b9_build', descAr: 'مطالبات الضرر والفقدان حتى إشعار الدائن.', descEn: 'Damage and loss claims through to the credit note.' },
      { file: 'ShopyLink_Action_Cards.html', ar: 'البطاقات', en: 'Cards', perm: 'pr_cards', descAr: 'البطاقات المدفوعة مسبقاً وموزّعوها.', descEn: 'Prepaid cards and their suppliers.' },
    ],
  },
  {
    id: 'network', ar: 'الشبكة', en: 'Network',
    items: [
      { file: 'ShopyLink_Action_C7_Hubs.html', ar: 'المراكز', en: 'Hubs', perm: 'nw_map', descAr: 'الدول والمدن والمراكز والمعابر — شبكة التشغيل.', descEn: 'Countries, cities, hubs and stops — the operating network.' },
      { file: 'ShopyLink_Action_C8_Agents.html', ar: 'الوكلاء', en: 'Agents', perm: 'nw_agents', descAr: 'وكلاء التخليص وخدماتهم على المعابر.', descEn: 'Clearing agents and their services at the crossings.' },
      { file: 'ShopyLink_Action_C1_Trucks.html', ar: 'الشاحنات', en: 'Trucks', perm: 'nw_fleet', descAr: 'الشاحنات وأوراقها وصيانتها.', descEn: 'Trucks, their papers and maintenance.' },
      { file: 'ShopyLink_Action_C2_Drivers.html', ar: 'السائقون', en: 'Drivers', perm: 'nw_fleet', descAr: 'السائقون: وثائقهم وتأشيراتهم وإجازاتهم.', descEn: 'Drivers: documents, visas, leave.' },
    ],
  },
  {
    id: 'admin', ar: 'الإدارة', en: 'Administration',
    items: [
      { file: 'ShopyLink_Action_C9_Staff.html', ar: 'الموظفون', en: 'Staff', perm: 'st_manage', descAr: 'الموظفون والمناصب والصلاحيات — مصدر الحقيقة للوصول.', descEn: 'People, positions and grants — the source of truth for access.' },
      { file: 'ShopyLink_Action_C12_Approvals.html', ar: 'الموافقات', en: 'Approvals', perm: 'st_roles', descAr: 'كل ما ينتظر توقيع من هو أعلى.', descEn: 'Everything waiting on a senior signature.' },
      { file: 'ShopyLink_D1_Control.html', ar: 'لوحة التحكّم', en: 'Control board', perm: 'st_manage', descAr: 'لوحة القيادة: المهام المشتقّة وأعمار الشحنات والبوابات.', descEn: 'The control board: derived work, shipment lifetimes, the gates.' },
    ],
  },
];
