# Tjedan 3, Dan 1 – Detaljni plan: Zaštićene rute (JWT middleware)

Da bi trening stigao do backenda i natrag, treba mu ČETIRI stvari:

1. Backend mora znati TKO postavlja zahtjev — inače bi bilo koji trening mogao pripasti bilo kome, ili nikome.
2. Backend mora imati tablicu za treninge, ne samo za korisnike.
3. Android mora znati POSLATI lokalne treninge prema backendu.
4. Android mora znati POVUĆI ono što backend ima, a lokalno nema, i to nekako pomiriti s postojećim Room podacima.

Danas se rješava prva stvar: Backend mora znati TKO postavlja zahtjev

## Middleware

Middleware - funkcija koja se izvrši između dolaska zahtjeva i rute(provjeri, promjeni req, ili pusti zahtjev ili zaustavi tu)

Dodavanje jedinstvenog middleware-a za provjeru valjanosti tokena i dodavanje userId na req.

```javascript
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Token nedostaje'
    });
  }

  const token = authHeader.split(' '); [developer.android](https://developer.android.com/kotlin/flow/test?hl=id)

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.userId = decoded.userId;

    next();
  } catch (e) {
    return res.status(401).json({
      error: 'Token nije valjan'
    });
  }
}
```

`req` - sadrži informacije o zahtjevu poput URL-a, HTTP metode, headera, parametra i request bodyja(popuni se tek nakon middlewarea).

```javascript
req = {
  method: "GET",
  url: "/api/me",
  headers: {
    authorization: "Bearer moj_token"
  }
}
```

preko `express.json()` popuni se `req.body`:

```javascript
req = {
  body: {
    email: "test@test.com",
    password: "lozinka123"
  }
}
```

Middleware uzme token, provjeri ga i ako je dobar dobivamo:

```javascript
decoded = {
  userId: 7,
  iat: 1234567890
}
```

Nakon toga preko `req.userId = decodec.userId` dodjeljujemo `userId` req objektu pošto middleware i ruta dobivaju isti req objekt za taj jedan zahtjev

`next` - funkcija koja kaže Expressu: “Provjera je prošla, idi na sljedeći korak.”

Zahjev se pokrene s tim prvo Express izvrši `requireAuth` i ako je token valjan pokrene se idući handler `(req,res) => {...}`

```javascript
app.get('/api/me', requireAuth, (req, res) => {
  res.json({ userId: req.userId });
});
```

## Vježbe

### 1. Zaštićena ruta `/api/ping`

Dodaj drugu zaštićenu rutu, GET `/api/ping`, koja jednostavno vrati `{ poruka: "pogodio si zaštićenu rutu" }` — ne treba joj `req.userId`, samo joj treba `requireAuth` prije nje, da uvježbaš da isti middleware možeš staviti na više ruta.

```javascript
app.get("/api/ping", requireAuth, (req, res) => {
  res.json({ poruka: "pogodio si zaštićenu rutu" });
});
```

### 2. Authorization header bez `Bearer`

Pošalji Authorization header BEZ riječi `"Bearer "` ispred (samo goli token). Provjeri da dobiješ istu grešku kao za potpuno nedostajući header — zašto `requireAuth` to tretira jednako?

```json
{
  "error": "Token nedostaje"
}
```

Pošto header ne sadrži početni Bearer isto je kao da i ne postoji tako `!authHeader.startsWith('Bearer ')` bude istinit stoga server vraća poruku greške `"Token nedostake"`

### 3. Zaboravljen zarez

**(Bez koda)** `requireAuth` se poziva kao DRUGI argument u `app.get('/api/me', requireAuth, handler)`. Što bi se dogodilo kad bi zaboravio zarez i napisao `app.get('/api/me', requireAuth handler)` — kakvu bi grešku (ili čudno ponašanje) to vjerojatno izazvalo?

Dvije varijable/funkcije ne mogu samo stajati jedna pokraj bez operatora, zareza ili zagrada.  
Dobio bi grešku sličnu:

```text
SyntaxError: missing ) after argument list
```

ili:

```text
SyntaxError: Unexpected identifier 'handler'
```

### 4. Token traje 10 sekundi

**(Stretch)** Token traje 7 dana (`expiresIn: '7d'` s Dana 5). Pričekati toliko je nepraktično za testiranje — privremeno promijeni na `'10s'` u `/api/login`, prijavi se, pričekaj 15 sekundi, pa pozovi `/api/me` s tim tokenom. Provjeri da dobiješ grešku isteka. Vrati na `'7d'` kad završiš.

Nakon više od 10 s dobijem poruku:

```json
{
  "error": "Token nije valjan"
}
```