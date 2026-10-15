// โหลดดิ้ง: ดอกไม้ 🌸 สามดอก ผลัดกันขยายใหญ่-หดเล็ก (ไม่มีข้อความ)
import { t } from "@/lib/i18n";

export default function FlowerLoader({ fullScreen = false }: { fullScreen?: boolean }) {
  const loader = (
    <div role="status" className="flex h-16 items-center gap-3">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          aria-hidden
          className="animate-bloom inline-block text-4xl"
          // each flower is a third of a cycle behind the previous one, so they take turns being big
          style={{ animationDelay: `${i * 0.4}s` }}
        >
          🌸
        </span>
      ))}
      {/* text for screen readers only */}
      <span className="sr-only">{t.loading}</span>
    </div>
  );

  if (!fullScreen) return <div className="flex justify-center py-10">{loader}</div>;

  return (
    <main className="flex min-h-dvh items-center justify-center bg-gradient-to-b from-[#f7e3f3] to-[#e6d3f2]">
      {loader}
    </main>
  );
}
