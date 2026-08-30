/**
 * The privacy policy, in both scripts.
 *
 * DRAFT — NOT LEGAL ADVICE. The structure follows GDPR Arts. 13–14 (identity of
 * the controller, purposes and legal bases, recipients, international transfers,
 * retention, data-subject rights, right to complain) because that is the widest
 * template in common use, and it maps onto the UAE PDPL, Türkiye's KVKK and
 * China's PIPL — all of which this service touches by operating in those
 * markets. It must be reviewed by a lawyer in the jurisdiction ShopyLink is
 * established in before it is relied on.
 *
 * Every `[...]` is a fact only ShopyLink can supply. They are left VISIBLE on
 * the page on purpose: an unfilled bracket is impossible to ship by accident, an
 * invented company address is not.
 */

import type { Locale } from "@/content/site";

export type LegalBlock =
  | { kind: "p"; text: Record<Locale, string> }
  | { kind: "list"; items: readonly Record<Locale, string>[] };

export type LegalSection = {
  id: string;
  title: Record<Locale, string>;
  blocks: readonly LegalBlock[];
};

const p = (ar: string, en: string): LegalBlock => ({ kind: "p", text: { ar, en } });
const list = (items: readonly [string, string][]): LegalBlock => ({
  kind: "list",
  items: items.map(([ar, en]) => ({ ar, en })),
});

