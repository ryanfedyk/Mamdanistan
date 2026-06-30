/**
 * "HOT MIC" — the interview game.
 * A hostile press gauntlet. Each question is a chance to stay on message
 * (pivot to local material wins) or take the bait (national noise). Content
 * lives here; the playable component is InterviewGame.tsx.
 */

export type AnswerType = "message" | "trap" | "dodge";

export interface InterviewOption {
  text: string;
  type: AnswerType;
  /** Aide's whisper / faux-headline shown after you pick. */
  reaction: string;
}

export interface InterviewQuestion {
  id: string;
  topic: string;
  /** The reporter's question. */
  prompt: string;
  options: InterviewOption[];
}

/** Meter deltas per answer type. Momentum: keep high. Noise: keep low. */
export const DELTAS: Record<AnswerType, { momentum: number; noise: number }> = {
  message: { momentum: 12, noise: -12 },
  dodge: { momentum: -4, noise: 6 },
  trap: { momentum: -15, noise: 22 },
};

export const INTERVIEW_START = { momentum: 55, noise: 0 };
export const NOISE_MAX = 100;

export const INTERVIEW_QUESTIONS: InterviewQuestion[] = [
  {
    id: "labels",
    topic: "Labels",
    prompt: "Simple yes or no — are you a socialist?",
    options: [
      {
        text: "I'm a New Yorker focused on free buses and frozen rent. Call it whatever helps you sleep.",
        type: "message",
        reaction: "Pivot sticks the landing. The clip is boring — which is perfect.",
      },
      {
        text: "Well, let me define socialism for you over the next nine minutes…",
        type: "trap",
        reaction: "You just handed them a nine-minute clip. It's already a thumbnail.",
      },
      {
        text: "No comment.",
        type: "dodge",
        reaction: "'No comment' reads as hiding something. Mid.",
      },
    ],
  },
  {
    id: "culture-war",
    topic: "National Outrage",
    prompt: "What's your position on the trending national outrage of the day?",
    options: [
      {
        text: "That's a national food fight. In this city, we just opened all eleven pools.",
        type: "message",
        reaction: "Pools beat discourse. The Noise meter exhales.",
      },
      {
        text: "Honestly? Let me give you my full hot take, exclusively, right now.",
        type: "trap",
        reaction: "Congratulations — you're the main character of the internet today.",
      },
      {
        text: "My team will send over a statement later.",
        type: "dodge",
        reaction: "Buys time, looks evasive. Forgettable.",
      },
    ],
  },
  {
    id: "billionaire",
    topic: "The Critic",
    prompt: "A billionaire says your tax plan will 'destroy the city.' Your response?",
    options: [
      {
        text: "He can afford the childcare tax. The two-year-olds can't afford to wait.",
        type: "message",
        reaction: "On-message and it fits on a sign. Aides nodding.",
      },
      {
        text: "Let me read his net worth aloud and get personal about his third yacht.",
        type: "trap",
        reaction: "Now it's a feud. Feuds are pure noise.",
      },
      {
        text: "We'll have to agree to disagree.",
        type: "dodge",
        reaction: "Limp. Nobody clips 'agree to disagree.'",
      },
    ],
  },
  {
    id: "hypothetical",
    topic: "The Gotcha",
    prompt: "Hypothetically — if the worst-case scenario happened, would you reverse course?",
    options: [
      {
        text: "I don't do hypotheticals. I do potholes — 165,000 of them, patched.",
        type: "message",
        reaction: "Refused the hypothetical AND landed a stat. Textbook.",
      },
      {
        text: "Sure, hypothetically, I suppose I might consider possibly…",
        type: "trap",
        reaction: "Rule one of pressers: never take the hypothetical. Oof.",
      },
      {
        text: "Pass.",
        type: "dodge",
        reaction: "Safe, but you left momentum on the table.",
      },
    ],
  },
  {
    id: "anger-bait",
    topic: "The Bait",
    prompt: "People say you're just… too angry. *leans in, smirking*",
    options: [
      {
        text: "I'm pretty calm — the rent's frozen. Hard to stay mad about that.",
        type: "message",
        reaction: "Disarmed the bait with a win. They hate when that works.",
      },
      {
        text: "I am NOT angry! How DARE you imply that I'm ANGRY!",
        type: "trap",
        reaction: "The clip of you yelling 'I'm not angry' is undefeated. They love it.",
      },
      {
        text: "*nervous laugh* heh… who said that?",
        type: "dodge",
        reaction: "The nervous laugh becomes the GIF. Not ideal.",
      },
    ],
  },
  {
    id: "nationalize",
    topic: "The Spin Room",
    prompt: "What does your race mean for the future of the national party?",
    options: [
      {
        text: "This is about New York. The bus is free here — not in a cable-news green room.",
        type: "message",
        reaction: "Re-localized the whole thing. The Noise meter sulks.",
      },
      {
        text: "Let me speak on behalf of the entire national movement for a moment…",
        type: "trap",
        reaction: "You just adopted every national fight as your own. Noise: thrilled.",
      },
      {
        text: "That's above my pay grade.",
        type: "dodge",
        reaction: "Humble, but you ceded the frame.",
      },
    ],
  },
  {
    id: "purity-test",
    topic: "The Purity Test",
    prompt: "An advocacy group demands you commit to their maximalist slogan — right now, on camera.",
    options: [
      {
        text: "I commit to delivering: childcare, free buses, frozen rent. Slogans don't open pools.",
        type: "message",
        reaction: "Stayed concrete. Promised deliverables, not vibes.",
      },
      {
        text: "Absolutely, I'll chant whatever you'd like me to chant!",
        type: "trap",
        reaction: "Overpromised on live TV. The walk-back clip writes itself.",
      },
      {
        text: "We share the same values, broadly speaking.",
        type: "dodge",
        reaction: "'Broadly speaking' satisfies nobody.",
      },
    ],
  },
  {
    id: "the-closer",
    topic: "The Closer",
    prompt: "Last question. In one sentence: why should they trust you?",
    options: [
      {
        text: "The potholes are fixed, the pools are open — panic accordingly.",
        type: "message",
        reaction: "Mic drop. That's the slogan. Roll credits.",
      },
      {
        text: "Well, it's a five-part answer, and to fully understand part one…",
        type: "trap",
        reaction: "You had the one-liner RIGHT THERE and rambled past it.",
      },
      {
        text: "Trust is earned, not given.",
        type: "dodge",
        reaction: "Fortune-cookie energy. Forgettable closer.",
      },
    ],
  },
];
