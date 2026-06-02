import { useEffect, useState } from "react";
import { Mail, Phone, MapPin, Send, CheckCircle, AlertCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { publicAPI } from "@/services/api";
import contactHeroImg from "@/assets/admission-counselling.webp";

export const Contact = () => {
  const phoneNumber = "+91 82004 16596";
  
  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    country: '',
    subject: '',
    message: ''
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  
  // Office address and coordinates
  const officeAddress = "GF-18, Windsor Plaza, RC Dutt Rd, Vishwas Colony, Alkapuri, Vadodara, Gujarat 390007";
  
  // Function to open location in Google Maps
  const openInGoogleMaps = () => {
    const encodedAddress = encodeURIComponent(officeAddress);
    const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
    window.open(googleMapsUrl, '_blank');
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: value
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError('');

    try {
      await publicAPI.submitContact(formData);
      
      setIsSubmitted(true);
      
      // Reset form after successful submission
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        country: '',
        subject: '',
        message: ''
      });

      // Hide success message after 5 seconds
      setTimeout(() => {
        setIsSubmitted(false);
      }, 5000);

    } catch (error) {
      console.error('Error submitting form:', error);
      setSubmitError(
        error.message || 'Something went wrong. Please try again or contact us directly.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen mt-10 bg-background">
      <Navigation selectedCountries={["germany", "uk"]} onCountrySelect={() => {}} />

      {/* Success Popup Modal */}
      {isSubmitted && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsSubmitted(false)}
          />
          {/* Modal */}
          <div className="relative bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center animate-in fade-in zoom-in duration-300">
            <button
              onClick={() => setIsSubmitted(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mx-auto mb-5">
              <CheckCircle className="h-10 w-10 text-green-500" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Message Sent!</h3>
            <p className="text-gray-500 mb-6">
              Thank you for reaching out. We've received your message and will get back to you within <span className="font-semibold text-gray-700">24 hours</span>.
            </p>
            <button
              onClick={() => setIsSubmitted(false)}
              className="w-full bg-primary text-white font-semibold py-3 px-6 rounded-lg hover:bg-primary/90 transition-colors"
            >
              Got it!
            </button>
          </div>
        </div>
      )}
      
      <div className="pt-16">
        {/* Hero Section */}
        <section 
          className="relative py-20 overflow-hidden bg-cover bg-center"
          style={{
            backgroundImage: `url(${contactHeroImg})`,
            backgroundAttachment: 'fixed',
          }}
        >
          {/* Overlay */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
          
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 text-white">
              Contact us
            </h1>
            <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto">
              Get in touch and ask us anything. We're here to help you with your study abroad journey.
            </p>
          </div>
        </section>

        {/* Contact Information & Form Section */}
        <section className="py-16 bg-testimonials-gradient">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              
              {/* Left Column - Contact Info Cards */}
              <div className="space-y-6">
                <div className="mb-8">
                  <h2 className="text-3xl md:text-4xl font-bold mb-2">Get in Touch</h2>
                  <p className="text-muted-foreground text-lg">
                    Reach out to us through any of these channels
                  </p>
                </div>

                {/* Phone Card */}
                <div className="group relative bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl hover:shadow-primary/20 transition-all duration-500 border border-gray-100 hover:border-primary/50 overflow-hidden hover:-translate-y-2">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                  <div className="relative flex items-start gap-6">
                    <div className="bg-primary/10 w-16 h-16 rounded-2xl flex items-center justify-center group-hover:bg-primary group-hover:scale-110 group-hover:-rotate-6 transition-all duration-500 flex-shrink-0 shadow-sm group-hover:shadow-md group-hover:shadow-primary/40">
                      <Phone className="h-7 w-7 text-primary group-hover:text-white transition-colors duration-500" />
                    </div>
                    <div className="flex-1 pt-1">
                      <h3 className="text-xl font-bold mb-2 text-gray-900 group-hover:text-primary transition-colors duration-300">Phone</h3>
                      <a 
                        href={`tel:${phoneNumber}`}
                        className="text-gray-600 hover:text-primary transition-colors font-semibold text-lg block"
                        title="Click to call"
                      >
                        {phoneNumber}
                      </a>
                      <p className="text-sm text-gray-500 mt-2 font-medium">Available during business hours</p>
                    </div>
                  </div>
                </div>

                {/* Email Card */}
                <div className="group relative bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl hover:shadow-primary/20 transition-all duration-500 border border-gray-100 hover:border-primary/50 overflow-hidden hover:-translate-y-2">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                  <div className="relative flex items-start gap-6">
                    <div className="bg-primary/10 w-16 h-16 rounded-2xl flex items-center justify-center group-hover:bg-primary group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 flex-shrink-0 shadow-sm group-hover:shadow-md group-hover:shadow-primary/40">
                      <Mail className="h-7 w-7 text-primary group-hover:text-white transition-colors duration-500" />
                    </div>
                    <div className="flex-1 pt-1">
                      <h3 className="text-xl font-bold mb-2 text-gray-900 group-hover:text-primary transition-colors duration-300">Email</h3>
                      <a 
                        href="mailto:support@uni360degree.com" 
                        className="text-gray-600 hover:text-primary transition-colors font-semibold text-lg break-all block"
                      >
                        support@uni360degree.com
                      </a>
                      <p className="text-sm text-gray-500 mt-2 font-medium">We'll respond within 24 hours</p>
                    </div>
                  </div>
                </div>

                {/* Address Card */}
                <div className="group relative bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl hover:shadow-primary/20 transition-all duration-500 border border-gray-100 hover:border-primary/50 overflow-hidden hover:-translate-y-2">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                  <div className="relative flex items-start gap-6">
                    <div className="bg-primary/10 w-16 h-16 rounded-2xl flex items-center justify-center group-hover:bg-primary group-hover:scale-110 group-hover:-rotate-6 transition-all duration-500 flex-shrink-0 shadow-sm group-hover:shadow-md group-hover:shadow-primary/40">
                      <MapPin className="h-7 w-7 text-primary group-hover:text-white transition-colors duration-500" />
                    </div>
                    <div className="flex-1 pt-1">
                      <h3 className="text-xl font-bold mb-2 text-gray-900 group-hover:text-primary transition-colors duration-300">Office Location</h3>
                      <button
                        onClick={openInGoogleMaps}
                        className="text-gray-600 hover:text-primary transition-colors font-semibold text-base leading-relaxed text-left block"
                        title="Click to open in Google Maps"
                      >
                        {officeAddress}
                      </button>
                      <p className="text-sm text-gray-500 mt-2 font-medium">Open in Google Maps</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Contact Form */}
              <div>
                <div className="bg-primary rounded-2xl p-8 md:p-10 shadow-xl border border-gray-800/20">
                  <h2 className="text-3xl font-bold mb-2 text-white">Send us a Message</h2>
                  <p className="text-gray-300 text-base mb-8">
                    Fill out the form and we'll get back to you within 24 hours
                  </p>

                  {/* Error Message */}
                  {submitError && (
                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center text-red-300">
                      <AlertCircle className="h-5 w-5 mr-3 flex-shrink-0" />
                      <div>
                        <p className="font-semibold text-sm">Failed to send message</p>
                        <p className="text-xs mt-1">{submitError}</p>
                      </div>
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label htmlFor="firstName" className="block text-sm font-medium mb-2 text-gray-200">
                          First Name *
                        </label>
                        <Input
                          id="firstName"
                          value={formData.firstName}
                          onChange={handleInputChange}
                          placeholder="Enter your first name"
                          required
                          className="bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-400 focus:border-primary focus:ring-primary/50"
                        />
                      </div>
                      <div>
                        <label htmlFor="lastName" className="block text-sm font-medium mb-2 text-gray-200">
                          Last Name *
                        </label>
                        <Input
                          id="lastName"
                          value={formData.lastName}
                          onChange={handleInputChange}
                          placeholder="Enter your last name"
                          required
                          className="bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-400 focus:border-primary focus:ring-primary/50"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label htmlFor="email" className="block text-sm font-medium mb-2 text-gray-200">
                          Email Address *
                        </label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          placeholder="Enter your email"
                          required
                          className="bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-400 focus:border-primary focus:ring-primary/50"
                        />
                      </div>
                      <div>
                        <label htmlFor="phone" className="block text-sm font-medium mb-2 text-gray-200">
                          Phone Number *
                        </label>
                        <Input
                          id="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={handleInputChange}
                          placeholder="Enter your phone number"
                          required
                          className="bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-400 focus:border-primary focus:ring-primary/50"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="country" className="block text-sm font-medium mb-2 text-gray-200">
                        Study Destination
                      </label>
                      <select 
                        id="country"
                        value={formData.country}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-md text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                      >
                        <option value="">Select your preferred destination</option>
                        <option value="germany">Germany</option>
                        <option value="uk">United Kingdom</option>
                        <option value="both">Both Germany & UK</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="subject" className="block text-sm font-medium mb-2 text-gray-200">
                        Subject *
                      </label>
                      <Input
                        id="subject"
                        value={formData.subject}
                        onChange={handleInputChange}
                        placeholder="What can we help you with?"
                        required
                        className="bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-400 focus:border-primary focus:ring-primary/50"
                      />
                    </div>

                    <div>
                      <label htmlFor="message" className="block text-sm font-medium mb-2 text-gray-200">
                        Message *
                      </label>
                      <Textarea
                        id="message"
                        rows={6}
                        value={formData.message}
                        onChange={handleInputChange}
                        placeholder="Tell us more about your study abroad goals..."
                        required
                        className="bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-400 focus:border-primary focus:ring-primary/50"
                      />
                    </div>

                    <div className="text-center">
                      <Button 
                        type="submit" 
                        className="bg-accent/20 text-accent hover:bg-accent/30 px-10 py-3 rounded-lg font-semibold text-base shadow-md hover:shadow-lg transition-all border-2 border-accent/40 hover:border-accent/60"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <>
                            <div className="mr-2 h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                            Sending...
                          </>
                        ) : (
                          <>
                            <Send className="mr-2 h-5 w-5" />
                            Send Message
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
};