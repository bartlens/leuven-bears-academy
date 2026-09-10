import { useState } from 'react'
import { SectionHeader } from '../components/SectionHeader'
import { faqs } from '../data/faqs'

export function Faq() {
  const [openId, setOpenId] = useState<string | null>(faqs[0]?.id ?? null)

  return (
    <div className="mx-auto max-w-3xl overflow-x-hidden px-4 py-12 sm:px-6">
      <SectionHeader
        eyebrow="Hulp"
        title="Veelgestelde vragen"
        subtitle="Praktische info over trainingen, aansluiting, tickets en rolstoelbasket — zonder verzonnen tarieven of telefoonnummers."
      />
      <div className="space-y-3">
        {faqs.map((faq) => {
          const open = openId === faq.id
          return (
            <div
              key={faq.id}
              className="overflow-hidden rounded-3xl border border-white/10 bg-panel/80"
            >
              <button
                type="button"
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left touch-manipulation sm:px-6"
                aria-expanded={open}
                onClick={() => setOpenId(open ? null : faq.id)}
              >
                <span className="font-display text-base font-bold text-cream sm:text-lg">
                  {faq.question}
                </span>
                <span
                  className="shrink-0 text-hoop-bright text-xl font-bold"
                  aria-hidden
                >
                  {open ? '−' : '+'}
                </span>
              </button>
              {open && (
                <div className="border-t border-white/8 px-5 pb-5 pt-3 sm:px-6">
                  <p className="text-sm leading-relaxed text-muted whitespace-pre-wrap">
                    {faq.answer}
                  </p>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
