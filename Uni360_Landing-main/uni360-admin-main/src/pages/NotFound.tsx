import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { motion } from "framer-motion";
import { AlertTriangle, Home, ArrowLeft } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-uni-gradient-secondary p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md"
      >
        <Card className="uni-card text-center">
          <CardHeader className="space-y-4">
            <motion.div 
              className="mx-auto w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center"
              whileHover={{ scale: 1.05 }}
            >
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </motion.div>
            
            <div>
              <CardTitle className="text-6xl font-bold uni-text-gradient mb-2">
                404
              </CardTitle>
              <CardDescription className="text-xl font-medium text-foreground">
                Oops! Page not found
              </CardDescription>
              <CardDescription className="text-muted-foreground mt-2">
                The page you're looking for doesn't exist or has been moved.
              </CardDescription>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
              <strong>Requested path:</strong> {location.pathname}
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                onClick={() => window.history.back()}
                variant="outline"
                className="flex-1"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go Back
              </Button>
              <Button 
                onClick={() => window.location.href = "/"}
                className="flex-1 uni-btn-primary"
              >
                <Home className="h-4 w-4 mr-2" />
                Go Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default NotFound;
