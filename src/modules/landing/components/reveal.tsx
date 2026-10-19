import { motion, useReducedMotion } from 'motion/react'

type Props = {
  children: React.ReactNode
  delay?: number
  className?: string
}

// Scroll-in reveal shared by every landing section — see docs/reference/landing-page.md
export function Reveal({ children, delay = 0, className }: Props) {
  const prefersReducedMotion = useReducedMotion()

  if (prefersReducedMotion) return <div className={className}>{children}</div>

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25, margin: '0px 0px -80px 0px' }}
      transition={{ duration: 0.55, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  )
}
