import Image from "next/image";
import { FlowerPlaceholder } from "./icons";

/** Product photo filling its (relatively positioned) parent, or a drawn placeholder. */
export function ProductImage({ image, alt, sizes }: { image: string | null; alt: string; sizes: string }) {
  if (!image) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-blush p-[12%]">
        <FlowerPlaceholder className="h-full w-auto opacity-80" />
      </div>
    );
  }
  return <Image src={image} alt={alt} fill sizes={sizes} className="object-cover" />;
}
