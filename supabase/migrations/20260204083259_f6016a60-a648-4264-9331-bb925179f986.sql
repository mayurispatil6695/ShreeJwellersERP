
-- Create products table for Inventory
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sku TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  metal_type TEXT NOT NULL,
  weight DECIMAL(10,2) NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0,
  unit_price DECIMAL(12,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'In Stock',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create customers table
CREATE TABLE public.customers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT NOT NULL,
  address TEXT,
  city TEXT,
  loyalty_points INTEGER DEFAULT 0,
  total_purchases DECIMAL(12,2) DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create sales table for POS
CREATE TABLE public.sales (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_number TEXT NOT NULL UNIQUE,
  customer_id UUID REFERENCES public.customers(id),
  customer_name TEXT,
  items JSONB NOT NULL DEFAULT '[]',
  subtotal DECIMAL(12,2) NOT NULL,
  tax DECIMAL(12,2) NOT NULL DEFAULT 0,
  discount DECIMAL(12,2) NOT NULL DEFAULT 0,
  total DECIMAL(12,2) NOT NULL,
  payment_method TEXT NOT NULL DEFAULT 'Cash',
  status TEXT NOT NULL DEFAULT 'Completed',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create investments table
CREATE TABLE public.investments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES public.customers(id),
  customer_name TEXT NOT NULL,
  metal_type TEXT NOT NULL,
  quantity TEXT NOT NULL,
  invested_amount DECIMAL(12,2) NOT NULL,
  current_value DECIMAL(12,2) NOT NULL,
  profit_percentage DECIMAL(5,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'Active',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create campaigns table for Marketing
CREATE TABLE public.campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Draft',
  sent_count INTEGER DEFAULT 0,
  opened_count INTEGER DEFAULT 0,
  converted_count INTEGER DEFAULT 0,
  scheduled_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

-- Products policies
CREATE POLICY "Admins can manage products" ON public.products FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can view products" ON public.products FOR SELECT USING (auth.uid() IS NOT NULL);

-- Customers policies
CREATE POLICY "Admins can manage customers" ON public.customers FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can view customers" ON public.customers FOR SELECT USING (auth.uid() IS NOT NULL);

-- Sales policies
CREATE POLICY "Admins can manage sales" ON public.sales FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can view sales" ON public.sales FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can create sales" ON public.sales FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Investments policies
CREATE POLICY "Admins can manage investments" ON public.investments FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can view investments" ON public.investments FOR SELECT USING (auth.uid() IS NOT NULL);

-- Campaigns policies
CREATE POLICY "Admins can manage campaigns" ON public.campaigns FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can view campaigns" ON public.campaigns FOR SELECT USING (auth.uid() IS NOT NULL);

-- Add triggers for updated_at
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER update_investments_updated_at BEFORE UPDATE ON public.investments FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON public.campaigns FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
