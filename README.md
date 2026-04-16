# proiectTAP

Implementare initiala pentru proiectul de magazin online (React + Node.js + PostgreSQL).

## Ce este implementat acum

- Frontend React (Vite + TypeScript)
- Backend Node.js (Express + TypeScript)
- Schema Prisma pentru tabelele:
  - USERS
  - PRODUCTS
  - CATEGORIES
  - ORDERS
  - ORDER_ITEMS
  - CART
- Endpoint-uri de baza:
  - GET /api/health
  - GET /api/products
  - POST /api/auth/register
  - POST /api/auth/login
  - POST /api/auth/refresh
  - POST /api/auth/request-reset
  - POST /api/auth/reset-password
- Pagini FE MVP:
  - Home
  - Products
  - Login

## Setup local

1. Instaleaza PostgreSQL si creeaza o baza de date (ex: proiecttap).
2. Copiaza fisierul backend/.env.example in backend/.env.
3. Completeaza valorile din backend/.env.

## Comenzi utile

Din radacina proiectului:

```bash
npm run dev:backend
```

In alt terminal:

```bash
npm run dev:frontend
```

Pentru Prisma:

```bash
npm run db:generate
npm run db:migrate
npm run db:seed
```

Build proiect:

```bash
npm run build
```

## Urmatorii pasi recomandati

1. Implementare endpoint-uri pentru CART si ORDERS (checkout simulat)
2. Protectie rute admin si CRUD categorii/produse
3. Teste API (Supertest) pentru auth + products
4. Persistenta sesiunii in frontend
