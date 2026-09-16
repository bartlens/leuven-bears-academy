type LogoProps = {
  className?: string
  /** Height in pixels. Width follows the lockup aspect ratio. */
  size?: number
}

export function Logo({ className = '', size = 48 }: LogoProps) {
  return (
    <img
      src="/brand/logo-academy.svg"
      alt="Leuven Bears Academy"
      height={size}
      className={`object-contain ${className}`}
      style={{ height: size, width: 'auto' }}
      draggable={false}
    />
  )
}
