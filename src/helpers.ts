
import { Concept } from './types';

export function formatShortNames(concept: Concept): string[] {
    const names: string[] = concept.abbr ? [concept.abbr] : [];
    const name = concept.name || concept.value;

    // contains digits
    if (/\d/.test(name)) {
        return names;
    }
    const words = name.split(/[\s]+/g).filter(w => w && w[0] === w[0].toUpperCase());
    if (words.length < 2) {
        return names;
    }
    // create abbreviation
    if (!concept.abbr && words.length > 2) {
        const abbr = words.map(w => w[0]).join('');
        names.push(abbr);
    }

    // format sort names: Vlad Filat -> V. Filat, V.Filat, V Filat
    if (words.length === concept.countWords && words.length === 2) {
        // V. Filat
        names.push(words[0][0] + '. ' + words[1]);
        // V Filat
        names.push(words[0][0] + ' ' + words[1]);
        // V.Filat
        names.push(words[0][0] + '.' + words[1]);
    }

    return names;
}
