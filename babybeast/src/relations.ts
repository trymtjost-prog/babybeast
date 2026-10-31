/**
 * Who is following the beast. The parent-to-be sets the due date; everyone else joins with a code.
 * All wording that mentions the baby goes through here, so each relation gets its own beast name.
 */
export type Relation = 'parent' | 'partner' | 'grandparent' | 'greatgrandparent' | 'auntuncle' | 'godparent' | 'friend';

export type RelationInfo = {
  id: Relation;
  label: string; // shown in pickers: "Grandparent"
  emoji: string;
  baby: string; // "your grandbaby"
  beast: string; // "your grandbeast"
  shareBaby: string; // first-person line for share images: "My grandbaby"
  shareBeast: string; // secret-mode version: "My grandbeast"
  invite: string; // opening line of the invite message
};

export const RELATIONS: RelationInfo[] = [
  {
    id: 'parent',
    label: 'Parent-to-be',
    emoji: '🤰',
    baby: 'your baby',
    beast: 'your beast',
    shareBaby: 'Baby',
    shareBeast: 'My beast',
    invite: '',
  },
  {
    id: 'partner',
    label: 'Partner',
    emoji: '💞',
    baby: 'your baby',
    beast: 'your beast',
    shareBaby: 'Baby',
    shareBeast: 'My beast',
    invite: "Let's follow our beast together!",
  },
  {
    id: 'grandparent',
    label: 'Grandparent',
    emoji: '👵',
    baby: 'your grandbaby',
    beast: 'your grandbeast',
    shareBaby: 'My grandbaby',
    shareBeast: 'My grandbeast',
    invite: 'Your grandbeast is on its way!',
  },
  {
    id: 'greatgrandparent',
    label: 'Great-grandparent',
    emoji: '🧓',
    baby: 'your great-grandbaby',
    beast: 'your great-grandbeast',
    shareBaby: 'My great-grandbaby',
    shareBeast: 'My great-grandbeast',
    invite: 'Your great-grandbeast is on its way!',
  },
  {
    id: 'auntuncle',
    label: 'Aunt or uncle',
    emoji: '🧑',
    baby: 'your niece or nephew',
    beast: 'your nibling beast',
    shareBaby: 'My niece or nephew',
    shareBeast: 'My nibling beast',
    invite: "You're about to become an aunt or uncle to a beast!",
  },
  {
    id: 'godparent',
    label: 'Godparent',
    emoji: '✨',
    baby: 'your godchild',
    beast: 'your godbeast',
    shareBaby: 'My godchild',
    shareBeast: 'My godbeast',
    invite: 'Will you follow our little godbeast?',
  },
  {
    id: 'friend',
    label: 'Friend',
    emoji: '🙌',
    baby: "your friend's baby",
    beast: "your friend's beast",
    shareBaby: "My friend's baby",
    shareBeast: "My friend's beast",
    invite: 'Our beast is growing and you get a front row seat!',
  },
];

/** Relations someone can join as (everyone except the parent-to-be who owns the due date). */
export const JOIN_RELATIONS = RELATIONS.filter((r) => r.id !== 'parent');

export function relationInfo(id: string | null | undefined): RelationInfo {
  return RELATIONS.find((r) => r.id === id) ?? RELATIONS[0];
}

export function isRelation(id: string | null | undefined): id is Relation {
  return RELATIONS.some((r) => r.id === id);
}

export function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
