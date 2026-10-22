import Image from 'next/image';

/**
 * Split-screen frame for sign-in and sign-up: the LiveDocs mark on an animated
 * circuit backdrop (styles/circuit-background.css) next to the form.
 */
export default function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen w-full flex-col lg:flex-row">
      <div className="circuit-background relative h-[40dvh] w-full overflow-hidden md:h-[50dvh] lg:h-[100dvh] lg:w-1/2" aria-hidden>
        {[1, 2, 3, 4, 5].map((n) => (
          <div key={`node-${n}`} className={`circuit-node circuit-node-${n}`} />
        ))}
        {[1, 2, 3].map((n) => (
          <div key={`line-${n}`} className={`circuit-line circuit-line-${n}`} />
        ))}
        {[1, 2].map((n) => (
          <div key={`vline-${n}`} className={`circuit-line-vertical circuit-line-v${n}`} />
        ))}
        {/* Slow pulses radiating from the logo */}
        <div className="absolute inset-0 flex items-center justify-center">
          {[160, 260, 360, 460].map((size, i) => (
            <span
              key={size}
              className="absolute animate-ping rounded-full border border-blue-400/20"
              style={{ width: size, height: size, animationDuration: `${3 + i}s` }}
            />
          ))}
        </div>
        <div className="absolute inset-0 z-30 flex items-center justify-center gap-3 md:gap-4 lg:gap-6">
          <Image
            src="/assets/icons/livedocs-icon.svg"
            alt=""
            width={64}
            height={64}
            className="size-10 drop-shadow-[0_0_15px_rgba(0,150,255,0.5)] md:size-12 lg:size-16"
          />
          <p className="text-4xl font-bold text-white drop-shadow-[0_0_15px_rgba(0,150,255,0.5)] md:text-5xl lg:text-7xl">
            LiveDocs
          </p>
        </div>
      </div>
      <div className="flex w-full flex-col justify-center bg-[#0a1528] px-6 py-8 lg:w-1/2 lg:py-0">
        <div className="mx-auto w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
