const SATUAN = ["", "satu", "dua", "tiga", "empat", "lima", "enam", "tujuh", "delapan", "sembilan"];
const BELASAN = ["sepuluh", "sebelas", "dua belas", "tiga belas", "empat belas", "lima belas", "enam belas", "tujuh belas", "delapan belas", "sembilan belas"];

function tigaAngka(n: number): string {
  let s = "";
  const ratusan = Math.floor(n / 100);
  const sisaRatusan = n % 100;
  if (ratusan > 0) s += (ratusan === 1 ? "seratus" : `${SATUAN[ratusan]} ratus`) + " ";
  if (sisaRatusan >= 10 && sisaRatusan < 20) {
    s += BELASAN[sisaRatusan - 10];
  } else {
    const puluhan = Math.floor(sisaRatusan / 10);
    const satuan = sisaRatusan % 10;
    if (puluhan > 0) s += (puluhan === 1 ? "sepuluh" : `${SATUAN[puluhan]} puluh`) + " ";
    if (satuan > 0) s += SATUAN[satuan];
  }
  return s.trim();
}

/** Angka ke terbilang bahasa Indonesia. Hanya untuk bilangan bulat non-negatif. */
export function terbilang(n: number): string {
  n = Math.round(Math.abs(n));
  if (n === 0) return "nol";

  const satuan = n % 1000;
  const ribuan = Math.floor(n / 1000) % 1000;
  const jutaan = Math.floor(n / 1_000_000) % 1000;
  const miliaran = Math.floor(n / 1_000_000_000) % 1000;
  const triliunan = Math.floor(n / 1_000_000_000_000);

  const parts: string[] = [];
  if (triliunan > 0) parts.push(`${tigaAngka(triliunan)} triliun`);
  if (miliaran > 0) parts.push(`${tigaAngka(miliaran)} miliar`);
  if (jutaan > 0) parts.push(`${tigaAngka(jutaan)} juta`);
  if (ribuan > 0) parts.push(ribuan === 1 ? "seribu" : `${tigaAngka(ribuan)} ribu`);
  if (satuan > 0) parts.push(tigaAngka(satuan));

  return parts.join(" ").trim();
}

export function rupiahTerbilang(n: number): string {
  const kata = terbilang(n);
  return `${kata.charAt(0).toUpperCase()}${kata.slice(1)} rupiah`;
}
