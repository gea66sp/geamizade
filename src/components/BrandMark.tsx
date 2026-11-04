import Image from "next/image";

interface BrandMarkProps {
  className?: string;
  size?: number;
}

export default function BrandMark({ className = "", size = 32 }: BrandMarkProps) {
  return (
    <Image
      src="/simbolo.jpg"
      alt="Símbolo do GE Amizade"
      width={size}
      height={size}
      className={`object-contain rounded-full ${className}`}
    />
  );
}
