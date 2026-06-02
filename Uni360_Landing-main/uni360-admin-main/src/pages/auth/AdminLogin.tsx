import React, { useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { useAppDispatch } from "../../hooks/useRedux";
import { loginStart, loginSuccess, loginFailure } from "../../store/slices/authSlice";
import { authService } from "../../services/authService";
import { useToast } from "../../hooks/use-toast";

export const AdminLogin: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { toast } = useToast();

  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !pw) return;

    try {
      setIsLoading(true);
      dispatch(loginStart());
      const { user } = await authService.login({ email, password: pw });
      dispatch(loginSuccess(user as any));
      toast({
        title: "Welcome back!",
        description: `Logged in successfully as ${user.email}`,
        variant: "success",
      });
      // Only navigate if there is a 'from' state, otherwise stay on current route
      const from = location.state?.from?.pathname;
      if (from && from !== location.pathname) {
        navigate(from, { replace: true });
      }
    } catch (err: any) {
      const message = err?.message || "Unable to login. Please try again.";
      dispatch(loginFailure(message));
      toast({
        title: "Login failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md rounded-2xl backdrop-blur-md bg-white/60 border border-border shadow-uni-elegant p-8">
        <h1 className="text-2xl font-semibold text-foreground text-center">Admin Login</h1>
        <p className="text-sm text-muted-foreground text-center mt-2">Sign in to admin.</p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label className="text-sm text-muted-foreground">Email or Username</label>
            <input
              type="text"
              className="w-full mt-1 rounded-lg border border-border bg-background px-3 py-2"
              placeholder="admin@UNI360°.com or username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required />
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Password</label>
            <input
              type="password"
              className="w-full mt-1 rounded-lg border border-border bg-background px-3 py-2"
              placeholder="••••••••"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              required />
          </div>
          <button
            type="submit"
            className="w-full rounded-lg bg-primary text-primary-foreground py-2.5 font-medium disabled:opacity-60"
            disabled={isLoading}>
            {isLoading ? "Signing In..." : "Sign In"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm">
          <span className="text-muted-foreground">Partner?</span>{" "}
          <Link to="/register-b2b" className="text-primary hover:underline">Register as B2B</Link>
        </div>
      </motion.div>
    </div>
  );
};