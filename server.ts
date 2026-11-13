import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API route: fetch live commit patch/diff from GitHub for m91biology-dotcom/kernel_xiaomi_pipa_cos17
  app.get('/api/commit/:sha', async (req, res) => {
    const { sha } = req.params;
    const repo = req.query.repo === 'n0' ? 'n0_kernel_pipa' : 'kernel_xiaomi_pipa_cos17';
    if (!/^[a-f0-9]{7,40}$/i.test(sha)) {
      res.status(400).json({ error: 'Invalid commit SHA' });
      return;
    }
    try {
      const response = await fetch(
        `https://api.github.com/repos/m91biology-dotcom/${repo}/commits/${sha}`,
        {
          headers: {
            Accept: 'application/vnd.github.v3+json',
            'User-Agent': 'Pipa-Kernel-Studio',
          },
        }
      );
      if (!response.ok) {
        res.status(response.status).json({ error: `GitHub API returned ${response.status}` });
        return;
      }
      const data = await response.json();
      res.json({
        sha: data.sha,
        message: data.commit?.message || '',
        author: data.commit?.author?.name || '',
        date: data.commit?.author?.date || '',
        stats: data.stats || { additions: 0, deletions: 0, total: 0 },
        files: (data.files || []).map((f: any) => ({
          filename: f.filename,
          status: f.status,
          additions: f.additions,
          deletions: f.deletions,
          patch: f.patch || '',
        })),
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to fetch commit details' });
    }
  });

  // API route: download raw .patch from GitHub commit
  app.get('/api/patch/:sha', async (req, res) => {
    const { sha } = req.params;
    if (!/^[a-f0-9]{7,40}$/i.test(sha)) {
      res.status(400).send('Invalid SHA');
      return;
    }
    try {
      const response = await fetch(
        `https://github.com/m91biology-dotcom/kernel_xiaomi_pipa_cos17/commit/${sha}.patch`,
        {
          headers: { 'User-Agent': 'Pipa-Kernel-Studio' },
        }
      );
      if (!response.ok) {
        res.status(response.status).send(`Failed to fetch patch ${sha}`);
        return;
      }
      const text = await response.text();
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.send(text);
    } catch (error: any) {
      res.status(500).send(error.message || 'Error fetching patch');
    }
  });

  // API route: serve local scripts generated in the workspace
  app.get('/api/scripts/:name', (req, res) => {
    const allowed: Record<string, string[]> = {
      'port-cos17-to-n0kernel.sh': [path.join(__dirname, 'port-cos17-to-n0kernel.sh')],
      'build-n0kernel-cos17.yml': [
        path.join(__dirname, 'build-n0kernel-cos17.yml'),
        path.join(__dirname, '.github', 'workflows', 'build-n0kernel-cos17.yml'),
      ],
    };
    const candidates = allowed[req.params.name] || [];
    const target = candidates.find((p) => fs.existsSync(p));
    if (!target) {
      res.status(404).json({ error: 'Script not found' });
      return;
    }
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.send(fs.readFileSync(target, 'utf-8'));
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
