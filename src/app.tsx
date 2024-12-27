import { useEffect, useState } from 'preact/hooks'
import { Input, Popover, Table } from 'antd'
import type { TableColumnsType } from 'antd'
import dayjs from 'dayjs'
import { Deck } from './deck'

import './app.css'
import { init } from './card'

type Data = {
  username_a: string,
  username_b: string,
  user_score_a: string,
  user_score_b: string,
  user_deck_a: string,
  user_deck_b: string,
  start_time: string,
  end_time: string,
  arena: string,
}

function download(filename: string, content: string) {
  var element = document.createElement('a');
  element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(content));
  element.setAttribute('download', filename);
  element.style.display = 'none';
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
}

function render_time(time1: string, time2: string) {
  let day1 = dayjs(time1)
  let day2 = dayjs(time2)
  return day1.format("YYYY-MM-DD HH:mm") + " - " + day2.format("HH:mm")
}

function render_downloadable(text: string, deck: string, keyword: string) {
  return <Popover content={<Deck deck={deck}/>} title="卡组">
    <div class="downloadable" onClick={download.bind(null, text + ".ydk", deck)}><Highlight text={text} keyword={keyword} /></div>
  </Popover>
}

function Highlight(props: {text: string, keyword: string}) {
  if (props.keyword === '') return <div>{props.text}</div>;
  return <div dangerouslySetInnerHTML={{ __html: props.text.replace(props.keyword, `<span class="highlight">${props.keyword}</span>`) }} />
}

export function App() {
  let [page, set_page] = useState(0)
  let [keyword, set_keyword] = useState("")
  let [item_count, set_item_count] = useState(0)
  let [data, set_data] = useState<Data[]>([])
  useEffect(() => { init() }, [])
  let fetch_data = async () => {
    fetch((import.meta.env.PROD ? import.meta.env.BASE_URL : "") + `/match?page=${page}&keyword=${encodeURI(keyword)}`).then(r => r.json()).then(r => set_data(r));
    fetch((import.meta.env.PROD ? import.meta.env.BASE_URL : "") + `/match/count?keyword=${encodeURI(keyword)}`).then(r => r.text()).then(r => set_item_count(parseInt(r)))
  }
  useEffect(() => { fetch_data() }, [page])

  let columns: TableColumnsType<Data> = [
    { title: '时间', key: 'time', width: 220, render: (_, d) => render_time(d.start_time, d.end_time) },
    { title: '房间', dataIndex: 'arena', key: 'arena', render: (v) => <Highlight text={v.split("/")[1]} keyword={keyword} /> },
    { title: '玩家A', dataIndex: 'username_a', key: 'playera', align: 'end', render: (v, d) => render_downloadable(v, d.user_deck_a, keyword) },
    { title: '比分', key: 'score', width: 20, render: (_, d) => `${d.user_score_a}:${d.user_score_b}` },
    { title: '玩家B', dataIndex: 'username_b', key: 'playerb', render: (v, d) => render_downloadable(v, d.user_deck_b, keyword) }
  ]
  
  return <div class="table-container">
    <Input placeholder="搜索房名 / 玩家..." onChange={(e: any) => set_keyword(e.target.value)} onKeyDown={(e: any) => { if (e.key == 'Enter') fetch_data() }}/>
    <Table<Data> columns={columns} dataSource={data} pagination={{align: 'center', showSizeChanger: false, pageSize: 20, total: item_count, onChange: (p) => set_page(p-1)}}/>
  </div>
}
