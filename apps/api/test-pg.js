const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.ittjtscnoqnqovnayvtg:Li%232q4ui%25d9ati39_o%21n@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?sslmode=require'
});

client.connect()
  .then(() => {
    console.log('PG Connected successfully');
    return client.end();
  })
  .catch(err => {
    console.error('PG Connection Error:', err.message);
  });
