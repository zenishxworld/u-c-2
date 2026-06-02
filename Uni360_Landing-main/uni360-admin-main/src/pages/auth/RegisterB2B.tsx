import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, User } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { useToast } from "../../hooks/use-toast";

export const RegisterB2B: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const un = username.trim();
    const em = email.trim();
    
    if (!un || !em) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    // Navigate to onboarding modal with username and email
    setTimeout(() => {
      navigate("/b2b-onboarding", {
        state: { username: un, email: em }
      });
      setIsSubmitting(false);
    }, 300);
  };

  return (
    <div className="relative h-screen flex items-center justify-center overflow-y-auto p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-orange-50 via-blue-50 to-amber-50">
        <div className="absolute top-20 left-20 w-[600px] h-[600px] bg-gradient-to-br from-[#E08D3C]/30 to-amber-400/20 rounded-full filter blur-3xl animate-float"></div>
        <div className="absolute bottom-20 right-20 w-[500px] h-[500px] bg-gradient-to-br from-[#9DB4C0]/40 to-blue-300/30 rounded-full filter blur-3xl animate-float-delay"></div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-md z-10"
        style={{ perspective: '1200px' }}>
        
        <div className="absolute -inset-8 bg-gradient-to-r from-[#E08D3C]/20 via-amber-400/20 to-[#9DB4C0]/20 rounded-[3rem] blur-3xl animate-pulse-slow"></div>
        
        <motion.div
          whileHover={{ 
            rotateX: 2, 
            rotateY: 2,
            scale: 1.01,
            transition: { duration: 0.3 }
          }}
          style={{ transformStyle: 'preserve-3d' }}
        >
          <Card className="relative backdrop-blur-2xl bg-white/70 border-2 border-white/60 shadow-[0_20px_80px_-20px_rgba(224,141,60,0.4)] rounded-3xl overflow-hidden" style={{ transform: 'translateZ(50px)' }}>
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-[#E08D3C] via-amber-400 to-[#9DB4C0] opacity-20 blur-sm"></div>

            <CardHeader className="text-center space-y-3 relative z-10 px-8 pt-8">
              <motion.div className="mx-auto w-28 h-28 rounded-3xl -mt-4 flex items-center justify-center relative overflow-hidden translate-y-8">
                <img src="/UNI360° lOGO (3).png" alt="UNI360° Logo" className="w-full h-full object-contain" />
              </motion.div>

              <div>
                <CardTitle className="text-2xl font-bold text-[#2C4251]">
                  Join UNI360°
                </CardTitle>
                <CardDescription className="mt-2 text-[#2C4251] text-sm font-medium">
                  Admin Registration
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent className="space-y-5 relative z-10 px-8 pb-8">
              <div className="space-y-4">
                <div className="space-y-1">
                  <Label htmlFor="username" className="text-sm font-semibold text-[#2C4251]">
                    Username
                  </Label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#2C4251]/50 group-focus-within:text-[#E08D3C] transition-all duration-300" />
                    <Input
                      id="username"
                      type="text"
                      placeholder="Enter your username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="pl-12 h-10 rounded-xl bg-white/60 border-2 border-[#2C4251]/20 text-[#2C4251] placeholder-[#2C4251]/40 focus-visible:ring-2 focus-visible:ring-[#E08D3C]/40 focus-visible:border-[#E08D3C] transition-all shadow-sm hover:shadow-md"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="email" className="text-sm font-semibold text-[#2C4251]">
                    Email Address
                  </Label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#2C4251]/50 group-focus-within:text-[#E08D3C] transition-all duration-300" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-12 h-10 rounded-xl bg-white/60 border-2 border-[#2C4251]/20 text-[#2C4251] placeholder-[#2C4251]/40 focus-visible:ring-2 focus-visible:ring-[#E08D3C]/40 focus-visible:border-[#E08D3C] transition-all shadow-sm hover:shadow-md"
                      required
                    />
                  </div>
                </div>

                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    onClick={onSubmit}
                    className="w-full h-10 rounded-xl bg-gradient-to-r from-[#E08D3C] via-amber-500 to-[#E08D3C] bg-[length:200%_auto] text-white shadow-[0_10px_30px_-5px_rgba(224,141,60,0.5)] hover:shadow-[0_15px_40px_-5px_rgba(224,141,60,0.6)] transition-all duration-300 font-semibold text-base animate-gradient-slow border-0"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Processing...</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4" />
                        <span>Continue →</span>
                      </div>
                    )}
                  </Button>
                </motion.div>
              </div>

              <div className="mt-3" />

              <Link to="/login">
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button className="w-full h-10 rounded-xl bg-gradient-to-r from-[#9DB4C0] via-[#C4D7E0] to-[#9DB4C0] bg-[length:200%_auto] text-[#2C4251] hover:shadow-[0_10px_30px_-5px_rgba(157,180,192,0.5)] transition-all duration-300 border-0 font-semibold text-base shadow-md animate-gradient-slow">
                    Log in here
                  </Button>
                </motion.div>
              </Link>
            </CardContent>

            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/50 via-transparent to-transparent pointer-events-none"></div>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
};