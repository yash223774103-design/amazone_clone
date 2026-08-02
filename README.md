# Amazon Clone Backend

A REST API backend for an Amazon-style e-commerce site, built with Node.js, Express, and MongoDB.

## Features

- **Auth**: register, login, JWT-based sessions, profile management
- **Products**: browse, search (by keyword), filter by category, pagination, reviews & ratings
- **Cart**: per-user persistent cart (add, update quantity, remove, clear)
- **Orders**: checkout from cart, stock validation & decrement, order history, status tracking
- **Admin**: product CRUD, view all orders, update order status (via `isAdmin` flag on User)

## Requirements

- Node.js 18+
- MongoDB (local install, or a free cluster from MongoDB Atlas)

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment variables:
   ```bash
   cp .env.example .env
   ```
   Then edit `.env`:
   - `MONGO_URI` — your MongoDB connection string
   - `JWT_SECRET` — any long random string (used to sign auth tokens)

3. (Optional) Seed the database with sample products:
   ```bash
   npm run seed
   ```

4. Start the server:
   ```bash
   npm run dev      # with nodemon (auto-restart)
   # or
   npm start        # plain node
   ```

   The API will run at `http://localhost:5000` by default.

## Making a user an admin

New users register as regular customers. To grant admin rights, update the user's
document directly in MongoDB and set `isAdmin: true`, e.g. via `mongosh`:
```js
db.users.updateOne({ email: "you@example.com" }, { $set: { isAdmin: true } })
```

## API Reference

### Auth — `/api/auth`
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/register` | Public | Create a new account |
| POST | `/login` | Public | Log in, returns a JWT |
| GET | `/profile` | Private | Get your own profile |
| PUT | `/profile` | Private | Update name/email/password |

### Products — `/api/products`
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/` | Public | List products. Query params: `keyword`, `category`, `pageNumber`, `pageSize` |
| GET | `/:id` | Public | Get a single product |
| POST | `/` | Admin | Create a product |
| PUT | `/:id` | Admin | Update a product |
| DELETE | `/:id` | Admin | Delete a product |
| POST | `/:id/reviews` | Private | Add a review `{ rating, comment }` |

### Cart — `/api/cart`
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/` | Private | Get your cart |
| POST | `/` | Private | Add item `{ productId, qty }` |
| PUT | `/:productId` | Private | Update item quantity `{ qty }` |
| DELETE | `/:productId` | Private | Remove one item |
| DELETE | `/` | Private | Clear the whole cart |

### Orders — `/api/orders`
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/` | Private | Checkout — creates order from current cart `{ shippingAddress, paymentMethod }` |
| GET | `/` | Admin | List all orders |
| GET | `/myorders` | Private | Your order history |
| GET | `/:id` | Private (owner/admin) | Get a single order |
| PUT | `/:id/status` | Admin | Update status `{ status }` (pending/processing/shipped/delivered/cancelled) |
| PUT | `/:id/pay` | Private | Mark an order as paid |

## Auth header format

For any private route, send the JWT from login/register as:
```
Authorization: Bearer <token>
```

## Project structure

```
amazon-clone-backend/
├── config/db.js            # MongoDB connection
├── models/                 # Mongoose schemas: User, Product, Cart, Order
├── controllers/             # Route logic
├── routes/                  # Express routers
├── middleware/               # auth (JWT) + centralized error handling
├── seed/seedProducts.js      # sample data loader
├── utils/generateToken.js
└── server.js                 # app entry point
```

## Notes / next steps

- Payment is currently just a flag (`isPaid`) toggled via `/api/orders/:id/pay` — plug in
  Stripe/Razorpay/etc. by calling that route from your webhook handler.
- Passwords are hashed with bcrypt; never stored in plaintext.
- Add a real image upload (e.g. multer + S3/Cloudinary) if you want product images beyond URLs.
