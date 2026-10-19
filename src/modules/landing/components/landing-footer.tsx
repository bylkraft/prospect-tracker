import { Link } from '@tanstack/react-router'

import { BrandMark } from '@/components/icons/brand-mark'
import { m } from '@/i18n/paraglide/messages'
import { CONFIG } from '@/lib/config'
import { OPPORTUNITIES_SEARCH_DEFAULTS } from '@/modules/opportunities/opportunities-schema'
import { APP_ROUTES } from '@/lib/routes'

const FOOTER_LINK = 'text-muted-foreground hover:text-foreground transition-colors'

export function LandingFooter() {
  return (
    <footer className="border-border-soft border-t">
      <div className="mx-auto max-w-[1160px] px-5 py-9 md:px-6 md:pb-11">
        <div className="flex flex-col justify-between gap-8 md:flex-row">
          <div className="max-w-80">
            <div className="flex items-center gap-2.5">
              <span className="bg-primary text-primary-foreground flex size-8 flex-none items-center justify-center rounded-lg">
                <BrandMark className="size-7.5" />
              </span>
              <span className="text-foreground font-heading tracking-title text-md font-semibold">
                {CONFIG.brand}
              </span>
            </div>
            <p className="text-muted-foreground mt-3 text-pretty">{m.landing_footerTagline()}</p>
          </div>

          <div className="flex gap-14">
            <FooterColumn title={m.landing_footerProduct()}>
              <Link
                to={APP_ROUTES.tracker}
                search={OPPORTUNITIES_SEARCH_DEFAULTS}
                className={FOOTER_LINK}
              >
                {m.landing_ctaPrimary()}
              </Link>
              <a href="#fonctionnalites" className={FOOTER_LINK}>
                {m.landing_navFeatures()}
              </a>
              <a href="#relances" className={FOOTER_LINK}>
                {m.landing_navReminders()}
              </a>
              <Link to={APP_ROUTES.login} search={{ mode: 'signin' }} className={FOOTER_LINK}>
                {m.landing_signIn()}
              </Link>
            </FooterColumn>

            <FooterColumn title={m.landing_footerLegal()}>
              {/* Legal pages are not written yet — DEV-31 (go live). */}
              <span className="text-muted-foreground">
                {m.landing_footerLegalNotice()} [À COMPLÉTER]
              </span>
              <span className="text-muted-foreground">
                {m.landing_footerPrivacy()} [À COMPLÉTER]
              </span>
            </FooterColumn>
          </div>
        </div>

        <div className="border-border-soft text-muted-foreground mt-9 flex flex-col justify-between gap-2 border-t pt-6 text-xs md:flex-row">
          <span>{m.landing_footerCopyright()} · [À COMPLÉTER : entité et adresse]</span>
          <span>{m.landing_footerMadeFor()}</span>
        </div>
      </div>
    </footer>
  )
}

function FooterColumn({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-foreground font-semibold">{title}</p>
      <div className="mt-3 flex flex-col gap-2">{children}</div>
    </div>
  )
}
