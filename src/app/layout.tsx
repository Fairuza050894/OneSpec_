import type { Metadata } from 'next';
import './globals.css';
import { StudioLocaleProvider } from '@/lib/i18n';

export const metadata: Metadata = {
  title: 'OneSpec SDLC Workbench | ISO/IEC/IEEE 29148 & 29119 Engineering Platform',
  description:
    'High-Density Software Engineering, Business Analysis, Technical Writing, and QA Telemetry Workbench powered by morluto/rea.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="w-screen h-screen overflow-hidden bg-[#0B0C0E] text-[#EDEDED] antialiased selection:bg-[#2563EB]/40">
        <StudioLocaleProvider>{children}</StudioLocaleProvider>
      </body>
    </html>
  );
}
