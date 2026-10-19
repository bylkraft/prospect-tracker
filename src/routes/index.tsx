import { createFileRoute } from '@tanstack/react-router'

import { LandingBeforeAfter } from '@/modules/landing/components/landing-before-after'
import { LandingDemo } from '@/modules/landing/components/landing-demo'
import { LandingFooter } from '@/modules/landing/components/landing-footer'
import { LandingHeader } from '@/modules/landing/components/landing-header'
import { LandingHero } from '@/modules/landing/components/landing-hero'
import { LandingReminders } from '@/modules/landing/components/landing-reminders'
import {
  LandingColumns,
  LandingCustomize,
  LandingFaq,
  LandingFinalCta,
  LandingKpis,
  LandingNotion,
  LandingPricing,
  LandingSteps,
  LandingTrio
} from '@/modules/landing/components/landing-sections'
import { m } from '@/i18n/paraglide/messages'
import { CONFIG } from '@/lib/config'

export const Route = createFileRoute('/')({
  head: () => {
    const title = `${CONFIG.brand} · ${m.common_tagline()}`
    const description = m.landing_heroSubtitle()

    return {
      meta: [
        { title },
        { name: 'description', content: description },
        { property: 'og:title', content: title },
        { property: 'og:description', content: description },
        { property: 'og:type', content: 'website' },
        { name: 'twitter:card', content: 'summary_large_image' }
      ]
    }
  },
  component: LandingPage
})

function LandingPage() {
  return (
    <main className="bg-background min-h-screen">
      <LandingHeader />
      <LandingHero />
      <LandingDemo />
      <LandingBeforeAfter />
      <LandingKpis />
      <LandingColumns />
      <LandingCustomize />
      <LandingReminders />
      <LandingNotion />
      <LandingTrio />
      <LandingPricing />
      <LandingFaq />
      <LandingSteps />
      <LandingFinalCta />
      <LandingFooter />
    </main>
  )
}
