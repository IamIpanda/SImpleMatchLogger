use std::env::var;
use std::sync::Arc;
use std::sync::OnceLock;

use axum::extract::Path;
use axum::extract::Query;
use axum::http::StatusCode;
use axum::Form;
use axum::Json;
use axum::Router;
use axum::routing::*;
use tokio_postgres::Client;
use tokio::sync::Mutex;
use tokio::net::TcpListener;
use tower_http::services::ServeDir;

static PG_CLIENT: OnceLock<Arc<Mutex<Client>>> = OnceLock::new();

#[tokio::main]
async fn main() {
    let database = var("DATABASE_STRING").expect("don't specify database string");
    let (client, connection) = tokio_postgres::connect(&database, tokio_postgres::NoTls).await.expect("Failed to connect database");
    tokio::spawn(async move { connection.await.ok(); });
    PG_CLIENT.set(Arc::new(Mutex::new(client))).ok();
    let listener = TcpListener::bind("0.0.0.0:8080").await.expect("gailed to bind port");
    let static_path = var("STATIC_DIR").unwrap_or(".".to_string());
    let serve = ServeDir::new(&static_path);
    let app = Router::new()
        .route("/deck", post(deck))
        .route("/match", post(_match))
        .route("/deck", get(query_deck))
        .route("/match", get(query_match))
        .route("/:table/count", get(query_count))
        .fallback_service(serve);
    axum::serve(listener, app).await.ok();
}

#[derive(serde::Serialize, serde::Deserialize)]
struct DeckRecord {
    #[serde(alias="accessKey", skip_serializing)]
    access_key: String,
    deck: String,
    #[serde(alias="playername")]
    player_name: String,
    arena: String,
    #[serde(skip_deserializing)]
    time: i64
}

async fn deck(Form(record): Form<DeckRecord>) -> StatusCode {
    if record.access_key != var("ACCESS_KEY").unwrap_or(String::new()) { return StatusCode::BAD_REQUEST }
    let connection = PG_CLIENT.get().expect("connection not inited").lock().await;
    match connection.execute("INSERT INTO record(deck,player,arena) values($1,$2,$3)", &[&record.deck, &record.player_name, &record.arena]).await {
        Ok(_) => StatusCode::NO_CONTENT,
        Err(_) => StatusCode::INTERNAL_SERVER_ERROR,
    }
}

#[derive(Debug, serde::Serialize, serde::Deserialize)]
struct MatchRecord {
    #[serde(alias="accesskey", skip_serializing)]
    access_key: String,
    #[serde(alias="usernameA")]
    username_a: String,
    #[serde(alias="usernameB")]
    username_b: String,
    #[serde(alias="userscoreA")]
    user_score_a: String,
    #[serde(alias="userscoreB")]
    user_score_b: String,
    #[serde(alias="userdeckA")]
    user_deck_a: String,
    #[serde(alias="userdeckB")]
    user_deck_b: String,
    #[serde(alias="start")]
    start_time: String,
    #[serde(alias="end")]
    end_time: String,
    arena: String
}

async fn _match(Form(record): Form<MatchRecord>) -> StatusCode {
    if record.access_key != var("ACCESS_KEY").unwrap_or(String::new()) { return StatusCode::BAD_REQUEST }
    let connection = PG_CLIENT.get().expect("connection not inited").lock().await;
    let user_score_a = match record.user_score_a.parse::<i32>() { Ok(a) => a, Err(_) => return StatusCode::BAD_REQUEST };
    let user_score_b = match record.user_score_b.parse::<i32>() { Ok(a) => a, Err(_) => return StatusCode::BAD_REQUEST };
    match connection.execute("INSERT INTO match values($1,$2,$3,$4,$5,$6,$7,$8,$9)",
        &[&record.username_a, &record.username_b, &user_score_a, &user_score_b, &record.user_deck_a, &record.user_deck_b, &record.start_time, &record.end_time, &record.arena]).await {
        Ok(_) => StatusCode::NO_CONTENT,
        Err(err) => {
            eprintln!("{:?}", err);
            return StatusCode::INTERNAL_SERVER_ERROR
        }
    }
}

#[derive(serde::Serialize, serde::Deserialize)]
struct SearchParameter {
    page: i64
}

async fn query_deck(query: Query<SearchParameter>) -> (StatusCode, Json<Vec<DeckRecord>>) {
    let offset = query.page * 20;
    let connection = PG_CLIENT.get().expect("connection not inited").lock().await;
    let rows = match connection.query("SELECT * from deck order by time desc offset $1 limit 20", &[&offset]).await {
        Ok(rows) => rows,
        Err(err) => {
            eprintln!("{:?}", err);
            return (StatusCode::INTERNAL_SERVER_ERROR, Json(vec![]))
        }
    };
    let records = rows.into_iter().map(|row| {
        DeckRecord {
            access_key: String::new(),
            deck: row.get(1),
            player_name: row.get(2),
            arena: row.get(3),
            time: 0
        }
    }).collect();
    (StatusCode::OK, Json(records))
}

async fn query_match(query: Query<SearchParameter>) -> (StatusCode, Json<Vec<MatchRecord>>) {
    let offset = query.page * 20;
    let connection = PG_CLIENT.get().expect("connection not inited").lock().await;
    let rows = match connection.query("SELECT * from match order by end_time desc offset $1 limit 20", &[&offset]).await {
        Ok(rows) => rows,
        Err(err) => {
            eprintln!("{:?}", err);
            return (StatusCode::INTERNAL_SERVER_ERROR, Json(vec![]))
        }
    };
    let records = rows.into_iter().map(|row| {
        MatchRecord {
            access_key: String::new(),
            username_a: row.get(0),
            username_b: row.get(1),
            user_score_a: row.get::<_, i32>(2).to_string(),
            user_score_b: row.get::<_, i32>(3).to_string(),
            user_deck_a: row.get(4),
            user_deck_b: row.get(5),
            start_time: row.get(6),
            end_time: row.get(7),
            arena: row.get(8),
        }
    }).collect();
    (StatusCode::OK, Json(records))
}

async fn query_count(Path(table): Path<String>) -> (StatusCode, Json<i64>) {
    if table != "match" && table != "deck" { return (StatusCode::NOT_FOUND, Json(0)) }
    let connection = PG_CLIENT.get().expect("connection not inited").lock().await;
    match connection.query_one(&format!("SELECT count(*) from {}", table), &[]).await {
        Ok(r) => (StatusCode::OK, Json(r.get(0))),
        Err(err) => {
            eprintln!("{:?}", err);
            (StatusCode::INTERNAL_SERVER_ERROR, Json(0))
        }
    }
}
