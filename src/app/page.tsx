import Portfolio from "@/views/Portfolio";

const profileStructuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": "https://adamesoliman.com/#website",
      url: "https://adamesoliman.com/",
      name: "Adam Soliman",
      alternateName: ["adamesoliman.com", "Adam Soliman Portfolio"],
      inLanguage: "en-US",
    },
    {
      "@type": "ProfilePage",
      "@id": "https://adamesoliman.com/#profile-page",
      url: "https://adamesoliman.com/",
      name: "Adam Soliman | Full-Stack & AI Developer",
      isPartOf: { "@id": "https://adamesoliman.com/#website" },
      mainEntity: { "@id": "https://adamesoliman.com/#person" },
    },
    {
      "@type": "Person",
      "@id": "https://adamesoliman.com/#person",
      name: "Adam Soliman",
      url: "https://adamesoliman.com/",
      image: "https://adamesoliman.com/headshot.jpg",
      jobTitle: "Full-Stack Developer",
      description:
        "NYU computer science student focused on AI research, machine learning, entrepreneurship, and full-stack development.",
      sameAs: [
        "https://github.com/adamsolimancs/",
        "https://www.linkedin.com/in/adam-soliman-71256b291/",
      ],
      knowsAbout: [
        "Full-stack development",
        "Artificial intelligence",
        "Machine learning",
        "React",
        "Next.js",
        "Python",
      ],
    },
  ],
};

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(profileStructuredData).replace(/</g, "\\u003c"),
        }}
      />
      <Portfolio />
    </>
  );
}
