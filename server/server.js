/**
 * Task Board mock API.
 *
 * A deliberately tiny JSON server with zero npm dependencies — the point of
 * this bonus is to prove the app can talk to a real backend, not to showcase
 * a framework. It speaks exactly the contract `HttpTaskRepository` expects:
 *
 *   GET    /health
 *   GET    /tasks
 *   POST   /tasks                 { title, note? }
 *   PATCH  /tasks/:id             { title?, note?, completed? }
 *   DELETE /tasks/:id
 *   DELETE /tasks?filter=completed
 *
 * State is persisted to a JSON file so it survives container restarts when a
 * volume is mounted.
 */
const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');

const PORT = Number(process.env.PORT ?? 4000);
const DATA_FILE = process.env.DATA_FILE ?? path.join(__dirname, 'data', 'tasks.json');

const TITLE_MAX_LENGTH = 120;
const NOTE_MAX_LENGTH = 1000;

/** @type {Array<object>} */
let tasks = [];
/** Serialises writes so concurrent requests cannot clobber the file. */
let writeQueue = Promise.resolve();

const collapseWhitespace = value => String(value ?? '').replace(/\s+/g, ' ').trim();

const normaliseNote = note => {
  if (note === null || note === undefined) {
    return null;
  }
  const trimmed = String(note).trim();
  return trimmed.length === 0 ? null : trimmed;
};

const createId = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;

const load = async () => {
  try {
    const raw = await fs.readFile(DATA_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    tasks = Array.isArray(parsed) ? parsed : (parsed.tasks ?? []);
  } catch {
    tasks = [];
  }
};

const persist = () => {
  writeQueue = writeQueue
    .then(async () => {
      await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
      await fs.writeFile(DATA_FILE, JSON.stringify({ version: 1, tasks }, null, 2));
    })
    .catch(error => {
      console.error('[api] failed to persist:', error.message);
    });
  return writeQueue;
};

const send = (res, status, body) => {
  const payload = body === undefined ? '' : JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(payload),
    // The desktop build runs from a different origin (or from file://
    // when packaged), so the API has to opt in explicitly.
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(payload);
};

const readJsonBody = req =>
  new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;

    req.on('data', chunk => {
      size += chunk.length;
      if (size > 1_000_000) {
        reject(new Error('Payload too large'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });

    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8');
      if (raw.length === 0) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(new Error('Body is not valid JSON'));
      }
    });

    req.on('error', reject);
  });

/** @returns {string | null} an error message, or null when valid. */
const validate = ({ title, note }) => {
  if (title !== undefined) {
    if (title.length === 0) {
      return 'A task needs a title.';
    }
    if (title.length > TITLE_MAX_LENGTH) {
      return `Keep the title under ${TITLE_MAX_LENGTH} characters.`;
    }
  }
  if (note != null && note.length > NOTE_MAX_LENGTH) {
    return `Keep the note under ${NOTE_MAX_LENGTH} characters.`;
  }
  return null;
};

const routes = {
  async listTasks(_req, res) {
    send(res, 200, tasks);
  },

  async createTask(req, res) {
    const body = await readJsonBody(req);
    const title = collapseWhitespace(body.title);
    const note = normaliseNote(body.note);

    const invalid = validate({ title, note });
    if (invalid) {
      send(res, 422, { error: invalid });
      return;
    }

    const now = Date.now();
    const task = {
      id: createId(),
      title,
      note,
      completed: false,
      createdAt: now,
      updatedAt: now,
      completedAt: null,
    };

    tasks.push(task);
    await persist();
    send(res, 201, task);
  },

  async updateTask(req, res, id) {
    const index = tasks.findIndex(task => task.id === id);
    if (index === -1) {
      send(res, 404, { error: `No task with id "${id}".` });
      return;
    }

    const body = await readJsonBody(req);
    const current = tasks[index];

    const title =
      body.title === undefined ? current.title : collapseWhitespace(body.title);
    const note = body.note === undefined ? current.note : normaliseNote(body.note);
    const completed =
      body.completed === undefined ? current.completed : Boolean(body.completed);

    const invalid = validate({ title, note });
    if (invalid) {
      send(res, 422, { error: invalid });
      return;
    }

    const now = Date.now();
    const updated = {
      ...current,
      title,
      note,
      completed,
      updatedAt: now,
      completedAt: completed ? (current.completedAt ?? now) : null,
    };

    tasks[index] = updated;
    await persist();
    send(res, 200, updated);
  },

  async deleteTask(_req, res, id) {
    const index = tasks.findIndex(task => task.id === id);
    if (index === -1) {
      send(res, 404, { error: `No task with id "${id}".` });
      return;
    }

    tasks.splice(index, 1);
    await persist();
    send(res, 204);
  },

  async deleteCompleted(_req, res) {
    const removed = tasks.filter(task => task.completed).map(task => task.id);
    tasks = tasks.filter(task => !task.completed);
    await persist();
    send(res, 200, { removed });
  },
};

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`);
  const segments = url.pathname.split('/').filter(Boolean);

  try {
    if (req.method === 'OPTIONS') {
      send(res, 204);
      return;
    }

    if (req.method === 'GET' && url.pathname === '/health') {
      send(res, 200, { status: 'ok', tasks: tasks.length });
      return;
    }

    if (segments[0] !== 'tasks') {
      send(res, 404, { error: 'Not found' });
      return;
    }

    const id = segments[1];

    if (req.method === 'GET' && !id) {
      await routes.listTasks(req, res);
    } else if (req.method === 'POST' && !id) {
      await routes.createTask(req, res);
    } else if (req.method === 'PATCH' && id) {
      await routes.updateTask(req, res, decodeURIComponent(id));
    } else if (req.method === 'DELETE' && id) {
      await routes.deleteTask(req, res, decodeURIComponent(id));
    } else if (req.method === 'DELETE' && !id && url.searchParams.get('filter') === 'completed') {
      await routes.deleteCompleted(req, res);
    } else {
      send(res, 405, { error: `${req.method} ${url.pathname} is not supported.` });
    }
  } catch (error) {
    send(res, 400, { error: error.message ?? 'Bad request' });
  }
});

load().then(() => {
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[api] Task Board API listening on http://localhost:${PORT}`);
    console.log(`[api] persisting to ${DATA_FILE} (${tasks.length} task(s) loaded)`);
  });
});

const shutdown = () => {
  console.log('[api] shutting down');
  server.close(() => process.exit(0));
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
