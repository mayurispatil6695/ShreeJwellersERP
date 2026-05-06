-- 1. Revoke SELECT on password_hash from authenticated role
REVOKE SELECT (password_hash) ON public.employees FROM authenticated;

-- 2. Restrict customers SELECT to admins only
DROP POLICY IF EXISTS "Users can view customers" ON public.customers;

-- 3. Restrict campaigns SELECT to admins only  
DROP POLICY IF EXISTS "Users can view campaigns" ON public.campaigns;

-- 4. Ensure the admin ALL policy on user_roles has proper WITH CHECK
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
CREATE POLICY "Admins can manage roles"
ON public.user_roles
FOR ALL
TO public
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));