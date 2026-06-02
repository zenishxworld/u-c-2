import React, { useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  MapPin, 
  GraduationCap,
  Edit3,
  Camera,
  Globe,
  Award,
  FileText,
  Clock
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getProfileCompletion } from '../services/profile';

const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-card rounded-2xl border border-border p-6 ${className}`}>
    {children}
  </div>
);

const InfoItem = ({ 
  icon: Icon, 
  label, 
  value, 
  className = "" 
}: { 
  icon: React.ElementType; 
  label: string; 
  value: string | null | undefined;
  className?: string;
}) => (
  <div className={`flex items-center gap-3 p-3 rounded-lg bg-muted/30 ${className}`}>
    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
      <Icon className="w-5 h-5 text-primary" />
    </div>
    <div>
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p className="text-foreground">{value || "Not specified"}</p>
    </div>
  </div>
);

const StatCard = ({ 
  title, 
  value, 
  icon: Icon, 
  color 
}: { 
  title: string; 
  value: string | number; 
  icon: React.ElementType; 
  color: string;
}) => (
  <Card className="text-center">
    <div className={`w-16 h-16 rounded-full bg-${color}/10 flex items-center justify-center mx-auto mb-3`}>
      <Icon className={`w-8 h-8 text-${color}`} />
    </div>
    <h3 className="text-2xl font-bold mb-1">{value}</h3>
    <p className="text-sm text-muted-foreground">{title}</p>
  </Card>
);

export default function Profile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Debug logging to track user changes
  useEffect(() => {
    console.log('Profile component: User updated', user);
  }, [user]);
  
  // Calculate profile completion - recalculates whenever user changes
  const profileCompletion = useMemo(() => {
    const completion = getProfileCompletion(user);
    console.log('Profile: Calculated completion percentage:', completion);
    return completion;
  }, [user]);

  // Helper functions
  const getUserInitials = () => {
    if (!user?.name) return "UN";
    return user.name.split(" ").map(n => n[0]).join("").toUpperCase();
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "Not specified";
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return "Not specified";
    }
  };

  const getJoinedDate = () => {
    if (user?.createdAt) {
      return formatDate(user.createdAt);
    }
    return "Recently";
  };

  // Calculate stats from user data - recalculates when user changes
  const stats = useMemo(() => {
    const calculatedStats = {
      applications: user?.applications?.length || 0,
      documents: user?.documents?.length || 0,
      universities: user?.favoriteUniversities?.length || 0,
      profileCompletion: profileCompletion,
      daysActive: user?.createdAt 
        ? Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24))
        : 0
    };
    console.log('Profile: Calculated stats:', calculatedStats);
    return calculatedStats;
  }, [user, profileCompletion]);

  // Show loading state if no user
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 px-4 sm:px-0">
      {/* Header */}
      <motion.div 
        className="flex items-center justify-between"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        key={`header-${user.id || user.email}`} // Re-animate when user changes
      >
        <div>
          <h1 className="text-3xl font-bold text-foreground">Profile</h1>
          <p className="text-muted-foreground">Manage your personal information and preferences</p>
        </div>
        <button
          onClick={() => navigate('/settings')}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Edit3 className="w-4 h-4" />
          Edit Profile
        </button>
      </motion.div>

      {/* Profile Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        key={`overview-${user.id || user.email}`} // Re-animate when user changes
      >
        <Card className="relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-primary"></div>
            <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-accent"></div>
          </div>
          
          <div className="relative">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              {/* Avatar */}
              <div className="relative">
                <div className="w-24 h-24 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center">
                  {user.profilePhoto ? (
                    <img
                      src={user.profilePhoto}
                      alt={user.name || "User"}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-3xl font-bold text-primary">
                      {getUserInitials()}
                    </span>
                  )}
                </div>
                <button 
                  onClick={() => navigate('/settings')}
                  className="absolute -bottom-1 -right-1 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center hover:bg-primary/90 transition-colors"
                >
                  <Camera className="w-4 h-4" />
                </button>
              </div>

              {/* User Info */}
              <div className="flex-1 text-center sm:text-left">
                <h2 className="text-2xl font-bold mb-1">{user.name || "User Name"}</h2>
                <p className="text-muted-foreground mb-3">{user.email || "user@example.com"}</p>
                
                <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                  <span className="px-3 py-1 bg-success/10 text-success text-sm rounded-full">
                    {user.isVerified ? "Verified" : "Active"}
                  </span>
                  <span className="px-3 py-1 bg-primary/10 text-primary text-sm rounded-full">
                    Profile {profileCompletion}% Complete
                  </span>
                  <span className="px-3 py-1 bg-muted text-muted-foreground text-sm rounded-full">
                    Joined {getJoinedDate()}
                  </span>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="flex gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-primary">{stats.applications}</div>
                  <div className="text-xs text-muted-foreground">Applications</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-accent">{stats.documents}</div>
                  <div className="text-xs text-muted-foreground">Documents</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-success">{stats.universities}</div>
                  <div className="text-xs text-muted-foreground">Saved Unis</div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Profile Stats */}
      <motion.section
        className="grid grid-cols-1 md:grid-cols-4 gap-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        key={`stats-${user.id || user.email}`} // Re-animate when user changes
      >
        <StatCard
          title="Profile Completion"
          value={`${stats.profileCompletion}%`}
          icon={User}
          color="primary"
        />
        <StatCard
          title="Applications"
          value={stats.applications}
          icon={FileText}
          color="accent"
        />
        <StatCard
          title="Documents"
          value={stats.documents}
          icon={Award}
          color="success"
        />
        <StatCard
          title="Days Active"
          value={stats.daysActive}
          icon={Clock}
          color="muted"
        />
      </motion.section>

      {/* Personal Information */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
        key={`personal-${user.id || user.email}`} // Re-animate when user changes
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Personal Information</h2>
          <button
            onClick={() => navigate('/profile-builder')}
            className="text-primary hover:text-primary/80 text-sm font-medium"
          >
            Complete Profile →
          </button>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <h3 className="text-lg font-semibold mb-4">Contact Details</h3>
            <div className="space-y-3">
              <InfoItem
                icon={User}
                label="Full Name"
                value={user.name}
              />
              <InfoItem
                icon={Mail}
                label="Email Address"
                value={user.email}
              />
              <InfoItem
                icon={Phone}
                label="Phone Number"
                value={user.phone}
              />
              <InfoItem
                icon={Calendar}
                label="Date of Birth"
                value={user.dateOfBirth ? formatDate(user.dateOfBirth) : undefined}
              />
            </div>
          </Card>

          <Card>
            <h3 className="text-lg font-semibold mb-4">Location & Background</h3>
            <div className="space-y-3">
              <InfoItem
                icon={Globe}
                label="Nationality"
                value={user.nationality}
              />
              <InfoItem
                icon={MapPin}
                label="Current Location"
                value={user.currentLocation}
              />
              <InfoItem
                icon={GraduationCap}
                label="Education Level"
                value={user.educationLevel}
              />
              <InfoItem
                icon={Award}
                label="Field of Study"
                value={user.fieldOfStudy}
              />
            </div>
          </Card>
        </div>
      </motion.section>

      {/* Study Preferences */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.4 }}
        key={`preferences-${user.id || user.email}`} // Re-animate when user changes
      >
        <Card>
          <h3 className="text-lg font-semibold mb-4">Study Preferences</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Target Countries</p>
              <div className="flex flex-wrap gap-2">
                {user.targetCountries?.length ? (
                  user.targetCountries.map((country, index) => (
                    <span key={index} className="px-3 py-1 bg-primary/10 text-primary text-sm rounded-full">
                      {country}
                    </span>
                  ))
                ) : (
                  <span className="px-3 py-1 bg-muted text-muted-foreground text-sm rounded-full">
                    Not specified
                  </span>
                )}
              </div>
            </div>
            
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Preferred Programs</p>
              <div className="flex flex-wrap gap-2">
                {user.preferredPrograms?.length ? (
                  user.preferredPrograms.map((program, index) => (
                    <span key={index} className="px-3 py-1 bg-accent/10 text-accent text-sm rounded-full">
                      {program}
                    </span>
                  ))
                ) : (
                  <span className="px-3 py-1 bg-muted text-muted-foreground text-sm rounded-full">
                    Not specified
                  </span>
                )}
              </div>
            </div>
          </div>
        </Card>
      </motion.section>

      {/* Action Buttons */}
      <motion.section
        className="flex flex-col sm:flex-row gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.5 }}
      >
        <button
          onClick={() => navigate('/profile-builder')}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Edit3 className="w-4 h-4" />
          Complete Profile
        </button>
        <button
          onClick={() => navigate('/settings')}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-card border border-border text-foreground rounded-lg hover:bg-card-hover transition-colors"
        >
          <User className="w-4 h-4" />
          Account Settings
        </button>
        <button
          onClick={() => navigate('/documents')}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-card border border-border text-foreground rounded-lg hover:bg-card-hover transition-colors"
        >
          <FileText className="w-4 h-4" />
          Manage Documents
        </button>
      </motion.section>
    </div>
  );
}