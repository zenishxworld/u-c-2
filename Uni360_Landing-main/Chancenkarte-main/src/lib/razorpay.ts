interface RazorpayOptions {
  key_id: string;
  amount: number; // in paise (e.g., 34900 for ₹349)
  currency: string;
  name: string;
  description: string;
  image?: string;
  prefill: {
    name: string;
    email: string;
  };
  theme: {
    color: string;
  };
}

export const initializeRazorpay = (): boolean => {
  const script = document.createElement('script');
  script.src = 'https://checkout.razorpay.com/v1/checkout.js';
  script.async = true;
  document.body.appendChild(script);
  return true;
};

export const openRazorpayPayment = (options: RazorpayOptions): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    if (!window.Razorpay) {
      reject(new Error('Razorpay SDK not loaded'));
      return;
    }

    const razorpayOptions = {
      key: options.key_id,
      amount: options.amount,
      currency: options.currency,
      name: options.name,
      description: options.description,
      image: options.image,
      prefill: {
        name: options.prefill.name,
        email: options.prefill.email,
        contact: '',
      },
      theme: {
        color: options.theme.color,
      },
      handler: function (response: { razorpay_payment_id: string }) {
        
        resolve(true);
      },
      modal: {
        ondismiss: function () {
          
          reject(new Error('Payment cancelled by user'));
        },
      },
    };

    const rzp = new window.Razorpay(razorpayOptions);
    rzp.open();
  });
};

declare global {
  interface Window {
    Razorpay: any;
  }
}
