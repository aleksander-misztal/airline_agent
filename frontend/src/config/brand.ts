// Projekt treningowy – branding Qatar Airways tylko do nauki.
export const brand = {
  name: "Qatar Airways",
  assistantName: "Wirtualny asystent",
  colors: {
    primary: "#5C0632",
    primaryDark: "#45041F",
    gray: "#5C6670",
  },
  // Wyszukiwarka lotów z kafelka na Dashboardzie – zewnętrzna strona, otwierana w nowej karcie.
  flightSearchUrl: "https://www.qatarairways.com/",
  logo: {
    full: "/brand/logo-full.png",
    wordmark: "/brand/logo-wordmark.png",
    oryx: "/brand/logo-oryx.png",
  },
} as const;
