import localFont from "next/font/local";
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
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
