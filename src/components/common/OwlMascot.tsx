import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

interface OwlMascotProps {
  size?: 'sm' | 'md' | 'lg';
  animate?: boolean;
  expression?: 'happy' | 'thinking' | 'excited';
}

const sizes = { sm: 'text-4xl', md: 'text-6xl', lg: 'text-8xl' };

export default function OwlMascot({ size = 'md', animate = true, expression = 'happy' }: OwlMascotProps) {
  const owlRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!animate || !owlRef.current) return;
    const ctx = gsap.context(() => {
      gsap.to(owlRef.current, {
        y: -8,
        duration: 1.5,
        ease: 'power1.inOut',
        yoyo: true,
        repeat: -1,
      });
    });
    return () => ctx.revert();
  }, [animate]);

  const emojis = { happy: '🦉', thinking: '🤔', excited: '🥳' };

  return (
    <div ref={owlRef} className={`${sizes[size]} select-none`} role="img" aria-label="Yellow Owl mascot">
      {expression === 'happy' ? '🦉' : emojis[expression]}
    </div>
  );
}
