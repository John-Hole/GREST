import { createClient } from '@libsql/client';

const url = 'libsql://grest-john-hole.aws-eu-west-1.turso.io';
const authToken = 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzEwOTA0ODQsImlkIjoiN2I3ZTg5YmUtZGM4Ny00ZTkxLWI1NjktZDA1YTEyYjc1ZTI3IiwicmlkIjoiYjQwYWMxNTMtZmNjZi00NjBkLWEyNjMtZDAyNGNkMDUwOGJhIn0.kkw3lx29NiHI2Z3v191boS3eMYmjB7dbvhItfuteVlCbIXTtLh8PQw9N3WNZxwW4FBwn7Seeii5zFpetElYkCg';

const client = createClient({ url, authToken });

async function run() {
  console.log('Differenziazione giallo e arancione...');
  try {
    await client.execute('UPDATE teams SET color_hex = ? WHERE id = ?', ['#EAB308', 4]); // I Pinki-Punki: Giallo Sole (Yellow-500)
    await client.execute('UPDATE teams SET color_hex = ? WHERE id = ?', ['#EA580C', 5]); // I Cappellai: Arancione Bruciato/Ruggine (Orange-600)
    console.log('Colori aggiornati con successo!');
  } catch (err) {
    console.error('Errore:', err);
  }
}

run();
