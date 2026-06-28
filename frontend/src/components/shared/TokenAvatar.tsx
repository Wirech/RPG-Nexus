import { cn, getUploadUrl } from '@/lib/utils';

interface TokenAvatarProps {
  src?: string | null;
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  onClick?: () => void;
  /** Position of image within container (default: center) */
  objectPosition?: 'center' | 'top';
}

// Generate a consistent color from a string
function stringToColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Generate HSL color with good saturation and lightness for dark theme
  const h = Math.abs(hash) % 360;
  const s = 60 + (Math.abs(hash >> 8) % 20); // 60-80%
  const l = 35 + (Math.abs(hash >> 16) % 15); // 35-50%
  
  return `hsl(${h}, ${s}%, ${l}%)`;
}

function getInitials(name: string): string {
  const words = name.trim().split(/\s+/);
  if (words.length === 1) {
    return words[0].substring(0, 2).toUpperCase();
  }
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

const sizeClasses = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-16 h-16 text-lg',
  xl: 'w-24 h-24 text-2xl',
};

export function TokenAvatar({
  src,
  name,
  size = 'md',
  className,
  onClick,
  objectPosition = 'center',
}: TokenAvatarProps) {
  const initials = getInitials(name);
  const bgColor = stringToColor(name);
  const imageUrl = getUploadUrl(src);

  if (imageUrl) {
    return (
      <div
        onClick={onClick}
        className={cn(
          'rounded-full overflow-hidden bg-surface flex-shrink-0',
          sizeClasses[size],
          onClick && 'cursor-pointer hover:ring-2 hover:ring-accent transition-all',
          className
        )}
      >
        <img
          src={imageUrl}
          alt={name}
          className={cn(
            'w-full h-full object-cover',
            objectPosition === 'top' && 'object-top'
          )}
          onError={(e) => {
            // Fallback to initials on error
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            target.parentElement!.style.backgroundColor = bgColor;
            target.parentElement!.innerHTML = `<span class="w-full h-full flex items-center justify-center font-semibold text-white">${initials}</span>`;
          }}
        />
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      style={{ backgroundColor: bgColor }}
      className={cn(
        'rounded-full flex items-center justify-center font-semibold text-white flex-shrink-0',
        sizeClasses[size],
        onClick && 'cursor-pointer hover:ring-2 hover:ring-accent transition-all',
        className
      )}
    >
      {initials}
    </div>
  );
}
