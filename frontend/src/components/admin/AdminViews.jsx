import React from "react";
import { Image as ImageIcon, Pencil, Search, SlidersHorizontal, Star, Trash2, ShieldCheck } from "lucide-react";
import { FILE_BASE } from "../../lib/api";
import { cn } from "../../utils/helpers";
import { Card } from "../common/UI";

export function AdminProductEditor({ form, setForm, editingId, onSubmit, onCancelEdit }) {
  return (
    <Card className="p-6">
      <h2 className="text-3xl font-black text-white">{editingId ? "Edit Product" : "Admin Console"}</h2>
      <p className="mt-2 text-slate-400">Creezi, actualizezi și adaugi mai multe imagini la produse.</p>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <input placeholder="Nume produs" value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} className="rounded-2xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-white outline-none" />
        <input placeholder="Categorie" value={form.category} onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))} className="rounded-2xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-white outline-none" />
        <input placeholder="Preț" type="number" value={form.price} onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value }))} className="rounded-2xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-white outline-none" />
        <input placeholder="Stoc" type="number" value={form.stock} onChange={(e) => setForm((prev) => ({ ...prev, stock: e.target.value }))} className="rounded-2xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-white outline-none" />
        <input type="file" accept="image/*" multiple onChange={(e) => setForm((prev) => ({ ...prev, images: Array.from(e.target.files || []) }))} className="rounded-2xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-white outline-none md:col-span-2" />
        <label className="flex items-center gap-3 rounded-2xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-white md:col-span-2">
          <input type="checkbox" checked={form.is_featured} onChange={(e) => setForm((prev) => ({ ...prev, is_featured: e.target.checked }))} /> Produs evidențiat
        </label>
        <textarea placeholder="Descriere" value={form.description} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} className="min-h-32 rounded-2xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-white outline-none md:col-span-2" />
      </div>

      {form.images?.length > 0 && <div className="mt-4 flex flex-wrap gap-3">{form.images.map((file, index) => <div key={index} className="rounded-2xl border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-300">{file.name}</div>)}</div>}

      <div className="mt-4 flex flex-wrap gap-3">
        <button onClick={onSubmit} className="rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 px-5 py-3 font-semibold text-white">{editingId ? "Update produs" : "Creează produs"}</button>
        {editingId && <button onClick={onCancelEdit} className="rounded-2xl border border-slate-700 bg-slate-800 px-5 py-3 font-semibold text-slate-200">Renunță</button>}
      </div>
    </Card>
  );
}

