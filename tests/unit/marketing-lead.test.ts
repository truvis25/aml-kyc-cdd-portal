import { describe, expect, it } from 'vitest';
import { MarketingLeadSchema } from '@/lib/validations/marketingLead';
import { renderLeadNotificationEmail } from '@/modules/notifications/templates/lead-notification';

describe('MarketingLeadSchema', () => {
  it('accepts a minimal valid payload', () => {
    const parsed = MarketingLeadSchema.parse({
      name: '  Sara  ',
      email: 'SARA@example.com',
    });
    expect(parsed.name).toBe('Sara');
    expect(parsed.email).toBe('sara@example.com');
    expect(parsed.company).toBeUndefined();
  });

  it('rejects an invalid email', () => {
    const result = MarketingLeadSchema.safeParse({
      name: 'Sara',
      email: 'not-an-email',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const fields = result.error.issues.map((i) => i.path.join('.'));
      expect(fields).toContain('email');
    }
  });

  it('rejects empty name', () => {
    const result = MarketingLeadSchema.safeParse({ name: '', email: 'sara@example.com' });
    expect(result.success).toBe(false);
  });

  it('coerces empty optional strings to undefined', () => {
    const parsed = MarketingLeadSchema.parse({
      name: 'Sara',
      email: 'sara@example.com',
      company: '',
      role: '',
      message: '',
    });
    expect(parsed.company).toBeUndefined();
    expect(parsed.role).toBeUndefined();
    expect(parsed.message).toBeUndefined();
  });

  it('honeypot field rejects when populated with content', () => {
    const result = MarketingLeadSchema.safeParse({
      name: 'Sara',
      email: 'sara@example.com',
      website: 'http://spam.example',
    });
    expect(result.success).toBe(false);
  });

  it('vertical enum is validated', () => {
    expect(
      MarketingLeadSchema.safeParse({
        name: 'Sara',
        email: 'sara@example.com',
        vertical: 'something-else',
      }).success,
    ).toBe(false);

    expect(
      MarketingLeadSchema.parse({
        name: 'Sara',
        email: 'sara@example.com',
        vertical: 'fintech',
      }).vertical,
    ).toBe('fintech');
  });
});

describe('renderLeadNotificationEmail', () => {
  it('renders subject including company when present', () => {
    const out = renderLeadNotificationEmail({
      name: 'Sara',
      email: 'sara@acme.ae',
      company: 'Acme',
    });
    expect(out.subject).toContain('Sara');
    expect(out.subject).toContain('Acme');
    expect(out.text).toContain('sara@acme.ae');
  });

  it('escapes HTML in user-supplied fields', () => {
    const out = renderLeadNotificationEmail({
      name: '<script>alert(1)</script>',
      email: 'sara@acme.ae',
      message: 'Hello "world"',
    });
    expect(out.html).not.toContain('<script>alert(1)</script>');
    expect(out.html).toContain('&lt;script&gt;');
    expect(out.html).toContain('&quot;world&quot;');
  });

  it('omits sections that are not provided', () => {
    const out = renderLeadNotificationEmail({
      name: 'Sara',
      email: 'sara@acme.ae',
    });
    expect(out.html).not.toContain('Message');
    expect(out.text).not.toContain('Message:');
  });
});
