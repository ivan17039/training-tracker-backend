function provjeriObavezno(vrijednost, imePolja) {
  if (vrijednost.trim() === "") {
    return `${imePolja} je obavezno`;
  }
  return null;
}

module.exports = provjeriObavezno;
