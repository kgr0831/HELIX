import { useEffect, useRef } from "react";

export function useReveal<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const children = el.querySelectorAll<HTMLElement>("[data-reveal]");
    const targets = children.length > 0 ? Array.from(children) : [el];

    const ob = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const target = entry.target as HTMLElement;
            const delay = target.dataset.revealDelay ?? "0";
            target.style.transitionDelay = `${delay}ms`;
            target.classList.add("revealed");
            ob.unobserve(target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" },
    );

    targets.forEach((t) => ob.observe(t));
    return () => ob.disconnect();
  }, []);

  return ref;
}
