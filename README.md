# Simple Match Logger
这是一个简单的用于srvpro的对战记录器。    

## Setup
只能使用 postgres 数据库，需要设置以下环境变量：    
```DATABASE_STRING=host={{DATABASE_HOST}} user={{DATABASE_USER}} password={{DATABASE_PASSWORD}} dbname={{DATABASE_NAME}}```    
以及可选的    
```ACCESS_KEY=xxx```    
后使用 docker 启动，服务监听 8080 端口，前后端合一。

初始化表：
```
CREATE TABLE deck (
  "time" timestamp(6) DEFAULT now(),
  "deck" text,
  "player" text,
  "arena" text
)
CREATE TABLE match (
  "username_a" text,
  "username_b" text,
  "user_score_a" int4,
  "user_score_b" int4,
  "user_deck_a" text,
  "user_deck_b" text,
  "start_time" text,
  "end_time" text,
  "arena" text
)
```

放置 srvpro 插件：
```
ygopro.stoc_follow('DUEL_START', true, function(buffer, info, client, server, datas) {
  var room;
  room = ROOM_all[client.rid];
  if (client.is_local)
    room.arena = null;
  if (client.pos == 0 && room.arena !== null)
    room.arena = settings.modules.arena_mode.mode + "/" + room.name
});
```
设置 srvpro 配置：
```
"arena_mode": {
    "enabled": true,
    "mode": "JUST WRITE ANYTHING EXCEPT EMPTY",
    "accesskey": "ACCESS KEY",
    "post_score": "YOUR SERVICE ENDPOINT/match",
    "get_score": null,
},
```

## Reverse Proxy
直接单proxy_pass即可。
