# NFI REPORT

**La référence financière et économique au Niger**
Média en ligne couvrant l'économie africaine, les marchés UEMOA/BCEAO et l'actualité du Niger.

🌍 **Production** : [https://nfireport.com](https://nfireport.com)

---

## Stack technique

| Couche | Technologie |
|---|---|
| UI | React 18 + TypeScript + Tailwind CSS v4 |
| Routing | react-router 7 (Hash Router) |
| Auth | Clerk |
| Base de données | Supabase (PostgreSQL) |
| Emails | Resend (via Supabase Edge Function) |
| Analytics | PostHog |
| Monitoring | Sentry (CDN) |
| Build | Vite 6 |
| Package manager | pnpm 9 |

---

## Développement local

```bash
# 1. Cloner le dépôt
git clone https://github.com/VOTRE_USERNAME/nfi-report.git
cd nfi-report

# 2. Copier et remplir les variables d'environnement
cp .env.example .env.local
# → Éditez .env.local avec vos vraies clés

# 3. Installer les dépendances
pnpm install

# 4. Lancer le serveur de développement
pnpm dev
# → http://localhost:5173
```

---

## Déploiement sur GitHub Pages + nfireport.com

### Étape 1 — Configurer le dépôt GitHub

```bash
# Initialiser et pousser sur GitHub (première fois)
git init
git add .
git commit -m "feat: initial commit"
git branch -M main
git remote add origin https://github.com/VOTRE_USERNAME/VOTRE_REPO.git
git push -u origin main
```

### Étape 2 — Activer GitHub Pages

1. Aller dans **GitHub repo → Settings → Pages**
2. **Source** : `Deploy from a branch`
3. **Branch** : `gh-pages` / `/ (root)`
4. Cliquer **Save**

> La branche `gh-pages` est créée automatiquement par le workflow GitHub Actions lors du premier push sur `main`.

### Étape 3 — Configurer les secrets GitHub

Aller dans **GitHub repo → Settings → Secrets and variables → Actions → New repository secret** et ajouter :

| Secret | Valeur |
|---|---|
| `VITE_SUPABASE_URL` | `https://iklwebbglkldowxoikkg.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Votre clé anon JWT Supabase |
| `VITE_CLERK_PUBLISHABLE_KEY` | `pk_live_...` |
| `VITE_POSTHOG_KEY` | `phc_...` |
| `VITE_POSTHOG_HOST` | `https://eu.posthog.com` |

### Étape 4 — Configurer le DNS pour nfireport.com

Chez votre registrar/hébergeur DNS, ajoutez les enregistrements suivants :

#### Domaine apex (nfireport.com)

| Type | Nom | Valeur |
|---|---|---|
| `A` | `@` | `185.199.108.153` |
| `A` | `@` | `185.199.109.153` |
| `A` | `@` | `185.199.110.153` |
| `A` | `@` | `185.199.111.153` |

#### Sous-domaine www

| Type | Nom | Valeur |
|---|---|---|
| `CNAME` | `www` | `VOTRE_USERNAME.github.io` |

> ⏱️ La propagation DNS peut prendre entre 5 minutes et 48 heures selon votre registrar.

### Étape 5 — Activer HTTPS dans GitHub Pages

1. Aller dans **GitHub repo → Settings → Pages**
2. Une fois le DNS propagé, cocher **"Enforce HTTPS"**
3. GitHub génère automatiquement un certificat SSL via Let's Encrypt

### Étape 6 — Placer les assets Figma (logo, avatars)

Les images importées depuis Figma utilisent le schéma `figma:asset/HASH.png`.
Un plugin Vite custom les résout depuis `public/assets/figma/`.

```
public/
└── assets/
    └── figma/
        ├── a065fc2ae43244b653228f2295d7f31bb24a3fb7.png   ← Logo NFI REPORT
        └── 66e50a62702000f7e8b34cda9a4a1f13bc5306f7.png   ← Avatar rédaction
```

**Si les fichiers sont absents**, le build réussit quand même (PNG transparent en fallback) mais le logo ne s'affiche pas. Exportez-les depuis Figma ou remplacez-les par vos propres images.

---

## Workflow CI/CD

```
push sur main
     │
     ▼
GitHub Actions (.github/workflows/deploy.yml)
     │
     ├── pnpm install --frozen-lockfile
     ├── vite build  (avec secrets injectés)
     │
     └── Deploy vers branche gh-pages
              │
              ▼
        nfireport.com ✅
```

Le déploiement est aussi déclenchable manuellement :
**GitHub repo → Actions → "🚀 Deploy → nfireport.com" → Run workflow**

---

## Commandes utiles

```bash
pnpm dev          # Serveur de dev → localhost:5173
pnpm build        # Build de production → dist/
pnpm preview      # Preview du build → localhost:4173
```

---

## Variables d'environnement

Voir [`.env.example`](.env.example) pour la liste complète et la documentation.

> ⚠️ Ne jamais commiter `.env.local` — il est dans `.gitignore`.
