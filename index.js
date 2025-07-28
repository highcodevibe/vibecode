const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Temp Mail Backend Running');
});

// In-memory store for emails and messages
const tempEmails = {};
const EMAIL_DOMAIN = 'tempmail.com';
const EMAIL_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes

// Helper to generate random email
function generateRandomEmail() {
  const id = Math.random().toString(36).substring(2, 10);
  return `${id}@${EMAIL_DOMAIN}`;
}

// Helper to expire emails
function expireEmail(address) {
  delete tempEmails[address];
}

// API: Generate a new temp email
app.post('/api/generate', (req, res) => {
  const email = generateRandomEmail();
  const createdAt = Date.now();
  tempEmails[email] = { messages: [], createdAt };
  setTimeout(() => expireEmail(email), EMAIL_EXPIRY_MS);
  res.json({ email, expiresAt: createdAt + EMAIL_EXPIRY_MS });
});

// API: Get messages for an email
app.get('/api/messages/:email', (req, res) => {
  const email = req.params.email;
  const entry = tempEmails[email];
  if (!entry) return res.status(404).json({ error: 'Email not found or expired' });
  res.json({ messages: entry.messages });
});

// Simulate incoming emails every 20-40 seconds for each temp email
setInterval(() => {
  const now = Date.now();
  Object.entries(tempEmails).forEach(([email, entry]) => {
    if (now - entry.createdAt > EMAIL_EXPIRY_MS) return;
    if (Math.random() < 0.5) { // 50% chance to receive a message
      const msg = {
        from: `sender${Math.floor(Math.random()*100)}@example.com`,
        subject: `Hello to ${email}`,
        body: `This is a simulated message for ${email}.`,
        receivedAt: Date.now(),
      };
      entry.messages.push(msg);
    }
  });
}, 20000);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});