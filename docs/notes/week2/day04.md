# Tjedan 2, Dan 4 – Početak backenda

## Ključni koncepti

- Room će i dalje služit za glavni prikaz samo što se uvodi backend kojim omogućujemo backup i sinkronizaciju.

- Dakle Room čita/piše lokalno, a backend kopira te podatke kad ima interneta.
- Repository sada dodatno s vremena na vrijeme pošalje podatke na backend i povuče što fali.(sinkronizacija)

### API Ugovor

#### POST /api/register

- prima: { email, password }
- vraća (uspjeh): { userId }
- vraća (greška, npr. email već postoji): status 400, { error: "poruka" }

#### POST /api/login

- prima: { email, password }
- vraća (uspjeh): { token }
- vraća (greška, kriva lozinka): status 401, { error: "poruka" }

### Prvi server
```javascript
const express = require('express');
const app = express();

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

# Vježbe – Tjedan 2, Dan 4

## 1. Dodaj drugu rutu, GET /

Dodaj drugu rutu, `GET /`, koja vrati jednostavnu poruku dobrodošlice (`res.send(...)` ili `res.json(...)`) — uvježbaj isti obrazac još jednom.

```javascript
app.get("/", (req, res) => {
  res.json({ message: "Dobrodošli na Training Tracker API" });
});
```

***

## 2. Pošalji zahtjev na rutu koja ne postoji

Pošalji zahtjev na rutu koja ne postoji (npr. `/nepostojeca`). Kakav odgovor dobiješ, i zašto Express zna vratiti baš to bez da si ti to ikad napisao?

**Odgovor:** `Cannot GET /nepostojeca`

Express ima svoj defaultni handler koji kaže "ova ruta ne postoji".

Express ima ugrađeni handler za 404 greške koji se automatski aktivira kad:
- Nijedna definirana ruta ne odgovara zahtjevu
- Nijedan middleware nije odgovorio na zahtjev

***

## 3. Razlika između 400 i 401 status koda

**(Bez koda)** U API ugovoru, `/api/register` vraća 400 za grešku, `/api/login` vraća 401. Zašto različit broj — koja je stvarna razlika između "email već postoji" i "kriva lozinka"?

**400 - Bad Request** = zahtjev je neispravan (nepostojeća email adresa, krivi format, prekratka lozinka ili nedostaje uneseno polje)

**401 - Unauthorized** = nema autentifikacije (email postoji ali lozinka nije točna, nevaljan JWT token)

Email već postoji je prilikom registracije (400), dok je kriva lozinka (401) kod prijave kad već postoji račun s tim emailom.

***

## 4. Stretch – pokvareni JSON

**(Stretch)** Pošalji na `/health` zahtjev s namjerno pokvarenim JSON tijelom (npr. u Postmanu, Body → raw → JSON, upiši `{neispravno`). Pogledaj što se dogodi — hoće li tvoja `/health` ruta uopće biti dosegnuta?

```javascript
app.post("/test", (req, res) => {
  console.log("✅ Ruta je dosegnuta!");
  res.json({ message: "Uspjeh" });
});
```

| Test | JSON            | Status | Ruta izvršena? |
|------|-----------------|--------|----------------|
| 1    | `{"ime": "Ivan"}` | 200    | ✅ Da           |
| 2    | `{neispravno`     | 400    | ❌ Ne           |