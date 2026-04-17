# API Documentation - Endpointuri Backend

## Autentificare (Auth)

### 1. Înregistrare utilizator
- **Metoda**: `POST`
- **URL**: `/api/auth/register`
- **Descriere**: Creează un cont nou pentru utilizator și trimite email de verificare
- **Autentificare**: ❌ Nu
- **Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "Password123",
    "fullName": "John Doe"
  }
  ```
- **Note**: Parola trebuie să conțină minim 8 caractere cu cel puțin o literă mică, o literă mare și o cifră

### 2. Verificare email
- **Metoda**: `GET`
- **URL**: `/api/auth/verify-email?token=<token>`
- **Descriere**: Verifică contul creat după ce utilizatorul dă click pe link-ul din email
- **Autentificare**: ❌ Nu
- **Răspuns**:
  ```json
  {
    "message": "Email verified successfully"
  }
  ```

### 3. Login
- **Metoda**: `POST`
- **URL**: `/api/auth/login`
- **Descriere**: Autentifică utilizatorul și returnează access token și refresh token
- **Autentificare**: ❌ Nu
- **Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "Password123"
  }
  ```
- **Note**: Utilizatorul nu poate face login înainte de verificarea email-ului
- **Răspuns**:
  ```json
  {
    "accessToken": "jwt_token",
    "refreshToken": "jwt_token",
    "user": { "id": 1, "email": "user@example.com", "fullName": "John Doe", "role": "USER" }
  }
  ```

### 4. Refresh Token
- **Metoda**: `POST`
- **URL**: `/api/auth/refresh`
- **Descriere**: Obține un nou access token folosind refresh token-ul
- **Autentificare**: ❌ Nu
- **Body**:
  ```json
  {
    "refreshToken": "jwt_refresh_token"
  }
  ```
- **Răspuns**:
  ```json
  {
    "accessToken": "new_jwt_token"
  }
  ```

### 5. Cerere reset parolă
- **Metoda**: `POST`
- **URL**: `/api/auth/request-reset`
- **Descriere**: Generează token de reset și trimite email pentru resetarea parolei
- **Autentificare**: ❌ Nu
- **Body**:
  ```json
  {
    "email": "user@example.com"
  }
  ```
- **Răspuns**:
  ```json
  {
    "message": "If email exists, reset token generated and sent"
  }
  ```

### 6. Reset parolă
- **Metoda**: `POST`
- **URL**: `/api/auth/reset-password`
- **Descriere**: Resetează parola folosind token-ul de reset
- **Autentificare**: ❌ Nu
- **Body**:
  ```json
  {
    "token": "hex_token",
    "newPassword": "NewPassword123"
  }
  ```

### 7. Obține profil
- **Metoda**: `GET`
- **URL**: `/api/auth/profile`
- **Descriere**: Returnează datele utilizatorului autentificat
- **Autentificare**: ✅ Da (Bearer Token)
- **Răspuns**:
  ```json
  {
    "user": { "id": 1, "email": "user@example.com", "fullName": "John Doe", "role": "USER", "createdAt": "2026-04-17..." }
  }
  ```

### 8. Actualizare profil
- **Metoda**: `PUT`
- **URL**: `/api/auth/profile`
- **Descriere**: Actualizează email și nume complet al utilizatorului
- **Autentificare**: ✅ Da (Bearer Token)
- **Body**:
  ```json
  {
    "email": "newemail@example.com",
    "fullName": "Jane Doe"
  }
  ```
- **Note**: Email-ul trebuie să fie unic

### 9. Schimbare parolă
- **Metoda**: `PUT`
- **URL**: `/api/auth/change-password`
- **Descriere**: Schimbă parola utilizatorului autentificat
- **Autentificare**: ✅ Da (Bearer Token)
- **Body**:
  ```json
  {
    "oldPassword": "Password123",
    "newPassword": "NewPassword456"
  }
  ```
- **Note**: Parola veche trebuie să fie corectă

---

## Produse (Products)

### 1. Obține lista de produse
- **Metoda**: `GET`
- **URL**: `/api/products`
- **Descriere**: Returnează lista de produse cu paginare, căutare și sortare
- **Autentificare**: ❌ Nu
- **Query Parameters**:
  - `page` (opțional): Pagina, implicit 1
  - `pageSize` (opțional): Produse pe pagină, implicit 12, maxim 50
  - `search` (opțional): Caută în nume și brand
  - `categoryId` (opțional): Filtrează după categorie
  - `sort` (opțional): `name_asc`, `name_desc`, `price_asc`, `price_desc`, `createdAt_desc` (implicit)
