const express = require('express');
const admin = require('firebase-admin');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

const allowedOrigin = process.env.ADMIN_PANEL_ORIGIN || '*';
app.use(cors({ origin: allowedOrigin }));
app.use(express.json());

function initFirebaseAdmin() {
  if (admin.apps.length > 0) {
    return;
  }

  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    return;
  }

  admin.initializeApp({
    credential: admin.credential.applicationDefault()
  });
}

initFirebaseAdmin();

async function authenticateAdmin(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const [scheme, token] = authHeader.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ message: 'Token ausente. Use Authorization: Bearer <token>.' });
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    return next();
  } catch (error) {
    return res.status(401).json({ message: 'Token inválido ou expirado.' });
  }
}

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.get('/admins', authenticateAdmin, async (_req, res) => {
  try {
    let nextPageToken;
    const admins = [];

    do {
      const result = await admin.auth().listUsers(1000, nextPageToken);
      result.users.forEach((userRecord) => {
        admins.push({ uid: userRecord.uid, email: userRecord.email || null });
      });
      nextPageToken = result.pageToken;
    } while (nextPageToken);

    return res.json({ admins });
  } catch (error) {
    console.error('GET /admins error:', error);
    return res.status(500).json({ message: 'Erro ao listar administradores.' });
  }
});

app.post('/admins', authenticateAdmin, async (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ message: 'Informe e-mail e senha.' });
  }

  try {
    const userRecord = await admin.auth().createUser({
      email,
      password,
      emailVerified: false,
      disabled: false
    });

    return res.status(201).json({
      message: 'Administrador criado com sucesso.',
      admin: { uid: userRecord.uid, email: userRecord.email }
    });
  } catch (error) {
    console.error('POST /admins error:', error);
    return res.status(500).json({ message: 'Erro ao criar administrador.' });
  }
});

app.delete('/admins/:uid', authenticateAdmin, async (req, res) => {
  const { uid } = req.params;

  if (!uid) {
    return res.status(400).json({ message: 'UID não informado.' });
  }

  try {
    await admin.auth().deleteUser(uid);
    return res.json({ message: 'Administrador removido com sucesso.' });
  } catch (error) {
    console.error('DELETE /admins/:uid error:', error);
    return res.status(500).json({ message: 'Erro ao remover administrador.' });
  }
});

app.listen(port, () => {
  console.log(`Admin API executando na porta ${port}`);
});
