import type { Metadata } from "next";
import { AdminApp } from "./admin-app";

export const metadata: Metadata = {
  title: "ຈັດການຮ້ານ",
  robots: { index: false, follow: false },
};

// Static page: login and data both happen in the browser against Supabase.
export default function AdminPage() {
  return (
    <div className="flex flex-1 flex-col bg-cream">
      <AdminApp />
    </div>
  );
}