export function AdminProductsTable({ products, onEdit, onDelete, onDeleteImage, onSetPrimaryImage, onSetFeatured }) {
  return (
    <div className="space-y-4">
      {products.map((product) => {
        const primaryImage = product.images?.find((img) => img.is_primary) || product.images?.[0];
        return (
          <Card key={product.id} className="p-5">
            <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
              <div>
                <div className="overflow-hidden rounded-3xl bg-slate-950/40 aspect-[4/3]">
                  <img src={primaryImage?.image_url ? `${FILE_BASE}${primaryImage.image_url}` : "https://placehold.co/600x400?text=No+Image"} alt={product.name} className="w-full h-full object-contain p-4" />
                </div>
              </div>
              <div>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <div className="inline-flex rounded-full bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-300">{product.category}</div>
                      {product.is_featured && <div className="inline-flex rounded-full bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-200">Evidențiat</div>}
                    </div>
                    <h3 className="text-2xl font-bold text-white">{product.name}</h3>
                    <p className="mt-2 text-slate-400">{product.description}</p>
                    <div className="mt-3 text-lg font-semibold text-white">{product.price} RON</div>
                    <div className="mt-1 text-sm text-slate-400">Stock: {product.stock}</div>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <button onClick={() => onEdit(product)} className="flex items-center gap-2 rounded-2xl bg-blue-500/10 px-4 py-3 text-blue-300"><Pencil size={16} />Edit</button>
                    <button onClick={() => onSetFeatured(product.id, !product.is_featured)} className={cn("flex items-center gap-2 rounded-2xl px-4 py-3", product.is_featured ? "bg-amber-500/10 text-amber-200" : "bg-slate-800 text-slate-200")}><Star size={16} />{product.is_featured ? "Unfeature" : "Feature"}</button>
                    <button onClick={() => onDelete(product.id)} className="flex items-center gap-2 rounded-2xl bg-rose-500/10 px-4 py-3 text-rose-200"><Trash2 size={16} />Delete</button>
                  </div>
                </div>
                <div className="mt-5">
                  <div className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Images</div>
                  {product.images?.length ? <div className="flex flex-wrap gap-4">{product.images.map((img) => <div key={img.id} className="rounded-3xl border border-slate-700 bg-slate-950/50 p-3"><img src={`${FILE_BASE}${img.image_url}`} alt="product" className="h-24 w-24 rounded-2xl object-contain p-1 bg-slate-950/40" /><div className="mt-3 flex flex-col gap-2"><button onClick={() => onSetPrimaryImage(product.id, img.id)} className={cn("flex items-center justify-center gap-2 rounded-2xl px-3 py-2 text-xs font-medium", img.is_primary ? "bg-amber-500/10 text-amber-200" : "border border-slate-700 bg-slate-900 text-slate-300")}><Star size={14} />{img.is_primary ? "Primary" : "Set primary"}</button><button onClick={() => onDeleteImage(product.id, img.id)} className="rounded-2xl bg-rose-500/10 px-3 py-2 text-xs font-medium text-rose-200">Delete image</button></div></div>)}</div> : <div className="text-slate-400">No images</div>}
                </div>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

function AdminUsersPanel({ users, onPromoteUser, onDemoteUser, usersLoading, usersSearch, setUsersSearch, actingUserId }) {
  const filteredUsers = users.filter((user) => user.email?.toLowerCase().includes(usersSearch.toLowerCase()));
  return (
    <Card className="p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h3 className="text-2xl font-black text-white">User management</h3>
          <p className="mt-2 text-slate-400">Text view ca în exemplul tău: vezi utilizatorii și poți face pe cineva admin.</p>
        </div>
        <div className="flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-slate-300 shadow-sm md:min-w-[320px]">
          <Search size={18} />
          <input value={usersSearch} onChange={(e) => setUsersSearch(e.target.value)} placeholder="Caută utilizator după email" className="w-full bg-transparent outline-none placeholder:text-slate-500" />
        </div>
      </div>
      <div className="mt-5 overflow-x-auto rounded-3xl border border-slate-800">
        <table className="min-w-full text-left text-sm text-slate-300">
          <thead className="bg-slate-900/80 text-slate-400">
            <tr>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Auth</th>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user.id} className="border-t border-slate-800 bg-slate-950/40">
                <td className="px-4 py-3 font-medium text-white">{user.email}</td>
                <td className="px-4 py-3">{user.role}</td>
                <td className="px-4 py-3">{user.auth_provider || "local"}</td>
                <td className="px-4 py-3">{user.created_at ? new Date(user.created_at).toLocaleString() : "-"}</td>
                <td className="px-4 py-3">
                  {user.role === "admin" ? (
                    <button disabled={actingUserId === user.id} onClick={() => onDemoteUser(user.id)} className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-amber-200 disabled:opacity-50">Set as user</button>
                  ) : (
                    <button disabled={actingUserId === user.id} onClick={() => onPromoteUser(user.id)} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-3 py-2 font-medium text-white disabled:opacity-50"><ShieldCheck size={16} />Make admin</button>
                  )}
                </td>
              </tr>
            ))}
            {!usersLoading && filteredUsers.length === 0 && <tr><td colSpan="5" className="px-4 py-6 text-center text-slate-400">Nu există utilizatori pentru filtrul curent.</td></tr>}
            {usersLoading && <tr><td colSpan="5" className="px-4 py-6 text-center text-slate-400">Se încarcă utilizatorii...</td></tr>}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

export function AdminView({ products, form, setForm, editingId, onCreateProduct, onUpdateProduct, onStartEdit, onCancelEdit, onDeleteProduct, onDeleteImage, onSetPrimaryImage, onSetFeatured, adminSearch, setAdminSearch, adminSort, setAdminSort, users, onPromoteUser, onDemoteUser, usersLoading, usersSearch, setUsersSearch, actingUserId }) {
  const filteredAdminProducts = [...products].filter((product) => {
    const q = adminSearch.toLowerCase();
    return product.name.toLowerCase().includes(q) || product.category.toLowerCase().includes(q) || (product.description || "").toLowerCase().includes(q);
  }).sort((a, b) => {
    if (adminSort === "name") return a.name.localeCompare(b.name);
    if (adminSort === "stock") return b.stock - a.stock;
    if (adminSort === "price") return b.price - a.price;
    return 0;
  });

  return (
    <section className="space-y-6">
      <AdminUsersPanel users={users} onPromoteUser={onPromoteUser} onDemoteUser={onDemoteUser} usersLoading={usersLoading} usersSearch={usersSearch} setUsersSearch={setUsersSearch} actingUserId={actingUserId} />
      <AdminProductEditor form={form} setForm={setForm} editingId={editingId} onSubmit={editingId ? onUpdateProduct : onCreateProduct} onCancelEdit={onCancelEdit} />
      <Card className="p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-xl font-bold text-white">Caută în produse</h3>
            <p className="mt-1 text-sm text-slate-400">Caută rapid după nume, categorie sau descriere.</p>
          </div>
          <div className="flex flex-col gap-3 md:flex-row">
            <div className="flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-slate-300 shadow-sm md:min-w-[360px]"><Search size={18} /><input value={adminSearch} onChange={(e) => setAdminSearch(e.target.value)} placeholder="Ex: laptop, haine, mouse..." className="w-full bg-transparent outline-none placeholder:text-slate-500" /></div>
            <div className="flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-slate-300 shadow-sm"><SlidersHorizontal size={18} /><select value={adminSort} onChange={(e) => setAdminSort(e.target.value)} className="bg-transparent outline-none"><option value="name" className="bg-slate-900">Sort: Nume</option><option value="stock" className="bg-slate-900">Sort: Stock</option><option value="price" className="bg-slate-900">Sort: Preț</option></select></div>
          </div>
        </div>
      </Card>
      <AdminProductsTable products={filteredAdminProducts} onEdit={onStartEdit} onDelete={onDeleteProduct} onDeleteImage={onDeleteImage} onSetPrimaryImage={onSetPrimaryImage} onSetFeatured={onSetFeatured} />
    </section>
  );
}
