type SectionHeaderProps = {
  eyebrow: string
  title: string
  subtitle?: string
}

export function SectionHeader({ eyebrow, title, subtitle }: SectionHeaderProps) {
  return (
    <div className="mb-8 max-w-2xl animate-in">
      <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-hoop-bright">
        {eyebrow}
      </p>
      <h1 className="font-display text-3xl font-bold tracking-tight text-cream sm:text-4xl">
        {title}
      </h1>
      {subtitle && (
        <p className="mt-3 text-base leading-relaxed text-muted">{subtitle}</p>
      )}
    </div>
  )
}
