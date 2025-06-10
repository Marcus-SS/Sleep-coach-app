const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

fetch('https://kkbysdcykwmofvbfvwtf.supabase.co/rest/v1/', {
  headers: { apikey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtrYnlzZGN5a3dtb2Z2YmZ2d3RmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc5ODk1ODYsImV4cCI6MjA2MzU2NTU4Nn0.8RcJiUw0nDeId98g2wCmWZSXBa3e6ZchM3o4bYLhSok' }
})
  .then(res => res.text())
  .then(console.log)
  .catch(console.error); 