export interface ICategory {
  id: string;
  name: string;
  slug: string;
}

export interface ITag {
  id: string;
  name: string;
}

export interface IProductVariant {
  id: string;
  productId: string;
  sku: string;
  price: string | number; // Decimal comes out loosely based on serialization
  stock: number;
}

export interface IProductMedia {
  id: string;
  productId: string;
  url: string;
  altText: string | null;
  position: number;
}

export interface IProduct {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: string | number;
  stock: number;
  ratingAvg: string | number | null;
  ratingCount: number | null;
  categoryId: string | null;
  
  // Potential Included Relational Payloads
  category?: ICategory | null;
  variants?: IProductVariant[];
  media?: IProductMedia[];
  tags?: { tag: ITag }[];
}

export interface IProductListResponse {
  data: IProduct[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
