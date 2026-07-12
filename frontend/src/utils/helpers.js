export function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

export function parseJwt(token) {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => `%${(`00${c.charCodeAt(0).toString(16)}`).slice(-2)}`)
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export function normalizeProduct(p) {
  return {
    id: p.id ?? p.ID,
    name: p.name ?? p.Name ?? "",
    description: p.description ?? p.Description ?? "",
    category: p.category ?? p.Category ?? "general",
    price: p.price ?? p.Price ?? 0,
    stock: p.stock ?? p.Stock ?? 0,
    is_featured: p.is_featured ?? p.IsFeatured ?? false,
    images: (p.images ?? p.Images ?? []).map((img) => ({
      id: img.id ?? img.ID,
      product_id: img.product_id ?? img.ProductID,
      image_url: img.image_url ?? img.ImageURL ?? "",
      is_primary: img.is_primary ?? img.IsPrimary ?? false,
    })),
    rating: p.rating ?? p.Rating ?? 0,
    review_count: p.review_count ?? p.ReviewCount ?? 0,
  };
}

export function normalizeCart(data) {
  const items = data?.items ?? data?.Items ?? [];
  return {
    id: data?.id ?? data?.ID,
    user_id: data?.user_id ?? data?.UserID,
    items: items.map((item) => ({
      id: item.id ?? item.ID,
      cart_id: item.cart_id ?? item.CartID,
      product_id: item.product_id ?? item.ProductID,
      quantity: item.quantity ?? item.Quantity ?? 0,
    })),
  };
}
