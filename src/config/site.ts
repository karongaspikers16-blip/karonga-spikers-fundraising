/**
 * KARONGA SPIKERS: SITE CONFIGURATION
 * ----------------------------------------------------------------
 * Every figure, payment detail and contact shown on the page lives
 * in this file. Nothing is hard-coded in the components.
 *
 * Values marked SAMPLE are mock data for the design. Before sharing
 * the page publicly:
 *   1. Replace each SAMPLE value with verified club details.
 *   2. Set the matching `isSample` flag to false. That removes the
 *      yellow "Sample" badge from that part of the page.
 * ----------------------------------------------------------------
 */

export type NeedIcon =
  | "transport"
  | "accommodation"
  | "meals"
  | "refreshments"
  | "tournament"
  | "contingency";

export type JourneyIcon = "qualifiers" | "qualified" | "fundraising" | "travel" | "compete";

export type TierId = "gold" | "silver" | "bronze";

export type ContributionMethod = "airtel_money" | "tnm_mpamba" | "bank" | "cash" | "in_kind" | "other" | "paychangu";

export type SupporterType = "supporter" | "student" | "former_player" | "business" | "other";

export type UpdateCategory = "training" | "fundraising" | "sponsors" | "travel" | "match_day" | "general";

export type SiteConfig = {
  siteUrl: string;
  club: {
    name: string;
    shortName: string;
    town: string;
    /** Image inside /public with its pixel size. null shows the KS monogram. */
    logo: { src: string; width: number; height: number } | null;
  };
  tournament: {
    name: string;
    dates: string;
    /** First day of the tournament (YYYY-MM-DD), for the countdown in the admin dashboard. */
    startsOn: string;
    venue: string;
    status: string;
  };
  hero: {
    /**
     * Background photos, shown in this order and cross-faded. The first one also
     * appears in the WhatsApp/Facebook share preview. An empty list shows the
     * court-line background instead.
     */
    slides: {
      /** Path inside /public, e.g. "/images/team.jpg". */
      src: string;
      /** Photographer credit shown while this photo is on screen. null hides it. */
      credit: string | null;
      /** Which part of the photo stays in view when it is cropped, as "x% y%". */
      position: string;
    }[];
    /** Seconds each photo stays on screen. */
    secondsPerSlide: number;
  };
  fundraising: {
    isSample: boolean;
    currency: string;
    target: number;
    raised: number;
    lastUpdated: string;
    /** Smallest amount the website form accepts. The live value is in Admin → Settings. */
    minContribution: number;
  };
  needs: {
    isSample: boolean;
    items: {
      icon: NeedIcon;
      title: string;
      description: string;
      /** Estimated cost. null hides the amount for this item. */
      estimate: number | null;
    }[];
    /** Downloadable budget. null hides the button. */
    budgetPdf: { href: string; sizeLabel: string } | null;
  };
  payments: {
    isSample: boolean;
    afterDonatingNote: string;
    mobileMoney: {
      provider: string;
      number: string;
      accountName: string;
    }[];
    bank: {
      bankName: string;
      accountNumber: string;
      accountName: string;
      /** null hides the row. */
      branch: string | null;
      /** For supporters sending money from abroad. null hides the row. */
      swiftCode: string | null;
    };
  };
  sponsorship: {
    tiers: {
      id: TierId;
      name: string;
      /** Minimum amount. null shows "Amount by arrangement". */
      amount: number | null;
      benefits: string[];
    }[];
    /** Confirmed sponsors. The "Thank you to our sponsors" strip only appears once this has names. */
    currentSponsors: { name: string; tier: TierId }[];
  };
  /** Organisations working with the club, shown in "Our partners". The section hides when empty. */
  partners: {
    shortName: string;
    name: string;
    role: string;
    /** Image inside /public with its pixel size. */
    logo: { src: string; width: number; height: number };
    url: string | null;
  }[];
  journey: {
    /** 1-based index of the stage the club is at right now. */
    currentStep: number;
    steps: {
      icon: JourneyIcon;
      title: string;
      description: string;
      when: string | null;
    }[];
  };
  /** Labels for how a contribution was paid, used in the admin dashboard and the public form. */
  contributionMethods: Record<ContributionMethod, string>;
  updates: {
    /** Labels for the post categories, in the order the filter chips appear. */
    categories: Record<UpdateCategory, string>;
    /** Longest post body the secretary can write. */
    maxBodyLength: number;
    /** Most photos one post can hold. Also enforced in supabase/schema.sql. */
    maxPhotos: number;
  };
  /**
   * Wording for the daily challenge card and the daily announcement. The daily target,
   * dates, cut-off and on/off switch are live settings in Admin → Settings.
   */
  challenge: {
    tagline: string;
    /** The day the team leaves for the tournament (YYYY-MM-DD), for "N days until we travel". */
    travelsOn: string;
    signOff: string;
  };
  /**
   * "Pay online" through PayChangu's hosted checkout. Needs PAYCHANGU_SECRET_KEY on the server;
   * without it the site keeps the manual payment details only.
   */
  onlinePayments: {
    /** Shown at the top of the PayChangu checkout. */
    checkoutTitle: string;
    checkoutDescription: string;
    /** Sent with every payment so it can be traced in the PayChangu dashboard. */
    meta: { campaign: string; club: string };
    /** Quick-pick amounts on /donate, in kwacha. */
    quickAmounts: number[];
    supporterTypes: Record<SupporterType, string>;
    /** Under the pay button: who processes the payment and where the money goes. */
    partnerNote: string;
  };
  contact: {
    isSample: boolean;
    phoneDisplay: string;
    /** Digits only, with country code and no "+", for wa.me links. */
    whatsappNumber: string;
    email: string;
    facebookName: string;
    facebookUrl: string;
  };
};