export const PRIVACY = {
  title: { ar: "سياسة الخصوصية", en: "Privacy Policy" },
  kicker: { ar: "قانوني", en: "Legal" },
  updatedLabel: { ar: "آخر تحديث", en: "Last updated" },
  updated: { ar: "٣٠ آب ٢٠٢٥", en: "30 August 2025" },
  tocLabel: { ar: "المحتويات", en: "Contents" },
  backLabel: { ar: "عودة إلى الرئيسية", en: "Back to home" },

  intro: {
    ar: "توضّح هذه السياسة أي بيانات شخصية نجمعها عنك حين تستخدم شوبي لينك، ولماذا نجمعها، ومع من نتشاركها، وما هي حقوقك عليها. نحن خدمة شحن وتجميع طرود: أنت تشتري من متاجر حول العالم، وتصل مشترياتك إلى عناويننا في تلك الأسواق، ثم نجمّعها ونشحنها إلى بابك. هذا النشاط بطبيعته يتطلّب نقل بعض بياناتك عبر الحدود، وهو ما نشرحه بالتفصيل أدناه.",
    en: "This policy explains what personal data we collect about you when you use ShopyLink, why we collect it, who we share it with, and what rights you have over it. We are a parcel forwarding and consolidation service: you buy from stores around the world, your purchases arrive at our addresses in those markets, and we consolidate and ship them to your door. That activity inherently requires moving some of your data across borders, which we set out in detail below.",
  },

  sections: [
    {
      id: "controller",
      title: { ar: "١ · من نحن", en: "1 · Who we are" },
      blocks: [
        p(
          "شوبي لينك هي الجهة المتحكّمة بالبيانات الشخصية الموصوفة في هذه السياسة، أي أنها تقرّر لماذا وكيف تُعالَج.",
          "ShopyLink is the controller of the personal data described in this policy, meaning it decides why and how that data is processed.",
        ),
        list([
          ["الاسم القانوني للكيان: [الاسم القانوني الكامل]", "Legal entity name: [full legal entity name]"],
          ["رقم السجل التجاري: [رقم السجل]", "Commercial registration number: [registration number]"],
          ["العنوان المسجّل: [العنوان الكامل]", "Registered address: [full address]"],
          ["البريد للتواصل بشأن الخصوصية: [privacy@shopylink.co]", "Privacy contact: [privacy@shopylink.co]"],
          [
            "مسؤول حماية البيانات: [الاسم أو «لم يُعيَّن»]",
            "Data Protection Officer: [name, or “not appointed”]",
          ],
        ]),
      ],
    },
    {
      id: "collect",
      title: { ar: "٢ · البيانات التي نجمعها", en: "2 · The data we collect" },
      blocks: [
        p(
          "نجمع ما يلزم لتشغيل الخدمة فعليًا، لا أكثر:",
          "We collect what the service actually needs to run, and no more:",
        ),
        list([
          [
            "بيانات الهوية والتواصل: الاسم، رقم الهاتف، البريد الإلكتروني، ولغة التواصل المفضّلة.",
            "Identity and contact data: name, phone number, email address, and preferred language.",
          ],
          [
            "بيانات التسليم: عنوان بيتك أو عملك، وأي تعليمات تسليم تكتبها لنا.",
            "Delivery data: your home or work address, and any delivery instructions you give us.",
          ],
          [
            "بيانات الطرد: رقم التتبّع، اسم المتجر، وصف المحتويات وقيمتها ووزنها — وهذه مطلوبة من الجمارك، لا اختيارية.",
            "Parcel data: tracking number, merchant, and a description, value and weight of the contents — these are required by customs, not optional.",
          ],
          [
            "بيانات الدفع: نعالج المدفوعات عبر مزوّد خدمات دفع؛ لا نخزّن أرقام بطاقاتك الكاملة على أنظمتنا.",
            "Payment data: payments are handled by a payment service provider; we do not store your full card numbers on our systems.",
          ],
          [
            "وثائق رسمية عند اللزوم: قد تطلب سلطات الجمارك في بعض الوجهات صورة هوية أو رقمًا وطنيًا للتخليص. نطلبها فقط حين يفرضها القانون.",
            "Official documents where required: customs authorities in some destinations require an ID copy or national number for clearance. We ask for these only where the law requires them.",
          ],
          [
            "المراسلات: رسائلك إلينا عبر البريد أو المحادثة، وسجلّات دعمك.",
            "Communications: your messages to us by email or chat, and your support history.",
          ],
          [
            "البيانات التقنية: عنوان IP، نوع الجهاز والمتصفّح، والصفحات التي زرتها — تُجمع عبر ملفات تعريف الارتباط الموصوفة في القسم ٥.",
            "Technical data: IP address, device and browser type, and pages visited — collected through the cookies described in section 5.",
          ],
        ]),
      ],
    },
    {
      id: "why",
      title: { ar: "٣ · لماذا نعالجها وعلى أي أساس", en: "3 · Why we process it, and on what basis" },
      blocks: [
        list([
          [
            "لتنفيذ العقد معك: استلام طرودك وتجميعها وشحنها وتتبّعها، وتحصيل رسومنا. بدون هذه البيانات لا يمكن تقديم الخدمة.",
            "To perform our contract with you: receiving, consolidating, shipping and tracking your parcels, and charging our fees. Without this data the service cannot be provided.",
          ],
          [
            "للامتثال لالتزام قانوني: الإقرارات الجمركية، وقوانين الضرائب والمحاسبة، والتحقّق من المواد الممنوعة أو الخاضعة لقيود التصدير.",
            "To comply with a legal obligation: customs declarations, tax and accounting law, and screening for prohibited or export-restricted goods.",
          ],
          [
            "لمصلحة مشروعة: منع الاحتيال، وتأمين أنظمتنا، وتحسين الخدمة. نوازن هذه المصلحة مع حقوقك، ويمكنك الاعتراض عليها (القسم ٩).",
            "For a legitimate interest: preventing fraud, securing our systems, and improving the service. We balance this against your rights, and you may object (section 9).",
          ],
          [
            "بموافقتك: التحليلات والتسويق فقط. موافقتك اختيارية تمامًا، ويمكنك سحبها في أي وقت دون أن يؤثّر ذلك على خدمتك.",
            "With your consent: analytics and marketing only. Consent is entirely optional and you may withdraw it at any time without affecting your service.",
          ],
        ]),
      ],
    },
    {
      id: "sharing",
      title: { ar: "٤ · مع من نتشاركها", en: "4 · Who we share it with" },
      blocks: [
        p(
          "لا نبيع بياناتك الشخصية. نتشاركها فقط مع الجهات التي يستلزمها تسليم طردك أو يفرضها القانون:",
          "We do not sell your personal data. We share it only with parties that delivering your parcel requires, or that the law requires:",
        ),
        list([
          [
            "شركات الشحن والنقل التي تحمل طردك في كل مرحلة.",
            "The carriers and transport companies that move your parcel at each stage.",
          ],
          [
            "سلطات الجمارك والضرائب في بلد المصدر وبلد الوجهة.",
            "Customs and tax authorities in the origin and destination countries.",
          ],
          [
            "مستودعاتنا وشركاؤنا التشغيليون في كل سوق نعمل فيه.",
            "Our warehouses and operating partners in each market we serve.",
          ],
          [
            "مزوّدو الدفع، ومزوّدو الاستضافة والبريد وأنظمة الدعم، بموجب عقود معالجة بيانات.",
            "Payment providers, and hosting, email and support-system providers, under data-processing agreements.",
          ],
          [
            "الجهات القضائية أو التنظيمية حين يُلزمنا القانون بذلك.",
            "Judicial or regulatory bodies where the law compels us.",
          ],
        ]),
        p(
          "قائمة معالِجينا الحاليين متاحة عند الطلب على [privacy@shopylink.co].",
          "A current list of our processors is available on request at [privacy@shopylink.co].",
        ),
      ],
    },
    {
      id: "cookies",
      title: { ar: "٥ · ملفات تعريف الارتباط", en: "5 · Cookies" },
      blocks: [
        p(
          "نستخدم ثلاث فئات، وتتحكّم أنت بالفئتين الأخيرتين من شريط الموافقة على الموقع، وتستطيع تغيير اختيارك متى شئت:",
          "We use three categories. You control the last two from the consent banner on the site, and you can change your choice at any time:",
        ),
        list([
          [
            "ضرورية تمامًا: لازمة لعمل الموقع — الجلسة والأمان والتنقّل وتذكّر اختيارك للّغة والموافقة نفسها. لا يمكن إيقافها ولا تعمل بموافقة.",
            "Strictly necessary: required for the site to work — session, security, navigation, and remembering your language and your consent choice itself. These cannot be switched off and do not rely on consent.",
          ],
          [
            "التحليلات: إحصاءات استخدام مجهولة الهوية تخبرنا أي الصفحات تفيد. لا يُبنى منها ملف شخصي عنك.",
            "Analytics: anonymised usage statistics telling us which pages help. No personal profile is built from them.",
          ],
          [
            "التسويق: قياس أداء الإعلانات وإعادة عرض محتوى لم تُكمل قراءته.",
            "Marketing: measuring ad performance and re-showing content you did not finish reading.",
          ],
        ]),
      ],
    },
    {
      id: "transfers",
      title: { ar: "٦ · نقل البيانات عبر الحدود", en: "6 · International transfers" },
      blocks: [
        p(
          "هذه نقطة جوهرية في خدمتنا وليست تفصيلًا: طردك يبدأ في سوق وينتهي عند بابك في بلد آخر، ولا يمكن تسليمه دون أن تنتقل بياناتك معه. لذلك تُنقل بياناتك بين الدول التي نعمل فيها — ومنها الإمارات والصين والولايات المتحدة وتركيا — وإلى بلد وجهتك.",
          "This is central to our service, not a footnote: your parcel begins in one market and ends at your door in another, and it cannot be delivered without your data travelling with it. Your data is therefore transferred between the countries we operate in — including the UAE, China, the United States and Türkiye — and to your destination country.",
        ),
        p(
          "بعض هذه الدول لا تمنحها سلطات الاتحاد الأوروبي قرار كفاية. حين ننقل بيانات إلى جهة في دولة كهذه، نعتمد على ضمانات مناسبة — الشروط التعاقدية النموذجية، أو استثناء «ضرورة تنفيذ العقد» حين ينطبق. تفاصيل الآلية المعتمدة متاحة عند الطلب.",
          "Some of these countries are not covered by an EU adequacy decision. Where we transfer data to a recipient in such a country we rely on appropriate safeguards — Standard Contractual Clauses, or the “necessary for performance of the contract” derogation where it applies. Details of the mechanism used are available on request.",
        ),
      ],
    },
    {
      id: "retention",
      title: { ar: "٧ · مدة الاحتفاظ", en: "7 · How long we keep it" },
      blocks: [
        p(
          "نحتفظ ببياناتك ما دام حسابك قائمًا، ثم للمدد التي يفرضها القانون بعد ذلك. وسجلّات الجمارك والمحاسبة لها حدّ أدنى قانوني لا نملك النزول عنه حتى لو طلبت الحذف.",
          "We keep your data for as long as your account is open, and afterwards for the periods the law requires. Customs and accounting records carry a statutory minimum that we cannot go below, even if you ask for erasure.",
        ),
        list([
          ["بيانات الحساب: [المدة]", "Account data: [period]"],
          ["سجلّات الشحن والجمارك: [المدة — عادةً تحدّدها قوانين البلد]", "Shipping and customs records: [period — normally set by national law]"],
          ["السجلّات المحاسبية: [المدة]", "Accounting records: [period]"],
          ["سجلّات الدعم: [المدة]", "Support records: [period]"],
        ]),
      ],
    },
    {
      id: "security",
      title: { ar: "٨ · الأمان", en: "8 · Security" },
      blocks: [
        p(
          "نطبّق إجراءات تقنية وتنظيمية مناسبة: التشفير أثناء النقل، وتقييد الوصول إلى من يحتاجه لعمله، وتسجيل العمليات. لكن لا نظام آمن بشكل مطلق، ولن ندّعي ذلك. إن وقع خرق يُرجَّح أن يعرّض حقوقك لخطر، نُخطر الجهة الرقابية المختصة ونُخطرك أنت حين يفرض القانون ذلك.",
          "We apply appropriate technical and organisational measures: encryption in transit, access limited to those who need it for their work, and audit logging. No system is absolutely secure, and we will not claim otherwise. If a breach occurs that is likely to put your rights at risk, we will notify the competent supervisory authority, and you, where the law requires it.",
        ),
      ],
    },
    {
      id: "rights",
      title: { ar: "٩ · حقوقك", en: "9 · Your rights" },
      blocks: [
        p(
          "تملك — بحسب القانون المنطبق عليك — الحقوق التالية، ونستجيب لها خلال [المدة، عادةً ٣٠ يومًا] ودون رسوم:",
          "Depending on the law that applies to you, you have the following rights. We respond within [period, normally 30 days] and free of charge:",
        ),
        list([
          ["الاطّلاع على بياناتك والحصول على نسخة منها.", "To access your data and receive a copy of it."],
          ["تصحيح ما هو خاطئ أو ناقص.", "To correct anything inaccurate or incomplete."],
          ["حذف بياناتك، في الحدود التي لا تصطدم بالتزام قانوني بالاحتفاظ.", "To have your data erased, so far as that does not conflict with a legal retention obligation."],
          ["تقييد المعالجة أو الاعتراض عليها.", "To restrict or object to processing."],
          ["نقل بياناتك إلى مزوّد آخر بصيغة قابلة للقراءة آليًا.", "To port your data to another provider in a machine-readable format."],
          ["سحب موافقتك على التحليلات أو التسويق في أي وقت.", "To withdraw your consent to analytics or marketing at any time."],
          ["تقديم شكوى إلى الجهة الرقابية المختصة في بلدك: [الجهة].", "To lodge a complaint with the supervisory authority in your country: [authority]."],
        ]),
      ],
    },
    {
      id: "children",
      title: { ar: "١٠ · الأطفال", en: "10 · Children" },
      blocks: [
        p(
          "خدمتنا ليست موجّهة لمن هم دون [السن] سنة، ولا نجمع بياناتهم عن قصد. إن علمنا بجمع بيانات طفل دون موافقة وليّه، نحذفها.",
          "Our service is not directed at anyone under [age], and we do not knowingly collect their data. If we learn that we have collected a child's data without a guardian's consent, we delete it.",
        ),
      ],
    },
    {
      id: "changes",
      title: { ar: "١١ · تغييرات هذه السياسة", en: "11 · Changes to this policy" },
      blocks: [
        p(
          "قد نحدّث هذه السياسة. يظهر تاريخ آخر تحديث أعلى الصفحة، وإن كان التغيير جوهريًا أخطرناك قبل نفاذه بوقت معقول.",
          "We may update this policy. The last-updated date appears at the top of this page, and where a change is material we will notify you a reasonable time before it takes effect.",
        ),
      ],
    },
    {
      id: "contact",
      title: { ar: "١٢ · التواصل معنا", en: "12 · Contact us" },
      blocks: [
        p(
          "لأي سؤال عن هذه السياسة أو لممارسة أي من حقوقك، راسلنا على [privacy@shopylink.co]، أو بالبريد على العنوان المسجّل في القسم ١.",
          "For any question about this policy, or to exercise any of your rights, write to us at [privacy@shopylink.co], or by post to the registered address in section 1.",
        ),
      ],
    },
  ] as const satisfies readonly LegalSection[],
} as const;
