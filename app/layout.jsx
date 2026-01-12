import '../styles/globals.css';

export const metadata = {
  title: 'Content Hub - Admin Dashboard',
  description: 'Manage your content, collections, and configurations',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
