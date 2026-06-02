
import { ArrowLeft } from 'lucide-react';
import { useEffect } from 'react';

export const PrivacyPolicy = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const goBack = () => {
    window.history.back();
  };

  return (
    <div className="min-h-screen bg-off-white">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <button 
            onClick={goBack}
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
              Privacy Policy
            </h1>
            <p className="text-lg text-gunmetal/70 max-w-2xl mx-auto">
              Your privacy is important to us. Learn how we collect, use, and protect your information.
            </p>
          </div>

          {/* Content Card */}
          <div className="bg-white rounded-chancenkarte p-8 lg:p-12 shadow-sm">
            <div className="prose prose-lg max-w-none">
              
              {/* Introduction */}
              <div className="mb-8">
                <p className="text-sm text-gunmetal/80 leading-relaxed">
                  At Akshar Visa Immigration, we are committed to safeguarding the privacy of our website visitors and clients. This Privacy Policy outlines the types of personal information we collect, how we use it, and the choices you have regarding your information.
                </p>
              </div>

              {/* Information We Collect */}
              <section className="mb-10">
                <h2 className="text-xl font-satoshi font-bold text-gunmetal mb-6">Information We Collect</h2>
                
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-semibold text-gunmetal mb-3">1. Personal Information</h3>
                    <p className="text-sm text-gunmetal/80 leading-relaxed">
                      We may collect personal information, such as names, contact details, and other relevant details, when you voluntarily provide it to us through our website, forms, or in communication with our team.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold text-gunmetal mb-3">2. Payment Information</h3>
                    <p className="text-sm text-gunmetal/80 leading-relaxed">
                      When making payments for our services, we may collect payment details such as credit card information. This information is securely processed, and we do not store payment details on our servers.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold text-gunmetal mb-3">3. Cookies and Tracking</h3>
                    <p className="text-sm text-gunmetal/80 leading-relaxed">
                      Our website may use cookies and similar tracking technologies to enhance user experience, analyze trends, and administer the website. You can control the use of cookies through your browser settings.
                    </p>
                  </div>
                </div>
              </section>

              {/* How We Use Your Information */}
              <section className="mb-10">
                <h2 className="text-xl font-satoshi font-bold text-gunmetal mb-6">How We Use Your Information</h2>
                
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-semibold text-gunmetal mb-3">1. Providing Services</h3>
                    <p className="text-sm text-gunmetal/80 leading-relaxed">
                      We use the information you provide to deliver our visa consulting services, process applications, and communicate with you about your visa or related matters.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold text-gunmetal mb-3">2. Communication</h3>
                    <p className="text-sm text-gunmetal/80 leading-relaxed">
                      We may use your contact information to send you updates, newsletters, and relevant information about our services. You can opt out of these communications at any time.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold text-gunmetal mb-3">3. Improving Our Services</h3>
                    <p className="text-sm text-gunmetal/80 leading-relaxed">
                      We may use aggregated and anonymized data to analyze trends and improve our services. This information does not identify individual users.
                    </p>
                  </div>
                </div>
              </section>

              {/* Sharing Your Information */}
              <section className="mb-10">
                <h2 className="text-xl font-satoshi font-bold text-gunmetal mb-6">Sharing Your Information</h2>
                
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-semibold text-gunmetal mb-3">1. Third-Party Service Providers</h3>
                    <p className="text-sm text-gunmetal/80 leading-relaxed">
                      We may share your information with trusted third-party service providers who assist us in delivering our services, processing payments, or analyzing website performance.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold text-gunmetal mb-3">2. Legal Requirements</h3>
                    <p className="text-sm text-gunmetal/80 leading-relaxed">
                      We may disclose your information if required to do so by law or in response to legal requests.
                    </p>
                  </div>
                </div>
              </section>

              {/* Security */}
              <section className="mb-10">
                <h2 className="text-xl font-satoshi font-bold text-gunmetal mb-6">Security</h2>
                <p className="text-sm text-gunmetal/80 leading-relaxed">
                  We take reasonable measures to protect your personal information from unauthorized access, use, or disclosure. However, no data transmission over the internet can be guaranteed to be completely secure.
                </p>
              </section>

              {/* Your Choices */}
              <section className="mb-10">
                <h2 className="text-xl font-satoshi font-bold text-gunmetal mb-6">Your Choices</h2>
                <p className="text-sm text-gunmetal/80 leading-relaxed mb-4">You have the right to:</p>
                <div className="bg-off-white rounded-lg p-6">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-tigers-eye rounded-full mt-2 flex-shrink-0"></div>
                      <p className="text-sm text-gunmetal/80">Access and correct your personal information.</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-tigers-eye rounded-full mt-2 flex-shrink-0"></div>
                      <p className="text-sm text-gunmetal/80">Opt out of receiving marketing communications.</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-tigers-eye rounded-full mt-2 flex-shrink-0"></div>
                      <p className="text-sm text-gunmetal/80">Request the deletion of your personal information, subject to legal requirements.</p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Contact Us */}
              <section className="mb-10">
                <h2 className="text-xl font-satoshi font-bold text-gunmetal mb-6">Contact Us</h2>
                <p className="text-sm text-gunmetal/80 leading-relaxed">
                  If you have any questions or concerns about our Privacy Policy or the handling of your personal information, please contact us at{' '}
                  <a href="mailto:support@uni360degree.com" className="text-tigers-eye hover:underline font-medium">
                    support@uni360degree.com
                  </a>.
                </p>
              </section>

              {/* Changes to Privacy Policy */}
              <section className="mb-10">
                <h2 className="text-xl font-satoshi font-bold text-gunmetal mb-6">Changes to the Privacy Policy</h2>
                <p className="text-sm text-gunmetal/80 leading-relaxed">
                  We may update our Privacy Policy to reflect changes in our practices or applicable laws. The updated policy will be posted on our website.
                </p>
              </section>

              {/* Last Updated */}
              <div className="border-t border-gunmetal/20 pt-8">
                <p className="text-sm text-gunmetal/60 text-sm">
                  This Privacy Policy was last updated on 28 February 2026.
                </p>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;