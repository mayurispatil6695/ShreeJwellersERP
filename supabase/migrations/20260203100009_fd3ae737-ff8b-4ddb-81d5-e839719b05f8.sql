-- Create employees table for admin-created employee accounts
CREATE TABLE public.employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  department TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

-- Only admins can manage employees
CREATE POLICY "Admins can view all employees"
ON public.employees FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can create employees"
ON public.employees FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update employees"
ON public.employees FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete employees"
ON public.employees FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Create trigger for updated_at
CREATE TRIGGER update_employees_updated_at
BEFORE UPDATE ON public.employees
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Create employee_sessions table for session management
CREATE TABLE public.employee_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE NOT NULL,
  session_token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS on sessions
ALTER TABLE public.employee_sessions ENABLE ROW LEVEL SECURITY;

-- No direct access - only via edge function with service role
CREATE POLICY "No direct access to sessions"
ON public.employee_sessions FOR ALL
USING (false);

-- Create index for faster lookups
CREATE INDEX idx_employees_employee_id ON public.employees(employee_id);
CREATE INDEX idx_employee_sessions_token ON public.employee_sessions(session_token);
CREATE INDEX idx_employee_sessions_expires ON public.employee_sessions(expires_at);