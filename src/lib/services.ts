export type ServiceTierId = "professional" | "professional-plus";

export type ServiceTier = {
  id: ServiceTierId;
  title: string;
  priceLabel: string;
  monthlyPriceCents: number;
  features: string[];
};

const PROFESSIONAL_FEATURES = [
  "3-5 page website",
  "Mobile responsive design",
  "Optimized SEO setup",
  "Contact form linked to business email",
  "Hosting",
  "Maintenance",
];

export const SERVICES: ServiceTier[] = [
  {
    id: "professional",
    title: "Professional Website",
    priceLabel: "$149/mo",
    monthlyPriceCents: 14900,
    features: PROFESSIONAL_FEATURES,
  },
  {
    id: "professional-plus",
    title: "Professional+ Website",
    priceLabel: "$199/mo",
    monthlyPriceCents: 19900,
    features: [
      "5-8 page website",
      ...PROFESSIONAL_FEATURES.slice(1),
      "AI FAQ Chatbot",
      "Customized design",
      "Better copy/layout help",
    ],
  },
];

export const getServiceById = (id: string) =>
  SERVICES.find((service) => service.id === id);
