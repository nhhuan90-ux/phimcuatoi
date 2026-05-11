import { ReactNode, useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface TVFocusableProps {
  children: ReactNode;
  className?: string;
  focusClassName?: string;
  onPress?: () => void;
  link?: string;
  autoFocus?: boolean;
  focusKey?: string;
  style?: React.CSSProperties;
}

export default function TVFocusable({
  children,
  className = '',
  focusClassName = '',
  onPress,
  link,
  autoFocus = false,
  focusKey,
  style,
}: TVFocusableProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (autoFocus && ref.current) {
      setTimeout(() => ref.current?.focus(), 100);
    }
  }, [autoFocus]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (link) {
        navigate(link);
      } else if (onPress) {
        onPress();
      }
    }
  };

  const handleClick = () => {
    if (link) {
      navigate(link);
    } else if (onPress) {
      onPress();
    }
  };

  return (
    <div
      ref={ref}
      data-focusable="true"
      data-focus-key={focusKey}
      tabIndex={0}
      className={`tv-focusable outline-none transition-all duration-200 ${className} ${isFocused ? `tv-focused ${focusClassName}` : ''}`}
      style={style}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      onKeyDown={handleKeyDown}
      onClick={handleClick}
    >
      {children}
    </div>
  );
}
