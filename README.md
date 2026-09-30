# MarketPam — Plateforme E-Commerce Complète

MarketPam est une application e-commerce haut de gamme construite avec **Next.js 16 (React 19)**, **TypeScript**, **PostgreSQL** et **Drizzle ORM**.

---

## 🌟 Fonctionnalités Principales

### 1. Système de Comptes Clients & Sécurité
- **Inscription & Connexion** : Inscription sécurisée (prénom, nom, email, mot de passe).
- **Hashage des mots de passe** : Hashage cryptographique via `bcryptjs` (10 tours de salage).
- **Gestion des sessions** : Tokens aléatoires cryptographiques de 64 caractères stockés en base (`sessions`) et transmis par cookie HTTP-only sécurisé (`marketpam_session`).
- **Réinitialisation de mot de passe** : Flux sécurisé avec génération de jetons d'expiration (1 heure) et page dédiée `/reset-password`.
- **Protection des données** : Les mots de passe et jetons ne sont jamais renvoyés dans les réponses API.

### 2. Restriction d'Achat & Sauvegarde du Panier
- **Catalogue ouvert** : Consultation libre de tous les produits et collections sans restriction.
- **Obligation de connexion** : Connexion requise pour ajouter un produit au panier, acheter immédiatement ou commander.
- **Modale d'invitation fluide** : Si un visiteur non connecté tente d'ajouter au panier, une modale l'invite à se connecter sans quitter sa page ni perdre son choix.
- **Persistance & Synchronisation** : Panier préservé localement et synchronisé en base de données dès la connexion.
- **Intégrité des commandes** : L'API `/api/orders` rejette toute tentative de commande non authentifiée (HTTP 401).

### 3. Espace Client (`/account`)
- **Mes Commandes** : Historique complet des commandes avec statuts colorés, articles et prix.
- **Détail & Suivi** : Visualisation détaillée de chaque commande avec transporteur, délai estimé et adresse.
- **Récapitulatif imprimable** : Génération et impression du reçu / facture d'achat en un clic.
- **Informations personnelles** : Modification du prénom, du nom et de l'e-mail.
- **Gestion des adresses** : Ajout, modification, suppression et sélection de l'adresse de livraison par défaut.
- **Sécurité** : Modification du mot de passe avec contrôle de l'ancien mot de passe.
- **Déconnexion sécurisée** : Révocation immédiate de la session.

### 4. Suivi des Commandes en Temps Réel (`OrderTracker`)
- **Stepper visuel 5 étapes** :
  1. *Confirmée* (validée en base)
  2. *Préparée* (emballée en entrepôt)
  3. *Expédiée* (confiée au transporteur)
  4. *En livraison* (en tournée locale)
  5. *Livrée* (remise au destinataire)
- **Transporteur & Numéro de suivi** : Intégration de DHL Express, Chronopost, FedEx, UPS, Colissimo avec lien direct de suivi.
- **Date d'arrivée estimée (ETA)** : Calcul dynamique du délai restant (*"Livraison prévue demain"*, *"Dans 2 jours"*, etc.).
- **Dernière mise à jour** : Horodatage et message d'avancement personnalisable.

### 5. Espace d'Administration Protégé (`/admin`)
- **Accès restreint** : Accessible uniquement aux utilisateurs disposant du rôle `admin`.
- **Tableau de bord (Overview)** : Chiffre d'affaires global, nombre de commandes, total des clients inscrits, alertes stocks bas.
- **Gestion des Commandes** :
  - Filtres par statut et recherche instantanée.
  - Modification du statut de commande.
  - Mise à jour du transporteur, du numéro de suivi, du lien de tracking et de la date estimée de livraison.
- **Gestion du Catalogue & Stocks** :
  - Liste de tous les produits avec niveaux de stocks.
  - Ajout de nouveaux produits avec catégorie, prix, stock, images et badge "Featured".
  - Modification rapide des prix et des stocks.
  - Suppression de produits.
- **Gestion des Clients & Rôles** :
  - Consultation de tous les clients avec total dépensé et commandes passées.
  - Promotion ou rétrogradation de rôles (`customer` ↔ `admin`).

---

## 🛠️ Installation & Démarrage

### 1. Cloner et installer les dépendances
```bash
npm install
```

