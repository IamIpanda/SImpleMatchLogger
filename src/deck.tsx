import { Divider } from 'antd'
import "./deck.css"

class TypedDeck {
  main: number[] = []
  side: number[] = []

  static from_string(s: string): TypedDeck {
    let deck = new TypedDeck()
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

export function DeckItem({n}: {n: number}) {
  return <img class="deck-item" src={(import.meta.env.PROD ? import.meta.env.BASE_URL : "") + `pics/${n}.jpg!thumb`}></img>
}

export function Deck({deck}: {deck: string}) {
  let typed_deck = TypedDeck.from_string(deck)
  return <div class="deck">
    {typed_deck.main.map(n => <DeckItem n={n} />)}
    <br /><Divider />
    {typed_deck.side.map(n => <DeckItem n={n} />)}
  </div>
}