- **Exemplu**: `/api/products?page=1&pageSize=20&search=laptop&sort=price_asc`
- **Răspuns**:
  ```json
  {
    "data": [{ "id": 1, "name": "Product", "price": 99.99, "stock": 10, ... }],
    "pagination": { "page": 1, "pageSize": 20, "total": 100, "totalPages": 5 }
  }
  ```

### 2. Creează produs (ADMIN)
- **Metoda**: `POST`
- **URL**: `/api/products`
- **Descriere**: Adaugă un produs nou
- **Autentificare**: ✅ Da (Bearer Token - ADMIN)
- **Body**:
  ```json
  {
    "categoryId": 1,
    "name": "Laptop",
    "slug": "laptop-asus",
    "description": "Performant laptop",
    "price": 1299.99,
    "stock": 5,
    "imageUrl": "https://example.com/image.jpg",
    "brand": "ASUS"
  }
  ```
- **Note**: Slug trebuie să fie unic și doar litere mici, cifre, cratime

### 3. Actualizează produs (ADMIN)
- **Metoda**: `PUT`
- **URL**: `/api/products/:id`
- **Descriere**: Actualizează detaliile unui produs
- **Autentificare**: ✅ Da (Bearer Token - ADMIN)
- **Body**: Același ca la creație, dar toate câmpurile opționale
- **Exemplu**: `/api/products/1`

### 4. Șterge produs (ADMIN)
- **Metoda**: `DELETE`
- **URL**: `/api/products/:id`
- **Descriere**: Șterge un produs
- **Autentificare**: ✅ Da (Bearer Token - ADMIN)
- **Exemplu**: `/api/products/1`

---

## Categorii (Categories)

### 1. Obține lista de categorii
- **Metoda**: `GET`
- **URL**: `/api/categories`
- **Descriere**: Returnează toate categoriile
- **Autentificare**: ❌ Nu
- **Răspuns**:
  ```json
  {
    "data": [{ "id": 1, "name": "Laptopuri", "slug": "laptopuri" }, ...]
  }
  ```

### 2. Creează categorie (ADMIN)
- **Metoda**: `POST`
- **URL**: `/api/categories`
- **Descriere**: Adaugă o nouă categorie
- **Autentificare**: ✅ Da (Bearer Token - ADMIN)
- **Body**:
  ```json
  {
    "name": "Telefoane",
    "slug": "telefoane"
  }
  ```

### 3. Actualizează categorie (ADMIN)
- **Metoda**: `PUT`
- **URL**: `/api/categories/:id`
- **Descriere**: Actualizează o categorie
- **Autentificare**: ✅ Da (Bearer Token - ADMIN)
- **Body**: Același ca la creație, dar ambele câmpuri opționale

### 4. Șterge categorie (ADMIN)
- **Metoda**: `DELETE`
- **URL**: `/api/categories/:id`
- **Descriere**: Șterge o categorie
- **Autentificare**: ✅ Da (Bearer Token - ADMIN)
- **Note**: Nu se poate șterge o categorie care are produse

---

## Coș (Cart)

### 1. Obține coșul
- **Metoda**: `GET`
- **URL**: `/api/cart`
- **Descriere**: Returnează produsele din coșul utilizatorului
- **Autentificare**: ✅ Da (Bearer Token)
- **Răspuns**:
  ```json
  {
    "data": [{ "id": 1, "productId": 1, "quantity": 2, "product": { "id": 1, "name": "Laptop", "price": 1299.99 } }, ...]
  }
  ```

### 2. Adaugă produs în coș
- **Metoda**: `POST`
- **URL**: `/api/cart`
- **Descriere**: Adaugă un produs în coș (sau incrementează cantitatea dacă e deja acolo)
- **Autentificare**: ✅ Da (Bearer Token)
- **Body**:
  ```json
  {
    "productId": 1,
    "quantity": 2
  }
  ```
- **Note**: Cantitate maxim 99, se verifică stocul disponibil

### 3. Actualizează cantitate produs în coș
- **Metoda**: `PUT`
- **URL**: `/api/cart/:productId`
- **Descriere**: Schimbă cantitatea unui produs din coș
- **Autentificare**: ✅ Da (Bearer Token)
- **Body**:
  ```json
  {
    "quantity": 5
  }
  ```
- **Note**: Quantidade 0 șterge produsul din coș

### 4. Șterge produs din coș
- **Metoda**: `DELETE`
- **URL**: `/api/cart/:productId`
- **Descriere**: Șterge un produs din coș
- **Autentificare**: ✅ Da (Bearer Token)

---

## Comenzi (Orders)

