import type { Opportunity, Stage } from '@/db/schema'
import type { LinkedContact } from '@/modules/contacts/contacts-types'
import type { OpportunityRow } from '@/modules/opportunities/utils/rows'

// The public demo runs the real table on fabricated rows — same shape as the dashboard,
// so the landing page and the app can never drift. See docs/reference/landing-page.md

const DEMO_USER_ID = '00000000-0000-4000-8000-000000000000'

function stageId(position: number) {
  return `00000000-0000-4000-8000-00000000000${position}`
}

function makeStage(
  position: number,
  name: string,
  color: Stage['color'],
  reminderDelayDays: number,
  isArchived = false
): Stage {
  return {
    id: stageId(position),
    userId: DEMO_USER_ID,
    name,
    color,
    position,
    systemKey: null,
    reminderDelayDays,
    isArchived,
    createdAt: new Date('2026-01-01T00:00:00Z')
  }
}

export const DEMO_STAGES: readonly Stage[] = [
  makeStage(0, 'Sauvegardé', 'slate', 14),
  makeStage(1, 'Contacté', 'blue', 5),
  makeStage(2, 'CV Envoyé', 'amber', 3),
  makeStage(3, 'Entretien', 'violet', 2),
  makeStage(4, 'Offre', 'green', 15),
  makeStage(5, 'Refusé', 'red', 7, true),
  makeStage(6, 'Ghosté', 'slate', 7, true)
]

export const DEMO_DAILY_RATE_REFERENCE = 450

type RowSeed = {
  recruiter: string
  esn: string | null
  endClient: string
  dailyRate: number
  location: string
  stagePosition: number
  lastContactAt: string
  /** Past its stage delay — the date is called out in red, and it feeds the "due" KPI. */
  isDue?: boolean
  isPinned?: boolean
  isArchived?: boolean
  need?: string
  onsiteDays?: number
}

