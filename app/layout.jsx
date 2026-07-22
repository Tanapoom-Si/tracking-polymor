import "./globals.css";

export const metadata = {
  title: "Trace Fiber",
  description: "Trace Flat screen defects back to related tow cans and spinning windows."
};

export default function RootLayout({ children }) {
  return (
    <html lang="th">
      <body>{children}</body>
    </html>
  );
}
