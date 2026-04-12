

# 🏗️ 1. Project Structure (Monorepo style)

Using **NestJS + Next.js**

```id="p1"
apps/
  api/                 # NestJS backend
    src/
      modules/
        auth/
        users/
        products/
        categories/
        cart/
        orders/
        payments/
      common/
        guards/
        interceptors/
        filters/

  web/                 # Next.js frontend
    app/
      (shop)/
      (admin)/

libs/
  shared/
    types/
    constants/
```

---

# 🧩 Example: NestJS Module Structure

```id="p2"
modules/products/
  products.module.ts
  products.controller.ts
  products.service.ts
  products.repository.ts
  dto/
    create-product.dto.ts
  entities/
    product.entity.ts
```

👉 Repeat this for each module (orders, users, etc.)

---