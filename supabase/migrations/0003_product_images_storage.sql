-- =============================================================================
-- Spark — bucket de imagens dos produtos
--
-- A aluna sobe foto no chat → /api/upload guarda em product-images/<user_id>/<file>
-- A URL pública volta pro chat e é referenciada em products.image_url.
-- =============================================================================

-- Cria o bucket público (URLs servidas direto). Privacidade vem das policies:
-- só dá pra escrever na sua própria pasta.
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do update set public = true;

-- Limpa policies antigas se existirem
drop policy if exists "product_images_owner_insert" on storage.objects;
drop policy if exists "product_images_owner_update" on storage.objects;
drop policy if exists "product_images_owner_delete" on storage.objects;
drop policy if exists "product_images_public_read" on storage.objects;

-- INSERT: só pode upar arquivos dentro de pasta com o próprio user_id
create policy "product_images_owner_insert" on storage.objects
  for insert with check (
    bucket_id = 'product-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- UPDATE / DELETE: idem, só o dono
create policy "product_images_owner_update" on storage.objects
  for update using (
    bucket_id = 'product-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "product_images_owner_delete" on storage.objects
  for delete using (
    bucket_id = 'product-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- SELECT: qualquer um lê (URLs públicas pro chat renderizar)
create policy "product_images_public_read" on storage.objects
  for select using (bucket_id = 'product-images');
