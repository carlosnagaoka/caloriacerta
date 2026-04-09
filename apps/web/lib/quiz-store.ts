import { create } from 'zustand'

export type Profile = 'scanner' | 'diario' | 'reflex' | 'misto'

interface QuizState {
  step: number
  answers: Record<number, string>
  profile: Profile | null
  setAnswer: (q: number, answer: string) => void
  setStep: (step: number) => void
  setProfile: (profile: Profile) => void
  reset: () => void
}

const SESSION_KEY = 'cc_quiz_profile'

function calculateProfile(answers: Record<number, string>): Profile {
  const scores: Record<Profile, number> = { scanner: 0, diario: 0, reflex: 0, misto: 0 }

  const q1Map: Record<string, Profile> = {
    esqueço: 'scanner', ansioso: 'reflex', naosei: 'diario', semresult: 'misto',
  }
  const q2Map: Record<string, Profile> = {
    raramente: 'diario', dois_tres: 'misto', todo_dia: 'scanner', varia: 'misto',
  }
  const q3Map: Record<string, Profile> = {
    trabalhoso: 'scanner', culpa: 'reflex', semprogresso: 'diario', realidade: 'misto',
  }

  if (answers[0]) scores[q1Map[answers[0]] ?? 'misto']++
  if (answers[1]) scores[q2Map[answers[1]] ?? 'misto']++
  if (answers[2]) scores[q3Map[answers[2]] ?? 'misto']++

  const top = (Object.entries(scores) as [Profile, number][])
    .sort((a, b) => b[1] - a[1])[0]

  return top[0]
}

export const useQuizStore = create<QuizState>((set, get) => ({
  step: 0,
  answers: {},
  profile: null,

  setAnswer: (q, answer) => {
    const answers = { ...get().answers, [q]: answer }
    set({ answers })
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify({ answers, profile: get().profile }))
    }
  },

  setStep: (step) => set({ step }),

  setProfile: (profile) => {
    set({ profile })
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify({ answers: get().answers, profile }))
    }
  },

  reset: () => set({ step: 0, answers: {}, profile: null }),
}))

export { calculateProfile }
