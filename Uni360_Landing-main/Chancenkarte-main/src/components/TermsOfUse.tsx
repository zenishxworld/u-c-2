import { ArrowLeft } from 'lucide-react';
import { useEffect } from 'react';

export const TermsOfUse = ({ onGoBack }: { onGoBack: () => void }) => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleGoBack = () => {
    if (onGoBack) {
      onGoBack();
    } else {
      window.history.back();
    }
  };

  return (
    <div className="min-h-screen bg-off-white">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <button 
            onClick={handleGoBack}
            className="flex items-center gap-2 text-gunmetal hover:text-tigers-eye transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <h1 className="text-2xl lg:text-6xl font-satoshi font-bold text-gunmetal mb-6">
              Terms of Use
            </h1>
            <p className="text-lg text-gunmetal/70 max-w-2xl mx-auto">
              Please read these terms carefully before using our website and services.
            </p>
          </div>

          {/* Content Card */}
          <div className="bg-white rounded-chancenkarte p-8 lg:p-12 shadow-sm">
            <div className="prose prose-lg max-w-none">
              
              {/* Introduction */}
              <div className="mb-8">
                <p className="text-sm text-gunmetal/80 leading-relaxed">
                  Welcome to Akshar Visa Immigration. By accessing and using our website, you agree to comply with and be bound by the following terms and conditions. If you do not agree with these terms, please refrain from using our website.
                </p>
              </div>

              {/* Acceptance of Terms */}
              <section className="mb-10">
                <h2 className="text-xl font-satoshi font-bold text-gunmetal mb-6">1. Acceptance of Terms</h2>
                <p className="text-sm text-gunmetal/80 leading-relaxed">
                  By accessing or using the Akshar Visa Immigration website ("the Site"), you acknowledge that you have read, understood, and agree to be bound by these Terms of Use. These terms may be updated from time to time, and your continued use of the Site constitutes acceptance of any changes.
                </p>
              </section>

              {/* Services Description */}
              <section className="mb-10">
                <h2 className="text-xl font-satoshi font-bold text-gunmetal mb-6">2. Services Description</h2>
                <p className="text-sm text-gunmetal/80 leading-relaxed">
                  Akshar Visa Immigration provides visa consulting services. The information on the Site is for general informational purposes only and does not constitute professional advice. We reserve the right to modify or discontinue any aspect of the services without notice.
                </p>
              </section>

              {/* User Responsibilities */}
              <section className="mb-10">
                <h2 className="text-xl font-satoshi font-bold text-gunmetal mb-6">3. User Responsibilities</h2>
                <div className="bg-off-white rounded-lg p-6">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-tigers-eye rounded-full mt-2 flex-shrink-0"></div>
                      <p className="text-sm text-gunmetal/80">You agree to provide accurate and complete information when using our services.</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-tigers-eye rounded-full mt-2 flex-shrink-0"></div>
                      <p className="text-sm text-gunmetal/80">You are responsible for maintaining the confidentiality of your account credentials.</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-tigers-eye rounded-full mt-2 flex-shrink-0"></div>
                      <p className="text-sm text-gunmetal/80">You must not engage in any activity that interferes with or disrupts the Site's functionality.</p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Intellectual Property */}
              <section className="mb-10">
                <h2 className="text-xl font-satoshi font-bold text-gunmetal mb-6">4. Intellectual Property</h2>
                <p className="text-sm text-gunmetal/80 leading-relaxed">
                  The content, trademarks, logos, and other materials on the Site are owned by Akshar Visa Immigration and protected by intellectual property laws. You may not reproduce, distribute, or display any portion of the Site without our prior written consent.
                </p>
              </section>

              {/* Privacy Policy */}
              <section className="mb-10">
                <h2 className="text-xl font-satoshi font-bold text-gunmetal mb-6">5. Privacy Policy</h2>
                <p className="text-sm text-gunmetal/80 leading-relaxed">
                  Our Privacy Policy outlines how we collect, use, and safeguard your personal information. By using the Site, you consent to the practices described in the Privacy Policy.
                </p>
              </section>

              {/* Limitation of Liability */}
              <section className="mb-10">
                <h2 className="text-xl font-satoshi font-bold text-gunmetal mb-6">6. Limitation of Liability</h2>
                <p className="text-sm text-gunmetal/80 leading-relaxed">
                  Akshar Visa Immigration is not liable for any direct, indirect, incidental, consequential, or punitive damages arising out of your access to or use of the Site. This limitation applies to the fullest extent permitted by applicable law.
                </p>
              </section>

              {/* Governing Law */}
              <section className="mb-10">
                <h2 className="text-xl font-satoshi font-bold text-gunmetal mb-6">7. Governing Law</h2>
                <p className="text-sm text-gunmetal/80 leading-relaxed">
                  These Terms of Use are governed by and construed in accordance with the laws of Vadodara. Any legal action arising out of or relating to these terms shall be filed only in the courts located in Vadodara, and you consent to the exclusive jurisdiction of such courts.
                </p>
              </section>

              {/* Termination */}
              <section className="mb-10">
                <h2 className="text-xl font-satoshi font-bold text-gunmetal mb-6">8. Termination</h2>
                <p className="text-sm text-gunmetal/80 leading-relaxed">
                  We reserve the right to terminate or suspend your access to the Site, with or without notice, for any reason, including a breach of these terms.
                </p>
              </section>

              {/* Contact Information */}
              <section className="mb-10">
                <h2 className="text-xl font-satoshi font-bold text-gunmetal mb-6">9. Contact Information</h2>
                <p className="text-sm text-gunmetal/80 leading-relaxed">
                  If you have any questions or concerns about these Terms of Use, please contact us at{' '}
                  <a href="mailto:support@uni360degree.com" className="text-tigers-eye hover:underline font-medium">
                    support@uni360degree.com
                  </a>.
                </p>
              </section>

              {/* Entire Agreement */}
              <section className="mb-10">
                <h2 className="text-xl font-satoshi font-bold text-gunmetal mb-6">10. Entire Agreement</h2>
                <p className="text-sm text-gunmetal/80 leading-relaxed">
                  These Terms of Use constitute the entire agreement between you and Akshar Visa Immigration regarding your use of the Site, superseding any prior agreements.
                </p>
              </section>

              {/* Last Updated */}
              <div className="border-t border-gunmetal/20 pt-8">
                <p className="text-sm text-gunmetal/60 text-sm">
                  This Terms of Use was last updated on 28 February 2026.
                </p>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsOfUse;