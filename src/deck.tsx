import { Card, Divider, Popover } from 'antd'
import { format_card, is_ex } from './card'
import "./deck.css"
import { Dispatch, StateUpdater, useRef, useState } from 'preact/hooks'

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

export function DeckItem({n, setter}: {n: number, setter: Dispatch<StateUpdater<[string, string]>>}) {
  let text = format_card(n)
  return <img class="deck-item" src={(import.meta.env.PROD ? import.meta.env.BASE_URL : "") + `pics/${n}.jpg!thumb`} onMouseEnter={() => setter(text)}/>
}

export function Deck({deck}: {deck: string}) {
  let [text, set_text] = useState<[string, string]>(["", ""]);
  let deck_ref = useRef<HTMLDivElement>(null)
  let typed_deck = TypedDeck.from_string(deck)
  let main = typed_deck.main
  let ex: number[] = []
  let first_index = main.findIndex((n) => is_ex(n))
  if (first_index >= 0) {
    ex = main.slice(first_index)
    main = main.slice(0, first_index)
  }

  let hint_position = (deck_ref.current != null && deck_ref.current.getBoundingClientRect().right + 440 > window.innerWidth ? "effect-container-left" : "effect-container-right")
  if (window.innerWidth < 1200)
    hint_position = (deck_ref.current != null && deck_ref.current.getBoundingClientRect().top > 400 ? "effect-container-top" : "effect-container-bottom")
  return <div class="deck-container">
    <div class="deck" ref={deck_ref}>
      {main.map(n => <DeckItem n={n} setter={set_text} />)}
      <br /><Divider />
      {ex.length > 0 ? [ex.map(n => <DeckItem n={n} setter={set_text} />),<br />,<Divider />] : null}
      {typed_deck.side.map(n => <DeckItem n={n} setter={set_text} />)}
    </div>
    {text[0] === "" ? null : 
      <Card className={`effect-container ${hint_position}`}>
        <Card.Meta
          title={text[0]}
          description={<div class="effect">{text[1]}</div>}
        />
      </Card>
    }
  </div>
}
