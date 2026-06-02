import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const CookiePolicy = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-accent text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Button 
            variant="ghost" 
            className="text-white hover:bg-white/10 mb-6"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
          
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Cookie Policy
          </h1>
          <p className="text-xl text-white/90">
            How we use cookies to improve your experience
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="prose prose-lg max-w-none">
          <div className="mb-8">
            <p className="text-muted-foreground">
              <strong>Last updated:</strong> January 2024
            </p>
          </div>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">1. What Are Cookies</h2>
            <p className="text-muted-foreground mb-4">
              Cookies are small text files that are stored on your device when you visit our website. 
              They help us provide you with a better, faster, and safer experience.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">2. Types of Cookies We Use</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-foreground mb-2">Essential Cookies</h3>
                <p className="text-muted-foreground">
                  These cookies are necessary for the website to function and cannot be switched off. 
                  They enable core functionality such as security, network management, and accessibility.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-medium text-foreground mb-2">Performance Cookies</h3>
                <p className="text-muted-foreground">
                  These cookies help us understand how visitors interact with our website by collecting 
                  and reporting information anonymously.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-medium text-foreground mb-2">Functional Cookies</h3>
                <p className="text-muted-foreground">
                  These cookies enable the website to provide enhanced functionality and personalization, 
                  such as remembering your preferences.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-medium text-foreground mb-2">Marketing Cookies</h3>
                <p className="text-muted-foreground">
                  These cookies track your online activity to help advertisers deliver more relevant 
                  advertising or to limit how many times you see an ad.
                </p>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">3. How We Use Cookies</h2>
            <p className="text-muted-foreground mb-4">
              We use cookies to:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Keep you signed in to your account</li>
              <li>Remember your preferences and settings</li>
              <li>Understand how you use our website</li>
              <li>Improve our services and user experience</li>
              <li>Provide personalized content and recommendations</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">4. Third-Party Cookies</h2>
            <p className="text-muted-foreground mb-4">
              We may use third-party services that set cookies on our website, including:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Google Analytics for website analytics</li>
              <li>Social media platforms for sharing functionality</li>
              <li>Payment processors for secure transactions</li>
              <li>Chat support services for customer assistance</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">5. Managing Cookies</h2>
            <p className="text-muted-foreground mb-4">
              You can control and/or delete cookies as you wish. You can:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Delete all cookies currently on your device</li>
              <li>Set your browser to prevent cookies from being placed</li>
              <li>Accept or reject cookies from specific websites</li>
              <li>Use our cookie preference center to manage settings</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">6. Cookie Consent</h2>
            <p className="text-muted-foreground mb-4">
              When you first visit our website, you'll see a cookie banner asking for your consent. 
              You can choose to accept all cookies, reject non-essential cookies, or customize your preferences.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">7. Updates to This Policy</h2>
            <p className="text-muted-foreground mb-4">
              We may update this Cookie Policy from time to time. Any changes will be posted on this 
              page with an updated revision date.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">8. Contact Us</h2>
            <p className="text-muted-foreground mb-4">
              If you have any questions about our use of cookies, please contact us:
            </p>
            <div className="bg-muted/50 p-4 rounded-lg">
              <p><strong>Email:</strong> privacy@uni360.com</p>
              <p><strong>Phone:</strong> +91 98765 43210</p>
              <p><strong>Address:</strong> UNI 360°, Mumbai, India</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default CookiePolicy;