### 2. Configuration des Variables d'Environnement
Créez ou modifiez le fichier `.env.local` à la racine :
```env
DATABASE_URL="postgresql://postgres:votre_mot_de_passe@127.0.0.1:5432/app_db"
INITIAL_ADMIN_EMAIL="admin@marketpam.com"
INITIAL_ADMIN_PASSWORD="MarketPam2026!"
MONCASH_CLIENT_ID="votre_client_id"
MONCASH_CLIENT_SECRET="votre_client_secret"
MONCASH_MODE="sandbox"
MONCASH_USD_TO_HTG_RATE="votre_taux_HTG_par_USD"
```

Le checkout MonCash convertit le total USD en HTG à partir du taux marchand configuré. Appliquez également la migration `0004_moncash_payments`, puis enregistrez `https://votre-domaine-public/api/moncash/return` comme URL de retour dans le portail marchand MonCash. Testez d'abord avec les identifiants sandbox; passez `MONCASH_MODE` à `production` seulement après validation Digicel.

### 3. Exécuter les Migrations
Appliquez les migrations Drizzle sur la base PostgreSQL (préserve l'intégralité des 24 produits existants) :
```bash
npm run db:migrate
```

### 4. Créer le Compte Administrateur Initial
Générez le premier compte administrateur :
```bash
npm run db:seed-admin
```
> **Identifiants de test administrateur :**
> - **Email :** `admin@marketpam.com`
> - **Mot de passe :** `MarketPam2026!`
> - **URL d'accès :** `http://localhost:3000/admin`

### 5. Lancer le serveur de développement
```bash
npm run dev
```
Ouvrez [http://localhost:3000](http://localhost:3000) dans votre navigateur.

---

## 🧪 Tests & Validation Automatisée

Une suite de tests automatisés vérifie tous les aspects de sécurité et de logique métier :
```bash
npm run test:backend
```

**Points validés par la suite de tests :**
- Hashage `bcryptjs` et résistance aux attaques.
- Inscription et persistance des utilisateurs.
- Création, validation et révocation des sessions cryptographiques.
- Restriction formelle de commande aux seuls clients connectés.
- Association stricte de chaque commande avec son `userId`.
- Initialisation du suivi logistique (`shipment_tracking`).
- Isolation stricte des commandes (un client ne voit que ses commandes).
- Droits et actions de mise à jour de l'administrateur.

---

## 📡 Routes API Backend

### Authentification
| Méthode | Route | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Inscription d'un nouveau client |
| `POST` | `/api/auth/login` | Connexion et initialisation de session |
| `POST` | `/api/auth/logout` | Déconnexion et révocation de session |
| `GET` | `/api/auth/me` | Profil utilisateur connecté et adresse par défaut |
| `POST` | `/api/auth/forgot-password` | Demande de réinitialisation de mot de passe |
| `POST` | `/api/auth/reset-password` | Définition du nouveau mot de passe avec token |

### Espace Client & Panier
| Méthode | Route | Description |
|---|---|---|
| `GET` / `PUT` | `/api/user/profile` | Consultation et modification du profil |
| `PUT` | `/api/user/password` | Modification du mot de passe |
| `GET` / `POST` | `/api/user/addresses` | Consultation et ajout d'adresses |
| `PUT` / `DELETE` | `/api/user/addresses/[id]` | Modification et suppression d'une adresse |
| `GET` | `/api/user/orders` | Historique des commandes du client connecté |
| `GET` / `POST` / `DELETE` | `/api/cart` | Synchronisation et gestion du panier en base |

### Commandes & Suivi
| Méthode | Route | Description |
|---|---|---|
| `POST` | `/api/orders` | Création de commande sécurisée (auth requise) |
| `GET` | `/api/orders/[orderNumber]` | Détail de commande (propriétaire ou admin) |
| `GET` | `/api/orders/[orderNumber]/tracking` | Données de suivi en direct et étapes |

### Administration
| Méthode | Route | Description |
|---|---|---|
| `GET` | `/api/admin/overview` | Statistiques globales (ventes, stocks bas, etc.) |
| `GET` | `/api/admin/orders` | Liste globale de toutes les commandes |
| `PUT` | `/api/admin/orders/[orderNumber]` | Mise à jour statut, transporteur, tracking et ETA |
| `GET` / `POST` | `/api/admin/products` | Consultation et ajout de produits |
| `PUT` / `DELETE` | `/api/admin/products/[id]` | Modification et suppression d'un produit |
| `GET` | `/api/admin/users` | Liste de tous les clients et statistiques d'achat |
| `PUT` | `/api/admin/users/[id]` | Modification du rôle (`customer` / `admin`) |
