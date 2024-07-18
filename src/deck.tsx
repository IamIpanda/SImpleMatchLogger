export class Deck {
  main: number[] = []
  side: number[] = []

  static from_string(s: string): Deck {
    let deck = new Deck()
    let current = deck.main
    for (let line of s.split("\n")) {
      if (line.startsWith("#")) continue;
      if (line.startsWith("!")) {current = deck.side; continue;}
      let n = parseInt(line)
      if (n>0) current.push(n)
    }
    return deck
  }
}

export function DeckItem({deck}: {deck: Deck}) {
  <div class="deck">
    
  </div>
}
