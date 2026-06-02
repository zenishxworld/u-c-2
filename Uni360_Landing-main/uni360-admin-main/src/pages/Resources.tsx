import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Search, ExternalLink, Filter, X, Check, GraduationCap, FileText, Home, Languages, Plane, Heart, Building2, BookOpen, Globe, Award, Briefcase, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type Country = 'germany' | 'uk';

interface Resource {
  id: number;
  title: string;
  description: string;
  icon: any;
  tags: string[];
  featured?: boolean;
  redirectLink: string;
}

interface CountryData {
  name: string;
  flag: string;
}

export default function InternationalResources() {
  const location = useLocation();
  
  // Function to map country names to country codes
  const getCountryCode = (countryName: string): Country => {
    if (!countryName) return 'germany';
    
    const countryMap: Record<string, Country> = {
      'Germany': 'germany',
      'Germany, Germany': 'germany',
      'germany': 'germany',
      'United Kingdom': 'uk',
      'UK': 'uk',
      'uk': 'uk',
    };
    
    return countryMap[countryName] || 'germany';
  };
  
  // Initialize country from location state or default to 'germany'
  const initialCountry = location.state?.country 
    ? getCountryCode(location.state.country)
    : 'germany';
  
  const [selectedCountry, setSelectedCountry] = useState<Country>(initialCountry);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  const countries: Record<Country, CountryData> = {
    germany: { name: 'Germany', flag: '/germany-logo.png' },
    uk: { name: 'United Kingdom', flag: '/uk-logo.png' }
  };

  const resourcesByCountry: Record<Country, Resource[]> = {
    germany: [
      {
        id: 1,
        title: 'DAAD Scholarships',
        description: 'Explore scholarship opportunities from the German Academic Exchange Service (DAAD). Access comprehensive information about funding for international students.',
        icon: GraduationCap,
        tags: ['Scholarship', 'Funding', 'DAAD'],
        featured: true,
        redirectLink: 'https://www.daad.de/en/'
      },
      {
        id: 2,
        title: 'APS Certificate',
        description: 'Check your eligibility and apply for APS (Akademische Prüfstelle) certificate, mandatory for studying in Germany from certain countries.',
        icon: FileText,
        tags: ['APS', 'Certification', 'Required'],
        featured: true,
        redirectLink: 'https://aps-india.de/'
      },
      {
        id: 3,
        title: 'Uni-Assist Application',
        description: 'Central application portal for international students. Submit applications to multiple German universities through a single platform.',
        icon: BookOpen,
        tags: ['Application', 'Portal', 'Universities'],
        featured: true,
        redirectLink: 'https://www.uni-assist.de/en/'
      },
      {
        id: 4,
        title: 'Accommodation Search',
        description: 'Find student housing in Germany. Browse verified accommodations near major universities and get assistance with rental procedures.',
        icon: Home,
        tags: ['Housing', 'Student Life', 'Germany'],
        featured: true,
        redirectLink: 'https://www.student.com/de/germany'
      },
      {
        id: 5,
        title: 'German Language Courses',
        description: 'Learn German from A1 to C1 level. Prepare for TestDaF, Goethe-Institut exams and university language requirements.',
        icon: Languages,
        tags: ['German', 'Language', 'TestDaF'],
        featured: true,
        redirectLink: 'https://www.goethe.de/en/index.html'
      },
      {
        id: 6,
        title: 'Blocked Account',
        description: 'Open a blocked account (Sperrkonto) required for German student visa. Compare providers and get step-by-step guidance.',
        icon: Building2,
        tags: ['Visa', 'Finance', 'Required'],
        featured: true,
        redirectLink: 'https://www.expatrio.com/blocked-account'
      },
      {
        id: 7,
        title: 'Student Health Insurance',
        description: 'Get mandatory health insurance for studying in Germany. Compare statutory and private insurance options for students.',
        icon: Heart,
        tags: ['Insurance', 'Health', 'Required'],
        featured: true,
        redirectLink: 'https://www.tk.de/en'
      },
      {
        id: 8,
        title: 'Flight Booking',
        description: 'Find affordable flights to Germany. Get assistance with booking and travel planning for your study abroad journey.',
        icon: Plane,
        tags: ['Travel', 'Flight', 'Germany'],
        featured: false,
        redirectLink: 'https://www.skyscanner.com/'
      },
      {
        id: 9,
        title: 'Document Translation',
        description: 'Professional certified translation services for academic documents, certificates, and official papers for German universities.',
        icon: FileText,
        tags: ['Translation', 'Documents', 'Certified'],
        featured: false,
        redirectLink: 'https://certifiedtranslationindia.com/?gad_source=1&gad_campaignid=21476763982&gbraid=0AAAAABevLfAUNcQy1R9IFbRn57hWzwIxv&gclid=CjwKCAjw-dfOBhAjEiwAq0RwI8_AVDfSrlYnrayybIoEUbP2OlGHYaGaZ3LS9LlPmZQvyqFM2nzeWBoCikgQAvD_BwE'
      },
      {
        id: 10,
        title: 'StudyCheck Portal',
        description: 'Explore German universities, read reviews from international students, and compare programs across different institutions.',
        icon: BookOpen,
        tags: ['Universities', 'Reviews', 'Research'],
        featured: false,
        redirectLink: 'https://www.studycheck.de/en'
      },
      {
        id: 11,
        title: 'GUS Academy Registration',
        description: 'Register for GUS Academy partner portal. Access comprehensive resources and tools for your German university application process.',
        icon: GraduationCap,
        tags: ['Registration', 'Portal', 'Academy'],
        featured: false,
        redirectLink: 'https://partners.gus.global/gusacademy/register'
      },
      {
        id: 12,
        title: 'VFS Global Services',
        description: 'Book visa appointments and access VFS Global services for German visa applications. Track your application and manage documents.',
        icon: Globe,
        tags: ['Visa', 'Appointment', 'Services'],
        featured: false,
        redirectLink: 'https://www.vfsglobal.com/'
      },
      {
        id: 13,
        title: 'German Embassy Portal',
        description: 'Access the official German embassy digital portal for visa applications. Manage your visa application online and track status.',
        icon: FileText,
        tags: ['Embassy', 'Visa', 'Official'],
        featured: false,
        redirectLink: 'https://app.digital.diplo.de/'
      },
      {
        id: 14,
        title: 'Anabin Database',
        description: 'Check if your degree is recognized in Germany. Official database for foreign educational qualifications and university recognition.',
        icon: Award,
        tags: ['Recognition', 'Degree', 'Database'],
        featured: false,
        redirectLink: 'https://anabin.kmk.org/'
      },
      {
        id: 15,
        title: 'VIDEX Application',
        description: 'Fill out your visa application form online using VIDEX. Required for German visa applications at embassies and consulates.',
        icon: FileText,
        tags: ['Visa', 'Application', 'Form'],
        featured: false,
        redirectLink: 'https://videx.diplo.de/'
      }
    ],
    uk: [
      {
        id: 16,
        title: 'UCAS Application',
        description: 'Apply to UK universities through UCAS (Universities and Colleges Admissions Service), the centralized application system for undergraduate courses.',
        icon: BookOpen,
        tags: ['Application', 'UCAS', 'Universities'],
        featured: true,
        redirectLink: 'https://www.ucas.com/'
      },
      {
        id: 17,
        title: 'Chevening Scholarships',
        description: 'Prestigious UK government scholarships for international students. Fully funded masters programs at top UK universities.',
        icon: Award,
        tags: ['Scholarship', 'Funding', 'Masters'],
        featured: true,
        redirectLink: 'https://www.chevening.org/'
      },
      {
        id: 18,
        title: 'UK Student Visa (Tier 4)',
        description: 'Complete guide to UK student visa requirements, CAS letters, and application process. Get step-by-step assistance.',
        icon: FileText,
        tags: ['Visa', 'Required', 'Immigration'],
        featured: true,
        redirectLink: 'https://www.gov.uk/student-visa'
      },
      {
        id: 19,
        title: 'IELTS Preparation',
        description: 'Prepare for IELTS exam required for UK universities. Access practice tests, speaking sessions, and expert guidance.',
        icon: Languages,
        tags: ['IELTS', 'English', 'Test Prep'],
        featured: true,
        redirectLink: 'https://www.ielts.org/'
      },
      {
        id: 20,
        title: 'UK Accommodation',
        description: 'Find student accommodation in UK cities. Browse university halls, private rentals, and shared apartments.',
        icon: Home,
        tags: ['Housing', 'Student Life', 'UK'],
        featured: true,
        redirectLink: 'https://www.uniplaces.com/en-gb/uk'
      },
      {
        id: 21,
        title: 'NHS Health Surcharge',
        description: 'Pay the Immigration Health Surcharge to access NHS services during your stay. Required for visa application.',
        icon: Heart,
        tags: ['Health', 'Insurance', 'Required'],
        featured: false,
        redirectLink: 'https://www.gov.uk/healthcare-immigration-application'
      },
      {
        id: 22,
        title: 'UK Bank Account',
        description: 'Open a UK bank account for students. Compare options from major banks and understand requirements for international students.',
        icon: Building2,
        tags: ['Finance', 'Banking', 'Student'],
        featured: false,
        redirectLink: 'https://www.moneysavingexpert.com/students/'
      },
      {
        id: 23,
        title: 'Graduate Route Visa',
        description: 'Stay in the UK for 2 years after graduation with the Graduate Route. Work or look for work without sponsorship.',
        icon: Briefcase,
        tags: ['Post-Study', 'Work', 'Visa'],
        featured: false,
        redirectLink: 'https://www.gov.uk/graduate-visa'
      }
    ]
  };

  const currentResources = resourcesByCountry[selectedCountry];
  const allTags = Array.from(new Set(currentResources.flatMap(r => r.tags)));

  const filteredResources = currentResources.filter(resource => {
    const matchesSearch =
      resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resource.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTags = selectedTags.length === 0 || selectedTags.some(tag => resource.tags.includes(tag));
    return matchesSearch && matchesTags;
  });

  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev => (prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]));
  };

  const clearAllFilters = () => {
    setSelectedTags([]);
  };

  const handleResourceClick = (resource: Resource) => {
    if (resource.redirectLink.startsWith('http')) {
      window.open(resource.redirectLink, '_blank');
    }
  };

  const FiltersModal = () => {
    if (!showFilters) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div 
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={() => setShowFilters(false)}
        />
        
        <div className="relative bg-card rounded-2xl w-full max-w-lg shadow-2xl border border-border">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h3 className="text-lg font-semibold text-foreground">Filter Resources</h3>
            <button 
              onClick={() => setShowFilters(false)}
              className="p-1.5 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="p-4 space-y-4">
            <div>
              <h4 className="text-sm font-medium text-foreground mb-2">Filter by Tags</h4>
              <div className="grid grid-cols-3 gap-1.5">
                {allTags.map(tag => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleTagToggle(tag)}
                    className={`px-2 py-1.5 rounded text-xs font-medium transition-all truncate ${
                      selectedTags.includes(tag)
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            <div className="text-center text-sm text-muted-foreground py-2 border-t border-border">
              {filteredResources.length} resources found
            </div>
          </div>

          <div className="flex gap-2 p-4 border-t border-border bg-muted/10">
            <button 
              type="button"
              onClick={clearAllFilters}
              className="flex-1 py-2.5 px-3 bg-muted text-muted-foreground rounded-lg hover:bg-muted/80 transition-colors font-medium text-sm"
            >
              Clear All
            </button>
            <button 
              type="button"
              onClick={() => setShowFilters(false)}
              className="flex-1 py-2.5 px-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium text-sm"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-6 lg:p-8">
        {/* Header */}
        <motion.div 
          className="mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-2xl font-bold mb-2 text-[#2a3439]">
            Study Abroad Resources
          </h1>
          <p className="text-muted-foreground text-sm max-w-2xl">
            Essential services and tools for your international university application journey
          </p>
        </motion.div>

        {/* Country Tabs */}
        <motion.div 
          className="mb-5"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="flex flex-wrap gap-2">
            {(Object.keys(countries) as Country[]).map((countryKey) => {
              const country = countries[countryKey];
              return (
                <button
                  key={countryKey}
                  type="button"
                  onClick={() => {
                    setSelectedCountry(countryKey);
                    setSearchTerm('');
                    setSelectedTags([]);
                  }}
                  className={`group px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                    selectedCountry === countryKey
                      ? 'bg-primary text-primary-foreground shadow-md'
                      : 'bg-card text-foreground border border-border hover:border-primary hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <img 
                      src={country.flag} 
                      alt={`${country.name} flag`}
                      className="w-5 h-5 object-contain"
                    />
                    <span>{country.name}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Search and Filters */}
        <motion.div 
          className="flex flex-col md:flex-row gap-3 mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search resources..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="uni-input w-full pl-9 pr-3 py-2 text-sm"
            />
          </div>

          <button
            type="button"
            onClick={() => setShowFilters(true)}
            className="uni-btn-secondary flex items-center justify-center gap-1.5 px-4 py-2 text-sm whitespace-nowrap"
          >
            <Filter className="h-4 w-4" />
            Filters
            {selectedTags.length > 0 && (
              <span className="bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-[10px] font-bold">
                {selectedTags.length}
              </span>
            )}
          </button>
        </motion.div>

        {/* Active Filters */}
        {selectedTags.length > 0 && (
          <motion.div 
            className="flex flex-wrap gap-2 mb-6"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {selectedTags.map(tag => (
              <button
                key={tag}
                type="button"
                onClick={() => handleTagToggle(tag)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium hover:bg-primary/20 transition-colors border border-primary/20"
              >
                {tag}
                <X className="h-3.5 w-3.5" />
              </button>
            ))}
            <button
              type="button"
              onClick={clearAllFilters}
              className="px-3 py-1.5 text-muted-foreground hover:text-foreground text-sm font-medium transition-colors underline"
            >
              Clear all
            </button>
          </motion.div>
        )}

        {/* Resources Grid */}
        <AnimatePresence mode="wait">
          <motion.div 
            key={selectedCountry}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {filteredResources.map((resource, index) => {
              const IconComponent = resource.icon;
              return (
                <motion.div
                  key={resource.id}
                  className="uni-card p-5 cursor-pointer group relative overflow-hidden flex flex-col h-full"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  onClick={() => handleResourceClick(resource)}
                >
                  {/* Featured Badge */}
                  {resource.featured && (
                    <div className="absolute top-4 right-4">
                      <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-full text-[10px] font-bold border border-primary/20 uppercase tracking-wider">
                        Featured
                      </span>
                    </div>
                  )}

                  {/* Icon */}
                  <div className="mb-3">
                    <div className="inline-flex p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                      <IconComponent className="h-5 w-5 text-primary" />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-grow flex flex-col">
                    <h3 className="text-base font-bold mb-2 text-foreground group-hover:text-primary transition-colors">
                      {resource.title}
                    </h3>
                    <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                      {resource.description}
                    </p>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1.5 mb-4 mt-auto">
                      {resource.tags.slice(0, 3).map((tag, tagIndex) => (
                        <span 
                          key={tagIndex}
                          className="px-2 py-0.5 bg-muted rounded text-[11px] font-medium text-muted-foreground"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Action Button */}
                  <button
                    type="button"
                    className="mt-auto bg-[#E88C30] hover:bg-[#E88C30]/90 text-white font-medium rounded-lg py-2 text-sm w-full flex items-center justify-center gap-2 group-hover:gap-3 transition-all"
                  >
                    Access Resource
                    <ExternalLink className="h-4 w-4" />
                  </button>
                </motion.div>
              );
            })}
          </motion.div>
        </AnimatePresence>

        {/* Empty State */}
        {filteredResources.length === 0 && (
          <motion.div
            className="text-center py-16"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-2xl font-bold mb-2">No resources found</h3>
            <p className="text-muted-foreground mb-6">
              Try adjusting your search or filters
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                clearAllFilters();
              }}
              className="uni-btn-primary"
            >
              Clear all filters
            </button>
          </motion.div>
        )}

        {/* Modals */}
        <FiltersModal />
      </div>
    </div>
  );
}