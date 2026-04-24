# RybářApp – Bakalářská práce

Aplikace pro digitální správu rybářských úlovků a komunitní fórum.

---

## Struktura projektu

```
fishapp/
├── app.html          ← Spustitelný prototyp (otevřít v prohlížeči)
├── backend/
│   ├── server.js     ← Node.js + Express REST API
│   └── package.json  ← Závislosti backendu
└── README.md
```

---

## Rychlý start – Prototyp

Stačí otevřít soubor `app.html` v prohlížeči. Nevyžaduje instalaci ničeho.

**Demo přihlášení:** matej@example.com / rybar123

---

## Spuštění backendu (REST API)

### Požadavky
- Node.js 18+

### Instalace a spuštění

```bash
cd backend
npm install
node server.js
```

API poběží na `http://localhost:3001`

### Proměnné prostředí

Vytvořte soubor `.env`:
```
JWT_SECRET=vas-tajny-klic-zmenit-v-produkci
PORT=3001
```

---

## API Reference

### Autentizace

| Metoda | Endpoint | Popis |
|--------|----------|-------|
| POST | `/api/auth/register` | Registrace nového uživatele |
| POST | `/api/auth/login` | Přihlášení, vrátí JWT token |

**Příklad přihlášení:**
```json
POST /api/auth/login
{
  "email": "matej@example.com",
  "password": "rybar123"
}
```

Odpověď:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { "id": "...", "name": "Matěj Šmelko", "role": "rybar" }
}
```

Všechny další requesty vyžadují hlavičku:
```
Authorization: Bearer <token>
```

### Úlovky

| Metoda | Endpoint | Popis |
|--------|----------|-------|
| GET | `/api/catches` | Seznam vlastních úlovků |
| POST | `/api/catches` | Přidat nový úlovek |
| GET | `/api/catches/:id` | Detail úlovku |
| DELETE | `/api/catches/:id` | Smazat úlovek |
| GET | `/api/stats` | Statistiky uživatele |

**Příklad přidání úlovku:**
```json
POST /api/catches
{
  "species": "Kapr",
  "weight_g": 3200,
  "length_cm": 58,
  "revir": "Revír Ostravice č. 1",
  "bait": "Kukuřice",
  "note": "Krásný kus u jezu",
  "caught_date": "2025-04-22",
  "caught_time": "07:32"
}
```

### Fórum

| Metoda | Endpoint | Popis |
|--------|----------|-------|
| GET | `/api/posts` | Seznam příspěvků |
| POST | `/api/posts` | Vytvořit příspěvek |
| POST | `/api/posts/:id/like` | Lajkovat/odlajkovat |
| GET | `/api/posts/:id/comments` | Komentáře k příspěvku |
| POST | `/api/posts/:id/comments` | Přidat komentář |

### Revíry

| Metoda | Endpoint | Popis |
|--------|----------|-------|
| GET | `/api/fisheries` | Seznam revírů |

---

## Databáze

Aplikace používá **SQLite** (soubor `rybarapp.db` se vytvoří automaticky).

### Datový model

```
users          catches         forum_posts     comments
─────────────  ──────────────  ──────────────  ─────────────
id (PK)        id (PK)         id (PK)         id (PK)
name           user_id (FK)    user_id (FK)    post_id (FK)
email          species         category        user_id (FK)
password_hash  weight_g        title           body
role           length_cm       body            created_at
created_at     revir           likes_count
               bait            created_at
               note
               caught_date
               caught_time
```

---

## Bezpečnost (OWASP Mobile Top 10 2024)

- **M1 – Credential Usage**: Hesla hashována bcryptem (cost factor 12), JWT tokeny s expirací
- **M3 – Authentication**: JWT middleware na všech chráněných endpointech
- **M4 – Input Validation**: Validace vstupů před zápisem do DB
- **M5 – Insecure Communication**: Vyžaduje HTTPS v produkci
- **M8 – Security Misconfiguration**: Rate limiting na login (10 pokusů/min/IP)

---

## Technologický stack

| Vrstva | Technologie |
|--------|-------------|
| Frontend (web prototyp) | Vanilla JS + CSS (mobilní layout) |
| Frontend (produkce) | React Native 0.76+ |
| Backend | Node.js 18 + Express.js 4 |
| Databáze | SQLite (vývoj) / PostgreSQL (produkce) |
| Autentizace | JWT (jsonwebtoken) + bcryptjs |

---

## Autor

Matěj Šmelko – Bakalářská práce 2026  
Univerzita Tomáše Bati ve Zlíně, Fakulta aplikované informatiky
