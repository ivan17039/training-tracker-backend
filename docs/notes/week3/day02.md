# Tjedan 3, Dan 2 – Detaljni plan: Treninzi dobivaju tablicu

Danas se uvode 2 rute:

| Ruta | Što radi |
| --- | --- |
| GET /api/workouts | Vrati sve treninge prijavljenog korisnika |
| POST /api/workouts | Spremi novi trening prijavljenog korisnika |

Pošto je potrebno da backend zna kojem korisniku trening pripada s time radimo workout tablicu:

```sql
CREATE TABLE workouts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id), // (foreign key), svaki user_id iz workout tablice mora odgovarati stvarnom id-u koji postoji u tablici users
    name TEXT NOT NULL,
    date_millis BIGINT NOT NULL,
    exercises JSONB NOT NULL DEFAULT '[]' // [] za prazne vježbe 
);
```

`user_id` se nikad ne uzima iz `req.body.userId` jer taj zahtjev može poslat tko god stoga koristimo već uvedeni `req.userId` postavljen od `requireAuth` potvrđenog od middlewarea.

## POST treninga

```text
POST http://localhost:3000/api/workouts
```

```json
{
  "id": 1,
  "user_id": 1,
  "name": "Test trening",
  "date_millis": "1700000000000",
  "exercises": []
}
```

## GET treninga

```text
GET http://localhost:3000/api/workouts
```

```json
[
  {
    "id": 1,
    "user_id": 1,
    "name": "Test trening",
    "date_millis": "1700000000000",
    "exercises": []
  }
]
```

## Vježbe

### 1. Foreign key provjera

Pokušaj ručno, kroz SQL Editor, upisati red u workouts s `user_id` koji sigurno ne postoji (npr. `99999`). Potvrdi da baza to odbije, i pročitaj kakvu grešku vrati.

```sql
INSERT INTO workouts (
  user_id,
  name,
  date_millis,
  exercises
)
VALUES (
  99999,
  'Test trening',
  1700000000000,
  '[]'
)
RETURNING *;
```

```text
Failed to run sql query: ERROR:  23503: insert or update on table "workouts" violates foreign key constraint "workouts_user_id_fkey"
DETAIL:  Key (user_id)=(99999) is not present in table "users".
```

### 2. POST bez `name` polja

Testiraj `POST /api/workouts` bez `name` polja u tijelu — potvrdi 400 grešku, ne 500 ili uspjeh s praznim imenom.

```text
400 error
```

```json
{
  "error": "Ime treninga je obavezno"
}
```

### 3. `date_millis` kao BIGINT

**(Bez koda)** `date_millis` je `BIGINT`, ne `INTEGER`. Razmisli zašto — koliko otprilike iznosi trenutni broj milisekundi od 1970., i stane li to u običan `INTEGER` (koji ide do otprilike 2.1 milijarde)?

Trenutni broj milisekundi od 1970. iznosi oko 1,79 bilijuna. Obični INTEGER ide samo do oko 2,1 milijarde, pa taj broj ne stane u njega. Zato date_millis mora biti BIGINT.

### 4. DELETE treninga

**(Stretch)** Dodaj rutu `DELETE /api/workouts/:id`, zaštićenu s `requireAuth`, koja obriše SAMO ako se `id` I `user_id` oboje poklapaju s onim iz tokena (`DELETE FROM workouts WHERE id = $1 AND user_id = $2`). Razmisli zašto oba uvjeta moraju biti u istom upitu, ne provjerena odvojeno.

```javascript
app.delete("/api/workouts/:id", requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      "DELETE FROM workouts WHERE id = $1 AND user_id = $2",
      [req.params.id, req.userId],
    );
    if (result.rowCount === 0) {
      return res.status(404).json({
        error: "Trening nije pronađen",
      });
    }
    res.status(204).send(); // Operacija je uspjela, ali server nema dodatni sadržaj za poslati natrag
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Nešto je pošlo po zlu" });
  }
});
```

#### Zašto oba uvjeta moraju biti u istom upitu

Zato da sama baza u jednom koraku provjeri:

```text
Postoji li trening s tim ID-em?
        I
Pripada li upravo prijavljenom korisniku?
```

```text
DELETE http://localhost:3000/api/workouts/2
Status: 204 No Content
```
