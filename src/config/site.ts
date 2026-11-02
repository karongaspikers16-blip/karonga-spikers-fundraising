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
  | "tournament"
  | "logistics";

export type JourneyIcon = "qualifiers" | "qualified" | "fundraising" | "travel" | "compete";

export type TierId = "gold" | "silver" | "bronze";

export type ContributionMethod = "airtel_money" | "tnm_mpamba" | "bank" | "cash" | "in_kind" | "other";

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
  // TODO: replace with the live Vercel URL (used for share links and previews).
  siteUrl: "https://karonga-spikers.vercel.app",

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
  },

  // SAMPLE estimates. They add up to the target above; adjust both together.
  needs: {
    isSample: true,
    items: [
      {
        icon: "transport",
        title: "Transport",
        description: "Return travel from Karonga to Mzuzu for players and officials.",
        estimate: 450_000,
      },
      {
        icon: "accommodation",
        title: "Accommodation",
        description: "Three nights in Mzuzu for the full squad.",
        estimate: 600_000,
      },
      {
        icon: "meals",
        title: "Meals and refreshments",
        description: "Breakfast, lunch, supper and drinking water on match days.",
        estimate: 500_000,
      },
      {
        icon: "tournament",
        title: "Tournament expenses",
        description: "Registration and affiliation fees for the national event.",
        estimate: 250_000,
      },
      {
        icon: "logistics",
        title: "Team logistics",
        description: "Kit, first aid, balls and communication during the trip.",
        estimate: 200_000,
      },
    ],
    budgetPdf: { href: "/documents/karonga-spikers-budget-2026.pdf", sizeLabel: "PDF, 0.8 MB" },
  },

  // SAMPLE payment details. Replace with the club's verified accounts.
  payments: {
    isSample: true,
    afterDonatingNote:
      "After you send, message us your name and amount on WhatsApp so we can thank you and keep the total up to date.",
    mobileMoney: [
      {
        provider: "Airtel Money / TNM Mpamba",
        number: "+265 999 123 456",
        accountName: "Karonga Spikers Volleyball Club",
      },
    ],
    bank: {
      bankName: "National Bank of Malawi",
      accountNumber: "1234567890",
      accountName: "Karonga Spikers Volleyball Club",
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
