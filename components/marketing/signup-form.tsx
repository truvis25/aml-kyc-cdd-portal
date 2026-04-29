'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function SignupForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    companyName: '',
    fullName: '',
    role: 'mlro' as const,
    vertical: 'dnfbp' as const,
    plan: 'starter' as const,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Get current URL for success/cancel redirects
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
      const successUrl = `${baseUrl}/signup/confirm`;
      const cancelUrl = `${baseUrl}/signup`;

      const res = await fetch('/api/signup/create-tenant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          successUrl,
          cancelUrl,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Signup failed');
      }

      const { paymentLinkUrl } = await res.json();

      // Redirect to Nomod payment link
      window.location.href = paymentLinkUrl;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      <div>
        <Label htmlFor="email" className="text-[13px] font-medium text-ink">
          Email
        </Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="you@company.com"
          required
          value={formData.email}
          onChange={handleChange}
          className="mt-1.5"
        />
      </div>

      <div>
        <Label htmlFor="fullName" className="text-[13px] font-medium text-ink">
          Full Name
        </Label>
        <Input
          id="fullName"
          name="fullName"
          type="text"
          placeholder="Jane Doe"
          required
          value={formData.fullName}
          onChange={handleChange}
          className="mt-1.5"
        />
      </div>

      <div>
        <Label htmlFor="companyName" className="text-[13px] font-medium text-ink">
          Company Name
        </Label>
        <Input
          id="companyName"
          name="companyName"
          type="text"
          placeholder="Acme Fintech"
          required
          value={formData.companyName}
          onChange={handleChange}
          className="mt-1.5"
        />
      </div>

      <div>
        <Label htmlFor="role" className="text-[13px] font-medium text-ink">
          Your Role
        </Label>
        <select
          id="role"
          name="role"
          value={formData.role}
          onChange={handleChange}
          className="mt-1.5 block w-full rounded-lg border border-line bg-paper px-3 py-2 text-[14px] text-ink focus:border-copper focus:outline-none"
        >
          <option value="mlro">MLRO</option>
          <option value="compliance_officer">Compliance Officer</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div>
        <Label htmlFor="vertical" className="text-[13px] font-medium text-ink">
          Your Vertical
        </Label>
        <select
          id="vertical"
          name="vertical"
          value={formData.vertical}
          onChange={handleChange}
          className="mt-1.5 block w-full rounded-lg border border-line bg-paper px-3 py-2 text-[14px] text-ink focus:border-copper focus:outline-none"
        >
          <option value="dnfbp">DNFBP (Real Estate, Gold, Law)</option>
          <option value="fintech">Fintech / EMI / PSP</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div>
        <Label htmlFor="plan" className="text-[13px] font-medium text-ink">
          Plan
        </Label>
        <select
          id="plan"
          name="plan"
          value={formData.plan}
          onChange={handleChange}
          className="mt-1.5 block w-full rounded-lg border border-line bg-paper px-3 py-2 text-[14px] text-ink focus:border-copper focus:outline-none"
        >
          <option value="starter">Starter — AED 1,500/month</option>
          <option value="growth">Growth — AED 5,000/month</option>
        </select>
      </div>

      <Button
        type="submit"
        disabled={isLoading}
        className="btn-primary w-full"
      >
        {isLoading ? 'Starting trial...' : 'Start 14-Day Trial'}
      </Button>

      <p className="text-center text-[12px] text-mute">
        You&apos;ll proceed to payment. 14 days free, then AED {formData.plan === 'starter' ? '1,500' : '5,000'}/month.
      </p>
    </form>
  );
}