const SEEDS: readonly RowSeed[] = [
  {
    recruiter: 'Antoine Gérard',
    esn: 'Zenika',
    endClient: 'La Poste',
    dailyRate: 505,
    location: 'Nantes',
    stagePosition: 0,
    lastContactAt: '2026-08-19',
    need: 'Refonte du portail agents, React et Node'
  },
  {
    recruiter: 'Léa Marchand',
    esn: 'Sopra Steria',
    endClient: 'BlaBlaCar',
    dailyRate: 600,
    location: 'Paris 9e',
    stagePosition: 3,
    lastContactAt: '2026-08-18',
    onsiteDays: 2,
    need: 'Squad paiement, TypeScript'
  },
  {
    recruiter: 'Camille Ferrand',
    esn: 'Devoteam',
    endClient: 'Société Générale',
    dailyRate: 620,
    location: 'Paris 13e',
    stagePosition: 3,
    lastContactAt: '2026-08-17',
    onsiteDays: 3
  },
  {
    recruiter: 'Thomas Vasseur',
    esn: 'Capgemini',
    endClient: 'EDF',
    dailyRate: 580,
    location: 'Saint-Denis',
    stagePosition: 1,
    lastContactAt: '2026-08-14',
    isDue: true
  },
  {
    recruiter: 'Hugo Lambert',
    esn: 'Alten',
    endClient: 'Décathlon',
    dailyRate: 470,
    location: 'Lille',
    stagePosition: 2,
    lastContactAt: '2026-08-12',
    isDue: true
  },
  {
    recruiter: 'Yanis Bouche',
    esn: 'Inetum',
    endClient: 'Doctolib',
    dailyRate: 700,
    location: 'Levallois-Perret',
    stagePosition: 4,
    lastContactAt: '2026-08-08',
    isPinned: true,
    need: 'Plateforme praticiens, forte volumétrie'
  },
  {
    recruiter: 'Sarah Nguyen',
    esn: 'Wavestone',
    endClient: 'Orange',
    dailyRate: 540,
    location: 'Nantes',
    stagePosition: 1,
    lastContactAt: '2026-08-05',
    isDue: true
  },
  {
    recruiter: 'Marc Aubry',
    esn: null,
    endClient: 'Leroy Merlin',
    dailyRate: 460,
    location: 'Remote',
    stagePosition: 2,
    lastContactAt: '2026-08-02',
    isDue: true
  },
  {
    recruiter: 'Inès Fontaine',
    esn: 'Akka',
    endClient: 'Airbus',
    dailyRate: 640,
    location: 'Toulouse',
    stagePosition: 1,
    lastContactAt: '2026-07-30',
    isDue: true
  },
  {
    recruiter: 'Nicolas Perrin',
    esn: 'Atos',
    endClient: 'Carrefour',
    dailyRate: 430,
    location: 'Massy',
    stagePosition: 2,
    lastContactAt: '2026-07-28',
    isDue: true
  },
  {
    recruiter: 'Chloé Bertrand',
    esn: null,
    endClient: 'Back Market',
    dailyRate: 610,
    location: 'Remote',
    stagePosition: 3,
    lastContactAt: '2026-07-27'
  },
  {
    recruiter: 'Julien Moreau',
    esn: 'Onepoint',
    endClient: 'RATP',
    dailyRate: 520,
    location: 'Paris 12e',
    stagePosition: 0,
    lastContactAt: '2026-07-24'
  },
  {
    recruiter: 'Emma Rousseau',
    esn: 'Sopra Steria',
    endClient: 'Engie',
    dailyRate: 495,
    location: 'Courbevoie',
    stagePosition: 1,
    lastContactAt: '2026-07-21',
    isDue: true
  },
  {
    recruiter: 'Adrien Colin',
    esn: 'Talan',
    endClient: 'AXA',
    dailyRate: 560,
    location: 'Paris 8e',
    stagePosition: 2,
    lastContactAt: '2026-07-18',
    isDue: true
  },
  {
    recruiter: 'Manon Girard',
    esn: null,
    endClient: 'Qonto',
    dailyRate: 660,
    location: 'Remote',
    stagePosition: 3,
    lastContactAt: '2026-07-16'
  },
  {
    recruiter: 'Paul Renaud',
    esn: 'Accenture',
    endClient: 'L’Oréal',
    dailyRate: 590,
    location: 'Clichy',
    stagePosition: 0,
    lastContactAt: '2026-07-15'
  },
  {
    recruiter: 'Sofia Lemoine',
    esn: 'Devoteam',
    endClient: 'Veolia',
    dailyRate: 440,
    location: 'Aubervilliers',
    stagePosition: 1,
    lastContactAt: '2026-07-11',
    isDue: true
  },
  {
    recruiter: 'Théo Barbier',
    esn: 'Alten',
    endClient: 'Thales',
    dailyRate: 575,
    location: 'Vélizy',
    stagePosition: 2,
    lastContactAt: '2026-07-09',
    isDue: true
  },
  {
    recruiter: 'Alice Faure',
    esn: null,
    endClient: 'Alan',
    dailyRate: 630,
    location: 'Remote',
    stagePosition: 1,
    lastContactAt: '2026-07-07',
    isDue: true
  },
  {
    recruiter: 'Lucas Mercier',
    esn: 'Capgemini',
    endClient: 'SNCF',
    dailyRate: 510,
    location: 'Saint-Denis',
    stagePosition: 0,
    lastContactAt: '2026-07-03'
  },
  {
    recruiter: 'Nora Benali',
    esn: 'Inetum',
    endClient: 'Bouygues',
    dailyRate: 480,
    location: 'Guyancourt',
    stagePosition: 2,
    lastContactAt: '2026-06-30',
    isDue: true
  },
  {
    recruiter: 'Victor Leroy',
    esn: 'Wavestone',
    endClient: 'BNP Paribas',
    dailyRate: 620,
    location: 'Paris 2e',
    stagePosition: 1,
    lastContactAt: '2026-06-26',
    isDue: true
  },
  {
    recruiter: 'Élodie Marchal',
    esn: 'Atos',
    endClient: 'Michelin',
    dailyRate: 455,
    location: 'Clermont-Ferrand',
    stagePosition: 5,
    lastContactAt: '2026-06-20',
    isArchived: true
  },
  {
    recruiter: 'Gabriel Roy',
    esn: null,
    endClient: 'Swile',
    dailyRate: 545,
    location: 'Montpellier',
    stagePosition: 6,
    lastContactAt: '2026-06-14',
    isArchived: true
  },
  {
    recruiter: 'Camille Dupuis',
    esn: 'Onepoint',
    endClient: 'Decathlon',
    dailyRate: 500,
    location: 'Lille',
    stagePosition: 5,
    lastContactAt: '2026-06-09',
    isArchived: true
  },
  {
    recruiter: 'Rémi Charpentier',
    esn: 'Talan',
    endClient: 'Generali',
    dailyRate: 470,
    location: 'Paris 9e',
    stagePosition: 6,
    lastContactAt: '2026-06-02',
    isArchived: true
  }
]

const STAGE_BY_POSITION = new Map(DEMO_STAGES.map((stage) => [stage.position, stage]))

function toRow(seed: RowSeed, index: number): OpportunityRow {
  const stage = STAGE_BY_POSITION.get(seed.stagePosition)
  const opportunity: Opportunity = {
    id: `00000000-0000-4000-9000-${String(index).padStart(12, '0')}`,
    userId: DEMO_USER_ID,
    stageId: stageId(seed.stagePosition),
    jobTypeId: null,
    experienceId: null,
    esn: seed.esn,
    endClient: seed.endClient,
    need: seed.need ?? null,
    dailyRate: seed.dailyRate,
    onsiteDays: seed.onsiteDays ?? null,
    location: seed.location,
    lastContactAt: seed.lastContactAt,
    nextReminderAt: null,
    offerUrl: null,
    notes: null,
    isPinned: seed.isPinned ?? false,
    isArchived: seed.isArchived ?? false,
    createdAt: new Date(seed.lastContactAt),
    updatedAt: new Date(seed.lastContactAt)
  }

  const [firstName = null, ...rest] = seed.recruiter.split(' ')
  const contact: LinkedContact = {
    id: `00000000-0000-4000-a000-${String(index).padStart(12, '0')}`,
    firstName,
    lastName: rest.join(' ') || null,
    company: seed.esn,
    jobTitle: null,
    relationship: 'esn_manager',
    phone: null
  }

  return {
    ...opportunity,
    contacts: [contact],
    isDue: (seed.isDue ?? false) && !opportunity.isArchived,
    isArchivedRow: opportunity.isArchived,
    stage
  }
}

export const DEMO_OPPORTUNITY_ROWS: readonly OpportunityRow[] = SEEDS.map(toRow)
