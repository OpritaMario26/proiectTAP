## Plan: Magazin Online React Node Postgres

Aplicatia va fi proiectata ca un e-commerce de tip Altex, cu frontend React, backend Node.js si baza de date PostgreSQL. Recomand o livrare in 4-6 saptamani, cu arhitectura modulara si impartire pe 2 roluri: FE+DB si BE, plus puncte de sincronizare unde sarcinile pot fi redistribuite daca apar blocaje.

**Librarii recomandate (prima etapa)**
- Frontend React: react-router-dom, @reduxjs/toolkit, react-redux, axios, react-hook-form, zod, @hookform/resolvers, @tanstack/react-query, clsx
- UI/UX: Tailwind CSS (sau MUI), lucide-react, sonner (toast), swiper (optional pentru carusel)
- Backend Node.js: express, cors, helmet, morgan, cookie-parser, bcrypt, jsonwebtoken, express-rate-limit, zod
- Persistenta DB: prisma, @prisma/client, pg
- Tooling si calitate: typescript, tsx, nodemon, eslint, prettier, vitest (sau jest), supertest
- Testare FE (optional, recomandat): @testing-library/react, @testing-library/jest-dom

**Pași**
1. Faza 0 - Initializare proiect (saptamana 1): definire arhitectura, conventionare naming, setup repository, setup frontend/backend/database local. Aceasta faza blocheaza toate celelalte.
2. Faza 1 - Modelare date si autentificare (saptamana 1-2): proiectare schema SQL pentru USERS, PRODUCTS, CATEGORIES, ORDERS, ORDER_ITEMS, CART; migrari; seed minimal; endpoint-uri auth cu JWT + refresh token + reset parola. Pas dependent de 1.
3. Faza 2 - Catalog si produse (saptamana 2-3): endpoint-uri pentru categorii si produse (listare, filtrare, sortare, paginare), ecrane FE pentru home, categorii, lista produse, pagina detalii produs. Pas dependent de 2.
4. Faza 3 - Cos si comanda (saptamana 3-4): management CART, adaugare/eliminare produse, update cantitate, checkout simulat, creare ORDERS si ORDER_ITEMS, istoricul comenzilor. Pas dependent de 3.
5. Faza 4 - Admin minim (saptamana 4-5): CRUD produse/categorii, protectie rol admin, validari server-side, mesaje de eroare consistente. Pas dependent de 3, partial paralel cu 4.
6. Faza 5 - Testare, hardening, demo (saptamana 5-6): teste API pe fluxurile critice, teste FE pentru pagini de baza, verificare securitate minima (rate limit, validari, sanitizare), script demo final. Pas dependent de 4-5.

**Syllabus pe 2 persoane**
1. Persoana A (FE + DB):
- Setup React, rutare, state management, integrare API
- Implementare UI pentru catalog, produs, cos, checkout, profil comenzi
- Proiectare schema SQL si migrari Prisma pentru toate tabelele
- Seed date test si query-uri de verificare
- Teste FE de baza + testare manuala UX
2. Persoana B (BE/server):
- Setup Node.js + Express + middleware securitate
- Auth complet: register/login/refresh/reset parola
- API pentru categorii, produse, cos, comenzi, admin
- Reguli business: stoc, validari, pret total comanda, status comanda
- Teste API cu Supertest si documentare endpoint-uri
3. Zone de sincronizare (obligatorii):
- Contract API comun (request/response) inainte de implementarea FE extinsa
- Revizuire schema DB impreuna inainte de prima migrare
- Integrare finala pe fluxurile: login -> catalog -> cos -> checkout -> istoric comenzi
4. Plan de fallback daca impartirea se schimba:
- Varianta 1: fiecare ia vertical slices (feature end-to-end), ex: Auth + Profile, Catalog + Admin
- Varianta 2: sprint-uri alternative in care unul finalizeaza backend feature, celalalt integreaza imediat in frontend
- Varianta 3: ownership dual pe componente critice (Auth si Checkout) ca sa nu existe single point of failure

**Schema functionala minima (MVP)**
1. USERS: id, email, password_hash, full_name, role, created_at, updated_at
2. CATEGORIES: id, name, slug, created_at
3. PRODUCTS: id, category_id, name, slug, description, price, stock, image_url, brand, created_at, updated_at
4. CART: id, user_id, product_id, quantity, added_at
5. ORDERS: id, user_id, total_amount, status, shipping_address, created_at
6. ORDER_ITEMS: id, order_id, product_id, quantity, unit_price

**Verificare**
1. Ruleaza migrarile si verifica ca toate cele 6 tabele exista si relatiile FK sunt valide.
2. Valideaza fluxul complet utilizator: register, login, browse produse, adauga in cos, checkout simulat, vizualizare istoric comenzi.
3. Ruleaza testele API pentru auth, produse, cos si comenzi (happy path + erori).
4. Verifica autorizarea: endpoint-urile admin resping user normal.
5. Smoke test UI pe desktop si mobil pentru paginile critice.

**Decizii**
- Inclus in scope: JWT + refresh + reset parola, checkout simulat, rulare locala.
- Exclus din scope: plata reala, microservicii, deploy cloud obligatoriu.
- Baza de timp: 4-6 saptamani cu livrari incrementale.

**Further Considerations**
1. ORM recomandat: Prisma (mai rapid pentru proiect academic) versus Sequelize (mai flexibil SQL clasic). Recomand Prisma.
2. UI framework: Tailwind pentru viteza de livrare versus MUI pentru componente predefinite. Recomand Tailwind.
3. Strategia de colaborare git: trunk-based cu feature branches scurte si PR review reciproc minim 1 review per feature.
