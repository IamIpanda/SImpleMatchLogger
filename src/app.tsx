import { useEffect, useState } from 'preact/hooks'
import './app.css'
import { Table } from 'antd'
import type { TableColumnsType } from 'antd'
import dayjs from 'dayjs'

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

function render_downloadable(text: string, deck: string) {
  return <div class="downloadable" onClick={download.bind(null, text + ".ydk", deck)}>{text}</div>
}

const columns: TableColumnsType<Data> = [
  {title: '时间', key: 'time', width: 220, render: (_, d) => render_time(d.start_time, d.end_time)},
  {title: '房间', dataIndex: 'arena', key: 'arena', render: (v) => v.split("/")[1]},
  {title: '玩家A', dataIndex: 'username_a', key: 'playera', align: 'end', render: (v,d) => render_downloadable(v,d.user_deck_a)},
  {title: '比分', key: 'score', width: 20, render: (_, d) => `${d.user_score_a}:${d.user_score_b}`},
  {title: '玩家B', dataIndex: 'username_b', key: 'playerb', render: (v,d) => render_downloadable(v,d.user_deck_b)}

]
export function App() {
  let [page, set_page] = useState(0)
  let [item_count, set_item_count] = useState(0)
  let [data, set_data] = useState<Data[]>([])
  let fetch_data = async () => {
    fetch((import.meta.env.PROD ? import.meta.env.BASE_URL : "") + "/match?page=" + (page).toString()).then(r => r.json()).then(r => set_data(r));
    fetch((import.meta.env.PROD ? import.meta.env.BASE_URL : "") + "/match/count").then(r => r.text()).then(r => set_item_count(parseInt(r)))
  }
  useEffect(() => { fetch_data() }, [page])
  
  return <div class="table-container">
    <Table<Data> columns={columns} dataSource={data} pagination={{align: 'center', showSizeChanger: false, pageSize: 20, total: item_count, onChange: (p) => set_page(p)}}/>
  </div>
}
