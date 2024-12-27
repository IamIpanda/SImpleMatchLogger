import Sqlite3InitModule from "@sqlite.org/sqlite-wasm"
import { Card, format, parse_database } from "cdb-transformer"

export let Sqlite3 = await Sqlite3InitModule({ print: console.log, printErr: console.error });

let cards: Record<number, Card> = []
export async function init() {
    let load_path = await fetch(import.meta.env.BASE_URL + "databases").then((r) => r.json()) as string[];
    if (load_path == null) return
    for (let path of load_path) {
        let arr = await fetch("." + path).then((r) => r.status == 200 ? r.arrayBuffer() : null)
        if (arr == null) continue;
        let pointer = Sqlite3.wasm.allocFromTypedArray(arr);
        let database = new Sqlite3.oo1.DB();
        let result_code = Sqlite3.capi.sqlite3_deserialize(database, 'main', pointer, arr.byteLength, arr.byteLength, 0);
        database.checkRc(result_code);
        let part_cards = parse_database(database);
        for (let card of part_cards)
            cards[card.code] = card
    }
}

export function format_card(id: number): [string, string] {
    let card = cards[id]
    if (card == null) return [id.toString(), '未知卡片']
    let text =  format(card)
    let n = text.indexOf("\n")
    if (n < 0) return [id.toString(), text]
    else return [text.substring(0, n), text.substring(n+1)]
}

export function is_ex(id: number) {
    let card = cards[id]
    if (card == null) return false
    return (card.type & 1) > 0 && (card.type & 0x4802040) > 0
}
