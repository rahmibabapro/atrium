"use client";

import { useRef } from "react";
import { ensureGsap, gsap, useGSAP, ScrollTrigger } from "@/components/motion/register";

/** Batched scroll reveals for any custom page — transform/opacity only. */
export function PageReveal({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const root = useRef<HTMLDivElement>(null);
  ensureGsap();

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: reduce)", () => {
        gsap.set("[data-reveal]", { clearProps: "all", opacity: 1, y: 0 });
      });
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.set("[data-reveal]", { opacity: 0, y: 28 });
        ScrollTrigger.batch("[data-reveal]", {
          start: "top 90%",
          once: true,
          onEnter: (batch) => {
            gsap.to(batch, {
              opacity: 1,
              y: 0,
              duration: 0.65,
              stagger: 0.07,
              ease: "power3.out",
              overwrite: "auto",
            });
          },
        });
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <div ref={root} className={className}>
      {children}
    </div>
  );
}
