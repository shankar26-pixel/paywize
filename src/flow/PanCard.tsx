/** PAN card illustration (Figma "PAN card"), drawn live so it shows the merchant's own name and number. */
export function PanCard({ name, pan }: { name: string; pan: string }) {
  return (
    <figure
      aria-label={`PAN card for ${name}, ${pan}`}
      className="anim-pop relative h-[168px] w-[276px] shrink-0 overflow-hidden rounded-xl"
      style={{
        background:
          "linear-gradient(200deg, #9fbdf0 0%, #b9c8f3 28%, #d9cbe9 58%, #ebc6d7 82%, #efcadc 100%)",
        color: "#21184f",
      }}
    >
      <span className="absolute top-4 left-4 text-[7.5px] leading-none font-semibold tracking-[0.02em]">INCOME TAX DEPT.</span>
      <span className="absolute top-4 right-[25px] text-[7.5px] leading-none font-semibold tracking-[0.02em]">GOVT. OF INDIA</span>
      <span className="absolute top-[10px] left-[123px] flex size-[20px] items-center justify-center rounded-full border-[1.5px] border-[#5b4f8f]">
        <span className="size-[7px] rounded-full bg-[#5b4f8f]" />
      </span>
      <span className="absolute top-[48px] left-4 max-w-[180px] truncate text-[11.5px] leading-[14px] font-bold">{name}</span>
      <span className="absolute top-[76px] left-4 h-[7px] w-[78px] rounded-full bg-[#a99fe0]" />
      <span className="absolute top-[90px] left-4 h-[7px] w-[50px] rounded-full bg-[#a99fe0]" />
      <span className="absolute top-[110px] left-4 text-[13.5px] leading-[16px] font-bold tracking-[0.01em]">{pan}</span>
      <svg className="absolute top-[134px] left-[14px]" width="40" height="22" viewBox="0 0 40 22" fill="none" aria-hidden="true">
        <path d="M5 21c-2-6 0-14 3-19 1.5 6 .5 12-1 16M8 9c3-1 5 1 8 0 2-.7 3-2 5-1 2 1 3 1 5-1" stroke="#3a2f78" strokeWidth="1.1" strokeLinecap="round" />
      </svg>
      <span
        className="absolute top-[45px] right-[11px] size-[45px] rounded-[8px]"
        style={{ background: "linear-gradient(135deg, #f1f0e6 0%, #b9b9bf 45%, #8f8f99 100%)" }}
      />
      <span className="absolute top-[101px] right-[11px] flex size-[45px] items-end justify-center overflow-hidden rounded-[8px] bg-[#21184f]">
        <span className="absolute top-[7px] size-[15px] rounded-full bg-[#a99fe0]" />
        <span className="h-[15px] w-[32px] rounded-t-[10px] bg-[#a99fe0]" />
      </span>
    </figure>
  );
}
