import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CreditCard, Crown, Check, Zap, Star, Building2, ExternalLink, Receipt } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';

interface Plan {
  id: string;
  name: string;
  price: number;
  currency: string;
  interval: 'month' | 'year';
  features: string[];
  popular?: boolean;
  icon: React.ReactNode;
}

const PLANS: Plan[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: 0,
    currency: 'INR',
    interval: 'month',
    features: [
      'Basic POS features',
      '1 User',
      'Up to 100 products',
      'Email support',
    ],
    icon: <Zap className="w-5 h-5" />,
  },
  {
    id: 'professional',
    name: 'Professional',
    price: 1999,
    currency: 'INR',
    interval: 'month',
    features: [
      'All Starter features',
      'Up to 5 Users',
      'Unlimited products',
      'Inventory management',
      'Customer CRM',
      'Priority support',
    ],
    popular: true,
    icon: <Star className="w-5 h-5" />,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 4999,
    currency: 'INR',
    interval: 'month',
    features: [
      'All Professional features',
      'Unlimited Users',
      'Multi-branch support',
      'Advanced analytics',
      'API access',
      'Custom integrations',
      '24/7 phone support',
    ],
    icon: <Building2 className="w-5 h-5" />,
  },
];

interface BillingHistory {
  id: string;
  date: string;
  amount: number;
  status: 'paid' | 'pending' | 'failed';
  invoice: string;
}

// Mock billing history
const MOCK_BILLING_HISTORY: BillingHistory[] = [
  { id: '1', date: '2026-01-15', amount: 1999, status: 'paid', invoice: 'INV-2026-001' },
  { id: '2', date: '2025-12-15', amount: 1999, status: 'paid', invoice: 'INV-2025-012' },
  { id: '3', date: '2025-11-15', amount: 1999, status: 'paid', invoice: 'INV-2025-011' },
];

export function BillingPlansSettings() {
  const { user } = useAuth();
  const { isAdmin } = useUserRole();
  const [currentPlan] = useState('professional');
  const [loading, setLoading] = useState<string | null>(null);

  const handleUpgrade = async (planId: string) => {
    setLoading(planId);
    // TODO: Integrate with Stripe/Razorpay
    setTimeout(() => {
      setLoading(null);
    }, 1000);
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadge = (status: 'paid' | 'pending' | 'failed') => {
    const variants = {
      paid: 'default',
      pending: 'secondary',
      failed: 'destructive',
    } as const;
    return <Badge variant={variants[status]}>{status.charAt(0).toUpperCase() + status.slice(1)}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Current Plan */}
      <Card variant="elevated">
        <CardHeader className="pb-3 sm:pb-4">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            Billing & Plans
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Manage your subscription and billing details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Subscription */}
          <div className="p-4 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg border border-primary/20">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/20 rounded-lg">
                  <Crown className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Professional Plan</p>
                  <p className="text-xs text-muted-foreground">Renews on February 15, 2026</p>
                </div>
              </div>
              <Badge variant="default" className="bg-primary">Active</Badge>
            </div>
          </div>

          {/* Available Plans */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {PLANS.map((plan) => (
              <div
                key={plan.id}
                className={`relative p-4 rounded-lg border-2 transition-all ${
                  currentPlan === plan.id
                    ? 'border-primary bg-primary/5'
                    : plan.popular
                    ? 'border-primary/50'
                    : 'border-border'
                }`}
              >
                {plan.popular && (
                  <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 bg-primary">
                    Most Popular
                  </Badge>
                )}
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-1.5 bg-muted rounded-md">{plan.icon}</div>
                  <h4 className="font-semibold text-sm">{plan.name}</h4>
                </div>
                <div className="mb-3">
                  <span className="text-2xl font-bold">
                    {plan.price === 0 ? 'Free' : formatCurrency(plan.price, plan.currency)}
                  </span>
                  {plan.price > 0 && (
                    <span className="text-xs text-muted-foreground">/{plan.interval}</span>
                  )}
                </div>
                <ul className="space-y-2 mb-4">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2 text-xs">
                      <Check className="w-3 h-3 text-primary shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  variant={currentPlan === plan.id ? 'outline' : plan.popular ? 'gold' : 'outline'}
                  size="sm"
                  className="w-full"
                  disabled={currentPlan === plan.id || !!loading}
                  onClick={() => handleUpgrade(plan.id)}
                >
                  {currentPlan === plan.id
                    ? 'Current Plan'
                    : loading === plan.id
                    ? 'Processing...'
                    : 'Select Plan'}
                </Button>
              </div>
            ))}
          </div>

          <Separator />

          {/* Billing History */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-sm flex items-center gap-2">
                <Receipt className="w-4 h-4" />
                Billing History
              </h4>
              <Button variant="ghost" size="sm" className="text-xs">
                View All <ExternalLink className="w-3 h-3 ml-1" />
              </Button>
            </div>
            <div className="space-y-2">
              {MOCK_BILLING_HISTORY.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="text-sm font-medium">{item.invoice}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(item.date).toLocaleDateString('en-IN', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-sm">
                      {formatCurrency(item.amount, 'INR')}
                    </span>
                    {getStatusBadge(item.status)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Payment Method */}
          <div className="space-y-4">
            <h4 className="font-semibold text-sm">Payment Method</h4>
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-background rounded-md">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-medium">•••• •••• •••• 4242</p>
                  <p className="text-xs text-muted-foreground">Expires 12/27</p>
                </div>
              </div>
              <Button variant="outline" size="sm">
                Update
              </Button>
            </div>
          </div>

          {/* Cancel Subscription */}
          {isAdmin && (
            <>
              <Separator />
              <div className="flex items-center justify-between p-4 border border-destructive/30 rounded-lg bg-destructive/5">
                <div>
                  <p className="font-medium text-sm">Cancel Subscription</p>
                  <p className="text-xs text-muted-foreground">
                    Cancel your subscription and lose access to premium features
                  </p>
                </div>
                <Button variant="destructive" size="sm">
                  Cancel Plan
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
