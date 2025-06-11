import { LoremIpsum } from "lorem-ipsum";

const lorem = new LoremIpsum();

export function loremMarkdown() {
  return [
    `# ${generateSentence()}`,
    generateParagraph(),
    `## ${generateSentence()}`,
    generateParagraph(),
    `## ${generateSentence()}`,
    generateParagraph(),
  ].join("\n\n");
}

function generateWord(options?: { capitalize?: boolean }) {
  let word = lorem.generateWords(1);
  if (options?.capitalize) {
    word = word.charAt(0).toUpperCase() + word.slice(1);
  }
  if (Math.random() > 0.9) {
    return randomElement([`**${word}**`, `*${word}*`, `\`${word}\``]);
  }
  return word;
}

function generateSentence() {
  const wordsAmount = Math.floor(Math.random() * 10) + 4;
  let sentence = "";
  for (let i = 0; i < wordsAmount; i++) {
    sentence += generateWord({ capitalize: i === 0 });
    if (i < wordsAmount - 1) {
      sentence += " ";
    }
  }
  return sentence;
}

function generateParagraph() {
  const sentencesAmount = Math.floor(Math.random() * 10) + 4;
  let paragraph = "";
  for (let i = 0; i < sentencesAmount; i++) {
    const period = i < sentencesAmount - 1 ? ". " : ".";
    paragraph += generateSentence() + period;
  }
  return paragraph;
}

function randomElement<T>(array: T[]) {
  return array[Math.floor(Math.random() * array.length)];
}
