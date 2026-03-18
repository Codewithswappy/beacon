"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import Image from "next/image";
import { DuoIcon } from "@/components/ui/DuoIcon";

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: any;
  user: any;
  onSave: (data: any) => Promise<void>;
  onAvatarClick: () => void;
  onCoverClick: () => void;
}

export function EditProfileModal({ 
  isOpen, 
  onClose, 
  profile, 
  user, 
  onSave, 
  onAvatarClick, 
  onCoverClick 
}: EditProfileModalProps) {
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || "",
    username: profile?.username || "",
    email: user?.email || "",
    bio: profile?.bio || "",
    location: profile?.location || "",
    website: profile?.website || "",
    profession: profile?.profession || "Designer",
    birthdate: profile?.birthdate || "",
    isProfessionVisible: profile?.is_profession_visible ?? true,
    isBirthdateVisible: profile?.is_birthdate_visible ?? false
  });
  const [loading, setLoading] = useState(false);
  const [showProfessionSuggestions, setShowProfessionSuggestions] = useState(false);
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);

  const professionOptions = [
    "Frontend Developer", "Backend Developer", "Full Stack Developer", "Software Engineer", 
    "Web Developer", "Mobile App Developer", "Android Developer", "iOS Developer", 
    "Game Developer", "AI Engineer", "Machine Learning Engineer", "Data Scientist", 
    "DevOps Engineer", "Cloud Engineer", "Security Engineer", "Blockchain Developer", 
    "Embedded Systems Engineer", "Site Reliability Engineer", "Data Engineer", "API Developer", 
    "UI Designer", "UX Designer", "Product Designer", "Visual Designer", "Interaction Designer", 
    "Design Engineer", "Motion Designer", "3D Designer", "Graphic Designer", "Brand Designer", 
    "Creative Developer", "UI Engineer", "Frontend Engineer", "Software Architect", 
    "Technical Lead", "Engineering Manager", "Startup Founder", "Indie Hacker", 
    "Open Source Maintainer", "Tech Educator", "Technical Writer", "Developer Advocate", 
    "Product Manager", "Technical Product Manager", "QA Engineer", "Automation Engineer", 
    "Test Engineer", "Game Designer", "AR/VR Developer", "Robotics Engineer", "IoT Developer"
  ];

  const locationOptions = [
    "San Francisco, USA", "New York, USA", "Los Angeles, USA", "Seattle, USA", "Austin, USA", 
    "Boston, USA", "Chicago, USA", "Toronto, Canada", "Vancouver, Canada", "London, UK", 
    "Manchester, UK", "Berlin, Germany", "Munich, Germany", "Amsterdam, Netherlands", 
    "Paris, France", "Barcelona, Spain", "Madrid, Spain", "Lisbon, Portugal", "Stockholm, Sweden", 
    "Copenhagen, Denmark", "Zurich, Switzerland", "Vienna, Austria", "Dublin, Ireland", 
    "Prague, Czech Republic", "Warsaw, Poland", "Budapest, Hungary", "Bangalore, India", 
    "Mumbai, India", "Delhi, India", "Hyderabad, India", "Pune, India", "Chennai, India", 
    "Kolkata, India", "Ahmedabad, India", "Jaipur, India", "Singapore", "Tokyo, Japan", 
    "Osaka, Japan", "Seoul, South Korea", "Shanghai, China", "Beijing, China", "Shenzhen, China", 
    "Hong Kong", "Taipei, Taiwan", "Sydney, Australia", "Melbourne, Australia", 
    "Auckland, New Zealand", "Dubai, UAE", "Abu Dhabi, UAE", "Tel Aviv, Israel", 
    "Istanbul, Turkey", "Cape Town, South Africa", "Johannesburg, South Africa", 
    "São Paulo, Brazil", "Rio de Janeiro, Brazil", "Buenos Aires, Argentina", 
    "Mexico City, Mexico", "Lagos, Nigeria", "Nairobi, Kenya"
  ];

  useEffect(() => {
    if (profile) {
      setFormData(prev => ({
        ...prev,
        full_name: profile.full_name || "",
        username: profile.username || "",
        bio: profile.bio || "",
        location: profile.location || "",
        website: profile.website || "",
        profession: profile.profession || "Designer",
        birthdate: profile.birthdate || "",
        isProfessionVisible: profile.is_profession_visible ?? true,
        isBirthdateVisible: profile.is_birthdate_visible ?? false
      }));
    }
  }, [profile]);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await onSave(formData);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6">
          {/* Backdrop Blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-[700px] max-h-[90vh] overflow-y-auto scrollbar-hide bg-white dark:bg-neutral-900 rounded-[40px] shadow-2xl overflow-hidden"
          >
            {/* 1. Header Area with Cover & Avatar */}
            <div className="relative h-[180px] md:h-[220px] px-8 pt-8">
              <div className="absolute inset-0 m-4 overflow-hidden rounded-[32px] bg-neutral-200 dark:bg-neutral-800">
                {profile?.cover_url ? (
                  <Image
                    src={profile.cover_url}
                    alt="Cover"
                    fill
                    className="object-cover opacity-80"
                  />
                ) : (
                  <div className="h-full w-full bg-linear-to-br from-neutral-100 to-neutral-200 dark:from-neutral-800 dark:to-neutral-900 opacity-80" />
                )}
                <div 
                  onClick={onCoverClick}
                  className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 hover:opacity-100 transition-opacity cursor-pointer group"
                >
                  <DuoIcon name="photoPlus" size={42} className="text-white drop-shadow-lg scale-90 group-hover:scale-100 transition-transform" />
                </div>
              </div>
              
              <div className="absolute -bottom-14 left-10">
                <div 
                  onClick={onAvatarClick}
                  className="relative group cursor-pointer"
                >
                  <div className="w-[110px] h-[110px] md:w-[130px] md:h-[130px] rounded-full border-[6px] border-white dark:border-neutral-900 bg-neutral-100 dark:bg-neutral-800 overflow-hidden shadow-xl flex items-center justify-center">
                    {profile?.avatar_url ? (
                      <Image
                        src={profile.avatar_url}
                        alt="Avatar"
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <DuoIcon name="userDefault" size={48} className="text-neutral-400 md:scale-125" />
                    )}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
                      <DuoIcon name="photoPlus" size={32} className="text-white scale-90 group-hover:scale-100 transition-transform" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Identity Section */}
            <div className="px-10 mt-16">
              <h2 className="text-[26px] font-extrabold text-foreground">Edit Profile</h2>
              <p className="text-neutral-400 font-medium">Keep your profile fresh and updated.</p>
            </div>

            {/* 3. Form Section */}
            <div className="px-10 py-8 space-y-6">
              
              {/* Name & Username Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[15px] font-bold text-foreground ml-1">Full Name</label>
                  <input
                    type="text"
                    className="w-full px-5 h-[52px] bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-black/5 dark:focus:ring-white/5 transition-all font-medium"
                    value={formData.full_name}
                    onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[15px] font-bold text-foreground ml-1">Username</label>
                  <input
                    type="text"
                    className="w-full px-5 h-[52px] bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-black/5 dark:focus:ring-white/5 transition-all font-medium"
                    value={formData.username}
                    onChange={(e) => setFormData({...formData, username: e.target.value})}
                  />
                </div>
              </div>

              {/* Bio Field Overlay */}
              <div className="space-y-2">
                <label className="text-[15px] font-bold text-foreground ml-1">Bio</label>
                <textarea
                  rows={3}
                  className="w-full px-5 py-4 bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-black/5 dark:focus:ring-white/5 transition-all font-medium resize-none"
                  value={formData.bio}
                  onChange={(e) => setFormData({...formData, bio: e.target.value})}
                  placeholder="Tell us about yourself..."
                />
              </div>

              {/* Professional Category & Birthdate */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 relative">
                  <div className="flex items-center justify-between ml-1">
                    <label className="text-[15px] font-bold text-foreground">Category / Profession</label>
                    <button 
                      onClick={() => setFormData({...formData, isProfessionVisible: !formData.isProfessionVisible})}
                      className={`w-10 h-5 rounded-full relative transition-colors ${formData.isProfessionVisible ? 'bg-neutral-900 dark:bg-white' : 'bg-neutral-200 dark:bg-neutral-700'}`}
                    >
                       <div className={`absolute top-0.5 w-4 h-4 rounded-full transition-all ${formData.isProfessionVisible ? 'right-0.5 bg-white dark:bg-black' : 'left-0.5 bg-white'}`} />
                    </button>
                  </div>
                  <input
                    type="text"
                    className="w-full px-5 h-[52px] bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-black/5 dark:focus:ring-white/5 transition-all font-medium"
                    value={formData.profession}
                    onChange={(e) => {
                      setFormData({...formData, profession: e.target.value});
                      setShowProfessionSuggestions(true);
                    }}
                    onFocus={() => setShowProfessionSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowProfessionSuggestions(false), 200)}
                  />
                  <AnimatePresence>
                    {showProfessionSuggestions && formData.profession && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute left-0 right-0 top-full mt-2 bg-white dark:bg-neutral-800 border border-neutral-100 dark:border-neutral-700 rounded-2xl shadow-xl z-20 overflow-hidden max-h-[200px] overflow-y-auto"
                      >
                        {professionOptions.filter(opt => opt.toLowerCase().includes(formData.profession.toLowerCase())).map(opt => (
                          <button 
                            key={opt}
                            onClick={() => {
                              setFormData({...formData, profession: opt});
                              setShowProfessionSuggestions(false);
                            }}
                            className="w-full text-left px-5 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors font-medium text-foreground"
                          >
                            {opt}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between ml-1">
                    <label className="text-[15px] font-bold text-foreground">Birthdate</label>
                    <button 
                      onClick={() => setFormData({...formData, isBirthdateVisible: !formData.isBirthdateVisible})}
                      className={`w-10 h-5 rounded-full relative transition-colors ${formData.isBirthdateVisible ? 'bg-neutral-900 dark:bg-white' : 'bg-neutral-200 dark:bg-neutral-700'}`}
                    >
                       <div className={`absolute top-0.5 w-4 h-4 rounded-full transition-all ${formData.isBirthdateVisible ? 'right-0.5 bg-white dark:bg-black' : 'left-0.5 bg-white'}`} />
                    </button>
                  </div>
                  <input
                    type="date"
                    className="w-full px-5 h-[52px] bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-black/5 dark:focus:ring-white/5 transition-all font-medium"
                    value={formData.birthdate}
                    onChange={(e) => setFormData({...formData, birthdate: e.target.value})}
                  />
                </div>
              </div>

               {/* Location & Website Row */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 relative">
                  <label className="text-[15px] font-bold text-foreground ml-1">Location</label>
                  <input
                    type="text"
                    className="w-full px-5 h-[52px] bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-black/5 dark:focus:ring-white/5 transition-all font-medium"
                    value={formData.location}
                    onChange={(e) => {
                      setFormData({...formData, location: e.target.value});
                      setShowLocationSuggestions(true);
                    }}
                    onFocus={() => setShowLocationSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowLocationSuggestions(false), 200)}
                  />
                   <AnimatePresence>
                    {showLocationSuggestions && formData.location && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute left-0 right-0 top-full mt-2 bg-white dark:bg-neutral-800 border border-neutral-100 dark:border-neutral-700 rounded-2xl shadow-xl z-20 overflow-hidden max-h-[200px] overflow-y-auto"
                      >
                        {locationOptions.filter(opt => opt.toLowerCase().includes(formData.location.toLowerCase())).map(opt => (
                          <button 
                            key={opt}
                            onClick={() => {
                              setFormData({...formData, location: opt});
                              setShowLocationSuggestions(false);
                            }}
                            className="w-full text-left px-5 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors font-medium text-foreground"
                          >
                            {opt}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <div className="space-y-2">
                  <label className="text-[15px] font-bold text-foreground ml-1">Website</label>
                  <input
                    type="url"
                    className="w-full px-5 h-[52px] bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-black/5 dark:focus:ring-white/5 transition-all font-medium"
                    value={formData.website}
                    onChange={(e) => setFormData({...formData, website: e.target.value})}
                  />
                </div>
              </div>
            </div>

            {/* 4. Footer Actions */}
            <div className="px-10 py-8 border-t border-neutral-100 dark:border-neutral-800 flex justify-end gap-3 mt-4">
               <button 
                onClick={onClose}
                className="px-8 h-[52px] font-bold text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 rounded-2xl transition-all active:scale-95"
               >
                 Discard
               </button>
               <button 
                onClick={handleSubmit}
                disabled={loading}
                className="px-8 h-[52px] font-bold bg-neutral-950 dark:bg-white text-white dark:text-black rounded-2xl shadow-xl hover:shadow-black/10 dark:hover:shadow-white/10 transition-all active:scale-95 flex items-center gap-2"
               >
                 {loading ? <IconLoader2 className="animate-spin" size={20} /> : 'Save Changes'}
               </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
function IconLoader2({ className, size }: { className?: string; size?: number }) {
  return (
    <svg 
      className={className} 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}