### 1. Obține comenzi
- **Metoda**: `GET`
- **URL**: `/api/orders`
- **Descriere**: Returnează comenzile utilizatorului (user vede doar propriile, admin vede toate)
- **Autentificare**: ✅ Da (Bearer Token)
- **Query Parameters**:
  - `page` (opțional): Pagina comenzilor
  - `pageSize` (opțional): Comenzi pe pagină
- **Răspuns**:
  ```json
  {
    "data": [{ "id": 1, "userId": 1, "totalAmount": 2599.98, "status": "PENDING", "orderItems": [...] }, ...]
  }
  ```

### 2. Obține detalii comandă
- **Metoda**: `GET`
- **URL**: `/api/orders/:id`
- **Descriere**: Returnează detaliile unei comenzi specifice
- **Autentificare**: ✅ Da (Bearer Token)
- **Note**: User poate vedea doar propriile comenzi, admin toate

### 3. Creează comandă
- **Metoda**: `POST`
- **URL**: `/api/orders`
- **Descriere**: Creează o comandă din articolele din coș
- **Autentificare**: ✅ Da (Bearer Token)
- **Body**:
  ```json
  {
    "shippingAddress": "Str. Exemplu 123, Bucuresti"
  }
  ```
- **Note**: Adresa trebuie să aibă minim 10 caractere, coșul trebuie să nu fie gol

### 4. Actualizează status comandă (ADMIN)
- **Metoda**: `PUT`
- **URL**: `/api/orders/:id/status`
- **Descriere**: Schimbă statusul unei comenzi
- **Autentificare**: ✅ Da (Bearer Token - ADMIN)
- **Body**:
  ```json
  {
    "status": "SHIPPED"
  }
  ```
- **Valori status**: `PENDING`, `CONFIRMED`, `SHIPPED`, `DELIVERED`, `CANCELED`

---

## Utilizatori (Users) - ADMIN

### 1. Obține lista de utilizatori (ADMIN)
- **Metoda**: `GET`
- **URL**: `/api/users`
- **Descriere**: Returnează toți utilizatorii cu paginare
- **Autentificare**: ✅ Da (Bearer Token - ADMIN)
- **Query Parameters**:
  - `page` (opțional): Pagina, implicit 1
  - `pageSize` (opțional): Utilizatori pe pagină, implicit 12, maxim 50
- **Răspuns**:
  ```json
  {
    "data": [{ "id": 1, "email": "user@example.com", "fullName": "John Doe", "role": "USER", "createdAt": "2026-04-17..." }],
    "pagination": { "page": 1, "pageSize": 12, "total": 100, "totalPages": 9 }
  }
  ```

### 2. Schimbă rolul utilizatorului (ADMIN)
- **Metoda**: `PUT`
- **URL**: `/api/users/:id/role`
- **Descriere**: Schimbă rolul unui utilizator (USER ↔ ADMIN)
- **Autentificare**: ✅ Da (Bearer Token - ADMIN)
- **Body**:
  ```json
  {
    "role": "ADMIN"
  }
  ```

### 3. Șterge utilizator (ADMIN)
- **Metoda**: `DELETE`
- **URL**: `/api/users/:id`
- **Descriere**: Șterge un utilizator
- **Autentificare**: ✅ Da (Bearer Token - ADMIN)
- **Note**: Nu se poate șterge un utilizator care are comenzi active (non-CANCELED)

---

## Autentificare și Header-uri

### Bearer Token
Toate endpoint-urile ce necesită autentificare trebuie ca headerul `Authorization` să conțină token-ul JWT:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Access Token
- **Durată**: 15 minute
- **Obținut din**: `/api/auth/login` sau `/api/auth/refresh`

### Refresh Token
- **Durată**: 7 zile
- **Utilizare**: Se trece la `/api/auth/refresh` pentru a obține un nou access token

---

## Status Code-uri

- `200`: Cerere reușită
- `201`: Resursă creată cu succes
- `400`: Cerere invalidă (validare eșuată)
- `401`: Neautentificat sau token invalid
- `403`: Acces interzis (de exemplu, nu ești admin)
- `404`: Resursă nu găsită
- `409`: Conflict (de exemplu, email deja existent)
- `500`: Eroare server

---

## Exemplu de utilizare

### 1. Înregistrare și Login
```bash
# Înregistrare
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"Password123","fullName":"John Doe"}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"Password123"}'
```

### 2. Adăugare produs în coș (cu autentificare)
```bash
curl -X POST http://localhost:3000/api/cart \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"productId":1,"quantity":2}'
```

### 3. Creare comandă
```bash
curl -X POST http://localhost:3000/api/orders \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"shippingAddress":"Str. Exemplu 123, Bucuresti"}'
```

---