export const siteConfig: SiteConfig = {
  // The live address, used in share links, previews and the daily announcement.
  siteUrl: "https://karonga-spikers-fundraising.vercel.app",

  club: {
    name: "Karonga Spikers Volleyball Club",
    shortName: "Karonga Spikers",
    town: "Karonga",
    logo: { src: "/images/logo.png", width: 484, height: 512 },
  },

  tournament: {
    name: "Raiply National Volleyball Tournament",
    dates: "13–15 November 2026",
    startsOn: "2026-11-13",
    venue: "Mzuzu, Malawi",
    status: "Qualified",
  },

  hero: {
    slides: [
      { src: "/images/team.jpg", credit: "Tufye-C Photography", position: "60% 30%" },
      // TODO: add the photographer's name for the next two photos if known.
      { src: "/images/triple-block.jpg", credit: null, position: "50% 28%" },
      { src: "/images/net-action.jpg", credit: "Tufye-C Photography", position: "55% 35%" },
      { src: "/images/jump-serve.jpg", credit: null, position: "50% 52%" },
    ],
    secondsPerSlide: 6,
  },

  // SAMPLE figures. Progress and remaining amount are calculated from these two numbers.
  fundraising: {
    isSample: true,
    currency: "MWK",
    target: 2_000_000,
    raised: 650_000,
    lastUpdated: "1 November 2026",
    minContribution: 200,
  },

  // From the official budget (public/documents/karonga-spikers-budget-2026.pdf). They add up to the target above.
  needs: {
    isSample: false,
    items: [
      {
        icon: "transport",
        title: "Transport",
        description: "Return travel from Karonga to Mzuzu for players and officials.",
        estimate: 750_000,
      },
      {
        icon: "accommodation",
        title: "Accommodation",
        description: "Lodging in Mzuzu for the squad and officials during the tournament.",
        estimate: 500_000,
      },
      {
        icon: "meals",
        title: "Food",
        description: "Breakfast, lunch and supper for the squad.",
        estimate: 300_000,
      },
      {
        icon: "refreshments",
        title: "Refreshments",
        description: "Drinking water and refreshments on match days.",
        estimate: 50_000,
      },
      {
        icon: "tournament",
        title: "Affiliation fees",
        description: "Affiliation and registration fees for the national tournament.",
        estimate: 200_000,
      },
      {
        icon: "contingency",
        title: "Contingency",
        description: "Reserve for emergencies such as injuries, delays or unexpected costs.",
        estimate: 200_000,
      },
    ],
    budgetPdf: { href: "/documents/karonga-spikers-budget-2026.pdf", sizeLabel: "PDF, 0.8 MB" },
  },

  // From the official budget (public/documents/karonga-spikers-budget-2026.pdf).
  payments: {
    isSample: false,
    afterDonatingNote:
      "After you send, message us your name and amount on WhatsApp so we can thank you and keep the total up to date.",
    mobileMoney: [
      {
        provider: "Airtel Money",
        number: "0992 165 716",
        accountName: "Abel Chilongo (Club Treasurer)",
      },
      {
        provider: "TNM Mpamba",
        number: "0885 272 182",
        accountName: "Abel Chilongo (Club Treasurer)",
      },
    ],
    bank: {
      bankName: "National Bank of Malawi",
      accountNumber: "1004653528",
      accountName: "Abel Chilongo (Club Treasurer)",
      branch: null,
      swiftCode: null,
    },
  },

  sponsorship: {
    tiers: [
      {
        id: "gold",
        name: "Gold Sponsor",
        amount: null,
        benefits: [
          "Major financial contribution",
          "Prominent recognition on this fundraising page",
          "Recognition in all campaign communications",
        ],
      },
      {
        id: "silver",
        name: "Silver Sponsor",
        amount: null,
        benefits: [
          "Financial or logistical contribution",
          "Recognition on this fundraising page",
          "Appreciation on our social media",
        ],
      },
      {
        id: "bronze",
        name: "Bronze Sponsor",
        amount: null,
        benefits: [
          "Smaller financial contribution",
          "Recognition as a club supporter",
          "Appreciation on our social media",
        ],
      },
    ],
    // Example: [{ name: "Karonga Hardware Ltd", tier: "gold" }]
    currentSponsors: [],
  },

  partners: [
    {
      shortName: "TWH",
      name: "Travel with Hawkins",
      role: "Digital partner: our website and online payments",
      logo: { src: "/images/travel with hawkins logo.png", width: 2000, height: 2000 },
      url: "https://www.travelwithhawkins.com",
    },
  ],

  journey: {
    currentStep: 3,
    steps: [
      {
        icon: "qualifiers",
        title: "Regional qualifiers",
        description: "Karonga Spikers compete against the best clubs in the region.",
        when: null,
      },
      {
        icon: "qualified",
        title: "Qualified",
        description: "The club earns its place at the national tournament.",
        when: null,
      },
      {
        icon: "fundraising",
        title: "Fundraising campaign",
        description: "We ask Karonga and friends of the club to help us get there.",
        when: "Now",
      },
      {
        icon: "travel",
        title: "Travel to Mzuzu",
        description: "The squad and officials make the journey south.",
        when: "Before 13 November",
      },
      {
        icon: "compete",
        title: "National tournament",
        description: "We take the court at the Raiply National Volleyball Tournament.",
        when: "13–15 November 2026",
      },
    ],
  },

  contributionMethods: {
    airtel_money: "Airtel Money",
    tnm_mpamba: "TNM Mpamba",
    bank: "Bank transfer",
    cash: "Cash",
    in_kind: "In kind (goods or services)",
    other: "Other",
    paychangu: "Online (PayChangu)",
  },

  // News posts are written in the admin area (/admin) and stored in Supabase.
  updates: {
    categories: {
      training: "Training",
      fundraising: "Fundraising",
      sponsors: "Sponsors",
      travel: "Travel",
      match_day: "Match day",
      general: "General",
    },
    maxBodyLength: 2000,
    maxPhotos: 8,
  },

  challenge: {
    tagline: "Every kwacha counts. Together, we can make Karonga proud.",
    travelsOn: "2026-11-12",
    signOff: "Together, we can make Karonga proud. Yours in sport! 🏐",
  },

  onlinePayments: {
    checkoutTitle: "Karonga Spikers Volleyball Club",
    checkoutDescription: "Contribution to the team's trip to the Raiply National Volleyball Tournament, Mzuzu",
    meta: { campaign: "national-tournament-2026", club: "Karonga Spikers Volleyball Club" },
    quickAmounts: [500, 1000, 5000, 10000],
    supporterTypes: {
      supporter: "Supporter",
      student: "Student",
      former_player: "Former player",
      business: "Business",
      other: "Other",
    },
    partnerNote:
      "Online payments are processed securely by PayChangu through Travel with Hawkins, the club's digital partner, and transferred to the Club Treasurer, Abel Chilongo. You may see 'Travel with Hawkins' on the payment screen.",
  },

  // Used when Supabase is not set up; the live values are edited in /admin/settings.
  contact: {
    isSample: false,
    // Club manager, for phone calls.
    phoneDisplay: "+265 884 146 528",
    whatsappNumber: "265881049237",
    email: "karongaspikers16@gmail.com",
    facebookName: "Karonga Spikers Volleyball Club",
    facebookUrl: "https://www.facebook.com/profile.php?id=100070948154077",
  },
};
