# Tjedan 2, Dan 6 – Detaljni plan: Prava baza za korisnike

Problem race condition, ako istovremeno pošaljemo zahtjeve za izradu istih email-ova.

## Rješenje:

U PostgreSQL tablici ćeš staviti ograničenje da je email jedinstven:

```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email TEXT UNIQUE NOT NULL, => “Ne postoje dva retka s istim emailom.”
    password_hash TEXT NOT NULL
);
```

```javascript
const upit = `SELECT * FROM users WHERE email = '${email}'`;
```

Ako korisnik pošalje poseban tekst, on više nije samo “vrijednost emaila” — može postati dio same SQL logike.

```javascript
email = "' OR '1'='1"
```

dobiješ:

```sql
SELECT * FROM users WHERE email = '' OR '1'='1'
```

```sql
'1' = '1'
```

je uvijek istinit. Zato uvjet postane otprilike:

```text
email je prazan ILI je 1 jednako 1
```

Kako je `1 = 1` uvijek točno, upit može vratiti sve retke iz `users` tablice.

## Rješenje: parametrizirani upit

```javascript
const result = await pool.query(
  'SELECT * FROM users WHERE email = $1',
  [email]
);
```

| Dio                                    | Značenje                               |
| -------------------------------------- | -------------------------------------- |
| 'SELECT * FROM users WHERE email = $1' | SQL naredba koju ti kontroliraš        |
| $1                                     | mjesto za prvu vrijednost              |
| [email]                                | niz stvarnih podataka koje šalješ bazi |

S ovim pristupom email ne postane dio SQL naredbe.

## Vježbe

### 1. Otvori Supabase (ili svoj Postgres klijent) i pogledaj users tablicu izravno

Provjeri da su lozinke koje vidiš stvarno bcrypt hashevi (počinju s `$2b$...`), ne čitljiv tekst.

```json
[
  {
    "idx": 0,
    "id": 1,
    "email": "test@test.com",
    "password_hash": "$2b$10$v27PLh7ukAXG6vOV73zXmOmTVGezDWJC1zGaHPd/zt3lzfZN5UH3."
  }
]
```

### 2. Pokušaj ručno, kroz SQL Editor, upisati drugi red s istim emailom kao postojeći korisnik

```sql
INSERT INTO users (email, password_hash)
VALUES ('isti@email.com', 'bilokoji')
```

gdje `isti@email.com` već postoji.

Pogledaj grešku koju Postgres vrati — prepoznaješ li kod `23505`?

```text
Failed to run sql query: ERROR:  23505: duplicate key value violates unique constraint "users_email_key"
DETAIL:  Key (email)=(test@test.com) already exists.
```

### 3. (Bez koda) U /api/register, bcrypt.hash se izvrši PRIJE try bloka koji pokušava upisati u bazu

Zašto to poredak nije problem — što ako upis u bazu padne, je li hashiranje bilo uzalud?

Hashiranje nije problem ako upis u bazu padne. `passwordHash` je tada postojao samo privremeno u memoriji i neće se spremiti u bazu; nakon završetka requesta odbaci se. Jedino je potrošeno malo procesorskog vremena na hashiranje. Redoslijed je ispravan jer prije `INSERT` upita moramo imati hash kako bismo u bazu spremili `passwordHash`, a nikad plain lozinku.

### 4. (Stretch) Dodaj drugi stupac tablici

Dodaj stupac `created_at TIMESTAMP DEFAULT NOW()` kroz SQL Editor:

```sql
ALTER TABLE users
ADD COLUMN created_at TIMESTAMP DEFAULT NOW();
```

Ne moraš ga još nigdje koristiti u kodu — samo uvježbaj mijenjanje sheme postojeće tablice.

```json
[
  {
    "idx": 0,
    "id": 1,
    "email": "test@test.com",
    "password_hash": "$2b$10$v27PLh7ukAXG6vOV73zXmOmTVGezDWJC1zGaHPd/zt3lzfZN5UH3.",
    "created_at": "2026-09-23 18:00:47.536191"
  }
]
```