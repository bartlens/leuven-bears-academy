type LogoProps = {
  className?: string
  /** Height in pixels. Width follows the shield aspect ratio. */
  size?: number
}

const SHIELD_W = 692
const SHIELD_H = 800

export function Logo({ className = '', size = 48 }: LogoProps) {
  const width = Math.round((size * SHIELD_W) / SHIELD_H)

  return (
    <picture>
      <source srcSet="/brand/academy-logo-shield.webp" type="image/webp" />
      <img
        src="/brand/academy-logo-shield.png"
        alt="Leuven Bears Academy"
        width={width}
        height={size}
        className={`object-contain ${className}`}
        style={{ height: size, width: 'auto' }}
        draggable={false}
      />
    </picture>
  )
}
