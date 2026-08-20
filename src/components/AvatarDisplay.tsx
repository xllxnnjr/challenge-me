interface AvatarDisplayProps {
  avatar: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function AvatarDisplay({
  avatar,
  className = '',
  size = 'md',
}: AvatarDisplayProps) {
  const isCustomImage = avatar?.startsWith('data:') || avatar?.startsWith('http') || avatar?.startsWith('blob:');

  const sizeClasses = {
    sm: 'w-7 h-7 text-sm rounded-lg',
    md: 'w-8 h-8 text-base rounded-xl',
    lg: 'w-12 h-12 text-2xl rounded-2xl',
    xl: 'w-16 h-16 text-3xl rounded-2xl',
  };

  return (
    <div
      className={`relative overflow-hidden flex items-center justify-center flex-shrink-0 bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 border border-white/20 shadow-md ${sizeClasses[size]} ${className}`}
    >
      {isCustomImage ? (
        <img
          src={avatar}
          alt="Profile Avatar"
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
      ) : (
        <span className="select-none flex items-center justify-center">
          {avatar || '🧑🏾‍🚀'}
        </span>
      )}
    </div>
  );
}
