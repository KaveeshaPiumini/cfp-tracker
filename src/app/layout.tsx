import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CFP Tracker — Conference Call for Papers",
  description:
    "Discover, track, and submit to Conference Call for Papers across tech, security, IAM, and more.",
  openGraph: {
    title: "CFP Tracker",
    description: "Discover Conference Call for Papers",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin=""
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme');
                  var supportDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  if (!theme || theme === 'system') {
                    theme = supportDarkMode ? 'dark' : 'light';
                  }
                  document.documentElement.setAttribute('data-theme', theme);
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body style={{ transition: 'background-color 0.3s ease, color 0.3s ease' }}>{children}</body>
    </html>
  );
}
