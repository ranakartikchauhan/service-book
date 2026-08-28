import "./globals.css";

export const metadata = {
  title: "WorkMarket — Find Local Workers or Get Hired Near You",
  description:
    "WorkMarket connects households with trusted local workers for cleaning, cooking, gardening, kitchen deep-cleans, and more. Safe, simple, and in-app payments.",
  keywords: "local workers, cleaning service, home help, gig marketplace, hire worker, India",
  openGraph: {
    title: "WorkMarket — Local Work Marketplace",
    description: "Find trusted local workers or get hired for local jobs. Payments inside the app.",
    type: "website",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
