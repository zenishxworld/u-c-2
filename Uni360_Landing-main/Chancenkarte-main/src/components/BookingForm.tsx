import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { X, Loader2 } from 'lucide-react';
import { attachUserAndSchedule } from '@/lib/postgres';
import { initializeRazorpay } from '@/lib/razorpay';

interface BookingFormProps {
  onClose: () => void;
  isOpen: boolean;
  submissionId?: string | null;
}

export const BookingForm = ({ onClose, isOpen, submissionId }: BookingFormProps) => {
  const [formData, setFormData] = useState({ fullName: '', email: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      initializeRazorpay();
    }
  }, [isOpen]);

  const redirectToCalendly = (name: string, email: string) => {
    const calendlyUrl = new URL('https://calendly.com/uni360degreetech/30min');
    calendlyUrl.searchParams.set('name', name);
    calendlyUrl.searchParams.set('email', email);
    window.open(calendlyUrl.toString(), '_blank');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Save name + email to the existing submission row (if we have an ID)
      if (submissionId) {
        await attachUserAndSchedule(submissionId, {
          fullName: formData.fullName,
          email: formData.email,
        });
      }

      const razorpayKeyId = import.meta.env.VITE_RAZORPAY_KEY_ID;
      const razorpayAmount = import.meta.env.VITE_RAZORPAY_AMOUNT || '34900';

      if (!razorpayKeyId) {
        throw new Error('Razorpay Key ID not configured');
      }

      // Capture formData in closure so the handler always has fresh values
      const name = formData.fullName;
      const email = formData.email;

      // Use Razorpay directly with handler callback — this is the correct way
      // to guarantee the redirect fires only after a successful payment
      const options = {
        key: razorpayKeyId,
        amount: parseInt(razorpayAmount),
        currency: 'INR',
        name: 'Chancenkarte',
        description: 'Expert Consultation Call',
        prefill: {
          name,
          email,
        },
        theme: {
          color: '#D97706',
        },
        handler: function () {
          // ✅ This fires ONLY on successful payment
          redirectToCalendly(name, email);
          onClose();
        },
        modal: {
          ondismiss: function () {
            // User closed the Razorpay modal without paying
            setIsLoading(false);
            setError('Payment was cancelled. Please try again.');
          },
        },
      };

      // @ts-ignore — Razorpay is loaded via script tag
      const rzp = new window.Razorpay(options);

      rzp.on('payment.failed', function (response: any) {
        console.error('Payment failed:', response.error);
        setIsLoading(false);
        setError(response.error?.description || 'Payment failed. Please try again.');
      });

      rzp.open();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      console.error('Error:', err);
      setError(errorMessage);
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md bg-white rounded-xl shadow-2xl p-8 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Book a Call with Expert</h3>
          <p className="text-gray-600">
            Schedule a consultation with Akshar Tank to discuss your Germany journey
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="fullName" className="text-sm font-medium text-gray-700">
              Full Name
            </Label>
            <Input
              id="fullName"
              type="text"
              required
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              className="w-full"
              placeholder="Enter your full name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium text-gray-700">
              Email Address
            </Label>
            <Input
              id="email"
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full"
              placeholder="Enter your email address"
            />
          </div>

          {error && (
            <p className="text-sm text-red-500 text-center">{error}</p>
          )}

          <div className="space-y-4">
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary hover:bg-primary/90 text-white font-medium py-3"
            >
              {isLoading ? (
                <span className="flex items-center gap-2 justify-center">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing…
                </span>
              ) : (
                'Pay & Continue to Calendly'
              )}
            </Button>

            <p className="text-xs text-gray-500 text-center">
              We'll never spam you. Your info is safe.
            </p>
          </div>
        </form>
      </Card>
    </div>
  );
};