alter table public."ServiceRequest"
  add column if not exists admin_comment text;

alter table public."ServiceRequest"
  drop constraint if exists service_request_admin_comment_length;

alter table public."ServiceRequest"
  add constraint service_request_admin_comment_length
  check (admin_comment is null or char_length(admin_comment) <= 2000);
