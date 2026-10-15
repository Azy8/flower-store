import type { Metadata, Viewport } from "next";
import { Noto_Sans, Noto_Sans_Lao } from "next/font/google";
import "./globals.css";

// Lao glyphs come from Noto Sans Lao; Latin letters and digits from Noto Sans.
// Thai falls back to the phone's system Thai font.
const lao = Noto_Sans_Lao({
  variable: "--font-lao",
  subsets: ["lao"],
  weight: ["400", "500", "600", "700"],
});
const latin = Noto_Sans({
  variable: "--font-latin",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "ແຄັດຕາລັອກດອກໄມ້",
  description: "ເບິ່ງແບບຊໍ່ດອກໄມ້ ກະຕ່າ ແລະ ພວງມາລາຂອງຮ້ານ ແລ້ວທັກຮ້ານເພື່ອສັ່ງໄດ້ເລີຍ",
};

export const viewport: Viewport = {
  themeColor: "#c23659",
  // lets env(safe-area-inset-bottom) keep bottom buttons above the iPhone home bar
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="lo" className={`${lao.variable} ${latin.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
