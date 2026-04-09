export const spring = {
  default: { type: 'spring', stiffness: 280, damping: 24, mass: 0.8 },
  snappy:  { type: 'spring', stiffness: 400, damping: 28, mass: 0.6 },
  gentle:  { type: 'spring', stiffness: 160, damping: 20, mass: 1.0 },
} as const

export const fadeUp = {
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
}
