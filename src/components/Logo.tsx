type LogoProps = {
  className?: string
  size?: number
}

export function Logo({ className = '', size = 40 }: LogoProps) {
  return (
    <img
      src="/brand/logo-academy.png"
      alt="Leuven Bears"
      width={size}
      height={size}
      className={`object-contain ${className}`}
    />
  )
}
