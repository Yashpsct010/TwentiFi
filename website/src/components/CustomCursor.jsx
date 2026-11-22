import { useEffect, useState, useRef } from 'react';

export default function CustomCursor() {
  const [mounted, setMounted] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  // Position references for 60fps RAF loop
  const mouseRef = useRef({ x: -100, y: -100 });
  const dotRef = useRef(null);
  const ringRef = useRef(null);
  const ringPosRef = useRef({ x: -100, y: -100 });
  const rafIdRef = useRef(null);

  useEffect(() => {
    // Detect touch / coarse devices
    if (
      typeof window !== 'undefined' &&
      (window.matchMedia('(pointer: coarse)').matches ||
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0)
    ) {
      setIsTouchDevice(true);
      return;
    }

    setMounted(true);

    const onMouseMove = (e) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
      if (!isVisible) setIsVisible(true);

      // Check if target is clickable
      const target = e.target;
      if (target) {
        const isInteractive = target.closest('a, button, [role="button"], input, select, textarea, .cursor-pointer');
        setIsHovered(Boolean(isInteractive));
      }
    };

    const onMouseLeave = () => {
      setIsVisible(false);
    };

    const onMouseEnter = () => {
      setIsVisible(true);
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    document.addEventListener('mouseleave', onMouseLeave);
    document.addEventListener('mouseenter', onMouseEnter);

    // Smooth RAF loop for the trailing ring (lerp smoothing)
    const lerp = (start, end, factor) => start + (end - start) * factor;

    const render = () => {
      const { x: targetX, y: targetY } = mouseRef.current;

      // Position the inner precision dot instantly (zero latency)
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${targetX}px, ${targetY}px, 0)`;
      }

      // Smooth trailing ring (lerp factor 0.18 for buttery response)
      ringPosRef.current.x = lerp(ringPosRef.current.x, targetX, 0.18);
      ringPosRef.current.y = lerp(ringPosRef.current.y, targetY, 0.18);

      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${ringPosRef.current.x}px, ${ringPosRef.current.y}px, 0)`;
      }

      rafIdRef.current = requestAnimationFrame(render);
    };

    rafIdRef.current = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseleave', onMouseLeave);
      document.removeEventListener('mouseenter', onMouseEnter);
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    };
  }, [isVisible]);

  if (isTouchDevice || !mounted) return null;

  return (
    <div
      className={`fixed inset-0 pointer-events-none z-[9999] transition-opacity duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {/* Precision Pinpoint Dot */}
      <div
        ref={dotRef}
        className="fixed top-0 left-0 -ml-[3px] -mt-[3px] pointer-events-none"
        style={{ willChange: 'transform' }}
      >
        <div
          className={`w-1.5 h-1.5 rounded-full transition-transform duration-150 ${
            isHovered ? 'scale-0 bg-[#d4c3b3]' : 'scale-100 bg-[#d4c3b3]'
          }`}
        />
      </div>

      {/* Trailing Architectural Ring */}
      <div
        ref={ringRef}
        className="fixed top-0 left-0 pointer-events-none"
        style={{ willChange: 'transform' }}
      >
        <div
          className={`-translate-x-1/2 -translate-y-1/2 rounded-full transition-all duration-200 ease-out flex items-center justify-center ${
            isHovered
              ? 'w-12 h-12 border border-[#d4c3b3] bg-[#d4c3b3]/15 backdrop-blur-[1px]'
              : 'w-8 h-8 border border-[#d4c3b3]/45 bg-transparent'
          }`}
        >
          {/* Subtle crosshair tick in hover mode */}
          {isHovered && (
            <div className="w-1.5 h-1.5 rounded-full bg-[#d4c3b3] animate-ping opacity-75" />
          )}
        </div>
      </div>
    </div>
  );
}