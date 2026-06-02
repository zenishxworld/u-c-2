import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, EyeOff, Mail, Lock, LogIn } from "lucide-react";
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
import { useAppDispatch, useAppSelector } from "../../hooks/useRedux";
import {
  loginStart,
  loginSuccess,
  loginFailure,
} from "../../store/slices/authSlice";
import { authService } from "../../services/authService";
import { useToast } from "../../hooks/use-toast";

export const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  
  // ✅ Get auth state from Redux
  const { isAuthenticated } = useAppSelector(s => s.auth);

  // ✅ Get the page user tried to access before being redirected to login
  const from = (location.state as any)?.from || "/dashboard";

  // ✅ Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      console.log("✅ Already authenticated, redirecting to:", from);
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: "Missing fields",
        description: "Please enter both email/username and password",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    dispatch(loginStart());

    try {
      const { user } = await authService.login({ email, password });
      
      dispatch(loginSuccess(user));
      
      toast({
        title: "Welcome back!",
        description: `Logged in successfully as ${user.name}`,
        variant: "default",
      });
      
      // ✅ Navigate to the page user originally tried to access
      console.log("✅ Login successful, redirecting to:", from);
      navigate(from, { replace: true });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Login failed";
      
      dispatch(loginFailure(errorMessage));
      
      toast({
        title: "Login failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    toast({
      title: "Google OAuth",
      description: "Google authentication will be implemented soon!",
      variant: "default",
    });
  };

  return (
    <div className="relative h-screen flex items-center justify-center overflow-y-auto p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-orange-50 via-blue-50 to-amber-50">
        <div className="absolute top-20 left-20 w-[600px] h-[600px] bg-gradient-to-br from-[#E08D3C]/30 to-amber-400/20 rounded-full filter blur-3xl animate-float"></div>
        <div className="absolute bottom-20 right-20 w-[500px] h-[500px] bg-gradient-to-br from-[#9DB4C0]/40 to-blue-300/30 rounded-full filter blur-3xl animate-float-delay"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-gradient-to-br from-orange-200/20 to-[#C4D7E0]/20 rounded-full filter blur-3xl animate-pulse-slow"></div>
      </div>

      <div className="absolute inset-0 opacity-[0.03] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbHRlcj0idXJsKCNhKSIvPjwvc3ZnPg==')]"></div>

      <div className="absolute inset-0">
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className={`absolute w-2 h-2 rounded-full ${i % 3 === 0 ? 'bg-[#E08D3C]/30' : i % 3 === 1 ? 'bg-[#9DB4C0]/30' : 'bg-amber-400/30'}`}
            initial={{ 
              x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000), 
              y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 1000),
            }}
            animate={{
              y: [null, Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 1000)],
              x: [null, Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000)],
              opacity: [0.1, 0.5, 0.1],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: Math.random() * 15 + 10,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-md z-10"
        style={{ perspective: '1200px' }}>
        
        <div className="absolute -inset-8 bg-gradient-to-r from-[#E08D3C]/20 via-amber-400/20 to-[#9DB4C0]/20 rounded-[3rem] blur-3xl animate-pulse-slow"></div>
        <div className="absolute -inset-4 bg-gradient-to-br from-[#E08D3C]/30 to-[#9DB4C0]/30 rounded-[2.5rem] blur-2xl"></div>
        
        <motion.div
          whileHover={{ 
            rotateX: 2, 
            rotateY: 2,
            scale: 1.01,
            transition: { duration: 0.3 }
          }}
          style={{ transformStyle: 'preserve-3d' }}
        >
          <Card className="relative backdrop-blur-2xl bg-white/95 border-2 border-white/80 shadow-[0_20px_80px_-20px_rgba(224,141,60,0.4)] rounded-3xl overflow-hidden" style={{ transform: 'translateZ(50px)' }}>
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-[#E08D3C] via-amber-400 to-[#9DB4C0] opacity-10 blur-sm"></div>
            <div className="absolute inset-0 -top-[100%] h-[200%] w-full bg-gradient-to-b from-transparent via-white/10 to-transparent skew-y-12 animate-shimmer"></div>

            <CardHeader className="text-center space-y-3 relative z-10 px-8 pt-8">
              <motion.div className="mx-auto w-24 h-24 rounded-3xl -mt-4 flex items-center justify-center relative overflow-hidden translate-y-8">
                <img src="/UNI360 lOGO (3).png" alt="UNI360 Logo" className="w-full h-full object-contain" />
              </motion.div>

              <div>
                <CardTitle className="text-2xl font-bold text-[#2C4251]">
                  Welcome to UNI360°
                </CardTitle>
                <CardDescription className="mt-2 text-[#2C4251] text-sm font-medium">
                  {from !== "/dashboard" ? `Sign In to access ${from}` : "Sign In to your account"}
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent className="space-y-5 relative z-10 px-8 pb-8">
              

              

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1">
                  <Label htmlFor="email" className="text-sm font-semibold text-[#2C4251]">
                    Email or Username
                  </Label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#2C4251]/70 group-focus-within:text-[#E08D3C] transition-all duration-300" />
                    <Input
                      id="email"
                      type="text"
                      placeholder="Enter your email or username"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-12 h-10 rounded-xl bg-white/90 border-2 border-[#2C4251]/20 text-[#2C4251] placeholder-[#2C4251]/50 focus-visible:ring-2 focus-visible:ring-[#E08D3C]/40 focus-visible:border-[#E08D3C] transition-all shadow-sm hover:shadow-md"
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="password" className="text-sm font-semibold text-[#2C4251]">
                    Password
                  </Label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#2C4251]/70 group-focus-within:text-[#E08D3C] transition-all duration-300" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-12 pr-12 h-10 rounded-xl bg-white/60 border-2 border-[#2C4251]/20 text-[#2C4251] placeholder-[#2C4251]/50 focus-visible:ring-2 focus-visible:ring-[#E08D3C]/40 focus-visible:border-[#E08D3C] transition-all shadow-sm hover:shadow-md"
                      required
                      disabled={isLoading}
                    />
                    <Button
                      type="button"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 text-[#2C4251]/70 hover:text-[#E08D3C] hover:bg-[#E08D3C]/10 rounded-lg transition-all"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={isLoading}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    type="submit"
                    className="w-full h-10 rounded-xl bg-gradient-to-r from-[#E08D3C] via-amber-500 to-[#E08D3C] bg-[length:200%_auto] text-white shadow-[0_10px_30px_-5px_rgba(224,141,60,0.5)] hover:shadow-[0_15px_40px_-5px_rgba(224,141,60,0.6)] transition-all duration-300 font-semibold text-base animate-gradient-slow border-0"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Signing in...</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <LogIn className="h-4 w-4" />
                        <span>Admin Login</span>
                      </div>
                    )}
                  </Button>
                </motion.div>
              </form>

              <div className="mt-3" />

              
            </CardContent>

            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/50 via-transparent to-transparent pointer-events-none"></div>
          </Card>
        </motion.div>

        <div className="absolute -inset-6 bg-gradient-to-r from-[#E08D3C]/10 via-transparent to-[#9DB4C0]/10 rounded-[3rem] blur-2xl -z-10 animate-pulse-slow"></div>
      </motion.div>
    </div>
  );
};