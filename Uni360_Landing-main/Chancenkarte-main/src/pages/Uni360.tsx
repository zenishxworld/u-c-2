import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CheckCircle, ArrowRight, X } from 'lucide-react';
import { Footer } from '@/components/Footer';
import { useState } from 'react';


const Uni360 = () => {
  const [showPopup, setShowPopup] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: ''
  });


  const features = [
    {
      title: "Application Support",
      description: "Track your university applications in real-time — from submission to decision."
    },
    {
      title: "Dedicated Support Team",
      description: "Talk to real experts who understand the German education system inside-out."
    },
    {
      title: "End-to-End Services",
      description: "From SOP review to visa appointment booking — we handle it all."
    },
    {
      title: "Scholarship & Funding Help",
      description: "We help you discover and apply for scholarships that suit your profile."
    },
    {
      title: "Germany-Focused",
      description: "Our platform is tailored specifically for students targeting Germany."
    },
    {
      title: "Transparent Timeline",
      description: "Know what's next. Our dashboard keeps you informed at every step."
    }
  ];


  const scrollToEligibility = () => {
    window.location.href = '/#eligibility-checker';
  };


  const handleGetEarlyAccess = () => {
    setShowPopup(true);
  };


  const handleClosePopup = () => {
    setShowPopup(false);
    setShowSuccessMessage(false);
    setFormData({ name: '', email: '' });
  };


  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };


  const handleSubmit = () => {
    if (!formData.name.trim() || !formData.email.trim()) {
      alert('Please fill in all fields');
      return;
    }
    // Handle form submission here
    console.log('Form submitted:', formData);
    setShowSuccessMessage(true);
  };


  return (
    <div className="min-h-screen bg-off-white">
      {/* Top-left Chancenkarte Button */}
      <div className="fixed top-0 left-0 w-full bg-off-white shadow z-50 p-3 lg:p-4 flex items-center justify-between">
        <button
  onClick={() => (window.location.href = "/")}
  className="text-lg sm:text-xl lg:text-2xl font-satoshi font-bold flex flex-row items-center flex-nowrap text-gunmetal focus:outline-none ml-2 sm:ml-3 lg:ml-0">
  Chancenkarte
  <img
    className="object-contain w-3 sm:w-4 lg:w-5 ml-1 flex-shrink-0 relative top-0.5"
    src="/germanyflag.png"
    alt=""
  />
</button>
      </div>
       
      {/* Hero Section */}
      <section
  className="relative pb-12 lg:pb-20 px-4 min-h-screen flex items-center justify-center"
  style={{ paddingTop: '6rem' }}
>
  {/* Background Image with Blur */}
<div
  className="absolute inset-0 bg-cover bg-center bg-no-repeat filter blur-[1px] opacity-40"
  style={{
    backgroundImage: `url('./Germany skyline.jpeg')`,
  }}
></div>
        <div className="container mx-auto text-center relative z-10">
          <h1 className="-mt-16 sm:mt-0 flex items-center justify-center gap-0 flex-wrap text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
  <span className="flex flex-col items-center sm:flex-row sm:gap-1">
  <span className="sm:hidden relative text-5xl" style={{top: '-20px' }}>UNI 360°</span>
  <span className="sm:hidden mt-6 text-4xl">Your Study Abroad</span>
  <span className="sm:hidden text-3xl bg-gradient-to-r from-yellow-600 to-purple-600 bg-clip-text text-transparent">Command Center</span>
  <span className="hidden sm:inline">UNI 360° — Your Study Abroad</span>
</span>{' '}
<span className="hidden sm:inline bg-gradient-to-r from-yellow-600 to-purple-600 bg-clip-text text-transparent lg:mt-2 xl:mt-3">
  Command Center
</span>
</h1>


                   
          <p className="text-xl sm:text-lg xl:text-xl text-gray-900 mb-8 max-w-3xl mx-auto leading-relaxed px-4">
            From applications to arrival in Germany, UNI 360° is your complete companion every step of the way.
          </p>
                   
          <Button
  onClick={handleGetEarlyAccess}
  className="mt-24 sm:mt-0 w-full sm:w-auto bg-primary hover:bg-primary/90 text-white px-8 py-3 text-lg font-medium"
>
            Get Early Access
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </section>


      {/* Features Section */}
      <section className="pt-24 lg:pt-32 pb-20 px-4">
        <div className="container mx-auto">
          <h2 className="text-4xl font-bold text-center text-gunmetal mb-16">
            Why Choose UNI 360°?
          </h2>
                   
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="p-6 hover:shadow-lg transition-shadow bg-white">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <CheckCircle className="w-6 h-6 text-green-500 mt-1" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gunmetal mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>


      <div className="flex justify-center">
  <Button
    onClick={handleGetEarlyAccess}
    className="w-auto bg-primary hover:bg-primary/90 text-white px-8 py-3 text-lg font-medium relative -top-2"
  >
    Get Early Access
    <ArrowRight className="ml-2 w-5 h-5" />
  </Button>
</div>


      <div className="text-center py-8 px-4">
        <p className="text-lg text-gray-700 font-medium">
          Helping students and professionals achieve their dreams in Germany.
        </p>
      </div>


      {/* Popup Modal */}
      {showPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl font-bold text-gunmetal">
                  {showSuccessMessage ? '' : 'Get Early Access'}
                </h3>
                <button
                  onClick={handleClosePopup}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
             
              {showSuccessMessage ? (
                <div className="text-center py-8">
                  <div className="mb-4">
                    <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
                  </div>
                  <h3 className="text-2xl font-bold text-gunmetal mb-4">
                    Success!
                  </h3>
                  <p className="text-lg text-gunmetal font-medium mb-4">
                    You've been added to the waitlist. We'll notify you when UNI 360° launches!
                  </p>
                  <Button
                    onClick={handleClosePopup}
                    className="mt-6 bg-primary hover:bg-primary/90 text-white px-8"
                  >
                    Close
                  </Button>
                </div>
              ) : (
                <>
                  <p className="text-gray-600 mb-6">
                    Be the first to know when UNI 360° launches. Enter your details below:
                  </p>
                 
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gunmetal mb-2">
                        Full Name
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="Enter your full name"
                      />
                    </div>
                   
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gunmetal mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="Enter your email address"
                      />
                    </div>
                   
                    <div className="flex gap-3 pt-4">
                      <Button
                        onClick={handleClosePopup}
                        className="flex-1 bg-gray-200 hover:bg-gray-300 text-gunmetal"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleSubmit}
                        className="flex-1 bg-primary hover:bg-primary/90 text-white"
                      >
                        Submit
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


export default Uni360;