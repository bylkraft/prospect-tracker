import type { StageColorToken } from '@/db/schema'

// Illustrative pipeline shown on the public page — not real user data.
// Names and companies are fictional; stage colors mirror src/db/defaults.ts.

export type DemoRow = {
  date: string
  age: string | null
  recruiter: string
  /** Null when the freelancer works with the end client directly. */
  esn: string | null
  client: string
  dailyRate: number
  aboveReference: boolean
  stage: string
  stageColor: StageColorToken
  location: string
  /** Past its follow-up delay — the date is called out in red. */
  late: boolean
}

export const DEMO_ROWS: readonly DemoRow[] = [
  {
    date: '19/08/2026',
    age: null,
    recruiter: 'Antoine Gérard',
    esn: 'Zenika',
    client: 'La Poste',
    dailyRate: 505,
    aboveReference: true,
    stage: 'Sauvegardé',
    stageColor: 'slate',
    location: 'Nantes',
    late: false
  },
  {
    date: '18/08/2026',
    age: null,
    recruiter: 'Léa Marchand',
    esn: 'Sopra Steria',
    client: 'BlaBlaCar',
    dailyRate: 600,
    aboveReference: true,
    stage: 'Entretien',
    stageColor: 'violet',
    location: 'Paris 9e',
    late: false
  },
  {
    date: '17/08/2026',
    age: null,
    recruiter: 'Camille Ferrand',
    esn: 'Devoteam',
    client: 'Société Générale',
    dailyRate: 620,
    aboveReference: true,
    stage: 'Entretien',
    stageColor: 'violet',
    location: 'Paris 13e',
    late: false
  },
  {
    date: '14/08/2026',
    age: null,
    recruiter: 'Thomas Vasseur',
    esn: 'Capgemini',
    client: 'EDF',
    dailyRate: 580,
    aboveReference: true,
    stage: 'Contacté',
    stageColor: 'blue',
    location: 'Saint-Denis',
    late: false
  },
  {
    date: '12/08/2026',
    age: null,
    recruiter: 'Hugo Lambert',
    esn: 'Alten',
    client: 'Décathlon',
    dailyRate: 470,
    aboveReference: true,
    stage: 'CV Envoyé',
    stageColor: 'amber',
    location: 'Lille',
    late: false
  },
  {
    date: '08/08/2026',
    age: null,
    recruiter: 'Yanis Bouche',
    esn: 'Inetum',
    client: 'Doctolib',
    dailyRate: 700,
    aboveReference: true,
    stage: 'Offre',
    stageColor: 'green',
    location: 'Levallois-Perret',
    late: true
  },
  {
    date: '05/08/2026',
    age: null,
    recruiter: 'Sarah Nguyen',
    esn: 'Wavestone',
    client: 'Orange',
    dailyRate: 540,
    aboveReference: true,
    stage: 'Contacté',
    stageColor: 'blue',
    location: 'Nantes',
    late: false
  },
  {
    date: '02/08/2026',
    age: null,
    recruiter: 'Marc Aubry',
    esn: null,
    client: 'Leroy Merlin',
    dailyRate: 460,
    aboveReference: true,
    stage: 'CV Envoyé',
    stageColor: 'amber',
    location: 'Remote',
    late: false
  }
]

export const DEMO_STAGES: readonly { name: string; color: StageColorToken; delayDays: number }[] = [
  { name: 'Sauvegardé', color: 'slate', delayDays: 14 },
  { name: 'Contacté', color: 'blue', delayDays: 5 },
  { name: 'CV Envoyé', color: 'amber', delayDays: 3 },
  { name: 'Entretien', color: 'violet', delayDays: 2 },
  { name: 'Offre', color: 'green', delayDays: 15 }
]

// The sidebar lists archived stages too, so it carries its own full pipeline.
export const DEMO_PIPELINE: readonly { name: string; color: StageColorToken; count: number }[] = [
  { name: 'Sauvegardé', color: 'slate', count: 4 },
  { name: 'Contacté', color: 'blue', count: 7 },
  { name: 'CV Envoyé', color: 'amber', count: 6 },
  { name: 'Entretien', color: 'violet', count: 5 },
  { name: 'Offre', color: 'green', count: 1 },
  { name: 'Refusé', color: 'red', count: 2 },
  { name: 'Ghosté', color: 'slate', count: 2 }
]

export const DEMO_STAGE_COUNTS: Readonly<Record<string, number>> = {
  Sauvegardé: 4,
  Contacté: 7,
  'CV Envoyé': 6,
  Entretien: 5,
  Offre: 1
}

export const DEMO_TJM_REFERENCE = 450

export const DEMO_KPIS = { dueToday: 13, stale: 9, interviews: 5, responseRate: 41 } as const

export const DEMO_TOTAL_COUNT = 22

export const DEMO_SOURCES: readonly string[] = [
  'Malt',
  'Freework',
  'Collective',
  'LinkedIn',
  'ESN',
  'Contact direct'
]

export type DemoFollowUp = {
  recruiter: string
  stage: string
  stageColor: StageColorToken
  context: string
  overdueDays: number
}

export const DEMO_FOLLOW_UPS: readonly DemoFollowUp[] = [
  {
    recruiter: 'Marc Aubry',
    stage: 'CV Envoyé',
    stageColor: 'amber',
    context: 'Direct · Leroy Merlin',
    overdueDays: 17
  },
  {
    recruiter: 'Sarah Nguyen',
    stage: 'Contacté',
    stageColor: 'blue',
    context: 'Wavestone · Orange',
    overdueDays: 14
  },
  {
    recruiter: 'Yanis Bouche',
    stage: 'Offre',
    stageColor: 'green',
    context: 'Inetum · Doctolib',
    overdueDays: 11
  },
  {
    recruiter: 'Hugo Lambert',
    stage: 'CV Envoyé',
    stageColor: 'amber',
    context: 'Alten · Decathlon',
    overdueDays: 7
  },
  {
    recruiter: 'Thomas Vasseur',
    stage: 'Contacté',
    stageColor: 'blue',
    context: 'Capgemini · EDF',
    overdueDays: 5
  }
]

export const DEMO_FOLLOW_UP_TOTAL = 13

export const DEMO_JOB_TYPES: readonly { label: string; count: number }[] = [
  { label: 'FullStack', count: 12 },
  { label: 'Front End', count: 6 },
  { label: 'DevOps', count: 1 }
]

export const DEMO_SENIORITY: readonly { label: string; count: number }[] = [
  { label: 'Junior', count: 2 },
  { label: 'Confirmé', count: 5 },
  { label: 'Senior', count: 14 }
]

// The last onboarding step previews the morning email with two rows.
export const DEMO_STEP_FOLLOW_UPS: readonly DemoFollowUp[] = [
  DEMO_FOLLOW_UPS[2]!,
  DEMO_FOLLOW_UPS[1]!
]

// The ten stage colours offered in Personnaliser, in the canvas order.
export const DEMO_STAGE_PALETTE: readonly StageColorToken[] = [
  'slate',
  'blue',
  'teal',
  'green',
  'amber',
  'orange',
  'red',
  'rose',
  'violet',
  'pink'
]
