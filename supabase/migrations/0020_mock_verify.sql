create or replace function mock_grant_verified(p_listing_id uuid)
returns void
language plpgsql security definer set search_path = public as $$
begin
  update listings set is_verified = true where id = p_listing_id;
end;
$$;
