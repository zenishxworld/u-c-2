import React from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, AlertTriangle, Info, AlertCircle, X } from "lucide-react";

export const ToastDemo: React.FC = () => {
  const { toast } = useToast();

  const showDefaultToast = () => {
    toast({
      title: "Default Toast",
      description: "This is a default toast notification.",
    });
  };

  const showSuccessToast = () => {
    toast({
      title: "Success!",
      description: "Your action was completed successfully.",
      variant: "success",
    });
  };

  const showWarningToast = () => {
    toast({
      title: "Warning",
      description: "Please review your input before proceeding.",
      variant: "warning",
    });
  };

  const showInfoToast = () => {
    toast({
      title: "Information",
      description: "Here's some helpful information for you.",
      variant: "info",
    });
  };

  const showErrorToast = () => {
    toast({
      title: "Error",
      description: "Something went wrong. Please try again.",
      variant: "destructive",
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-2">
        <h1 className="text-3xl font-bold">Toast Notifications Demo</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5 text-blue-600" />
            Toast Variants with Accents
          </CardTitle>
          <CardDescription>
            Test all the available toast notification variants with their accent
            colors. All alert() calls have been replaced with these styled toast
            messages.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Button
                onClick={showDefaultToast}
                variant="outline"
                className="w-full">
                Default Toast
              </Button>
              <p className="text-sm text-muted-foreground">
                Standard toast without accent colors
              </p>
            </div>

            <div className="space-y-2">
              <Button
                onClick={showSuccessToast}
                className="w-full bg-green-600 hover:bg-green-700">
                <CheckCircle className="h-4 w-4 mr-2" />
                Success Toast
              </Button>
              <p className="text-sm text-muted-foreground">
                Green accent for successful actions
              </p>
            </div>

            <div className="space-y-2">
              <Button
                onClick={showWarningToast}
                className="w-full bg-yellow-600 hover:bg-yellow-700">
                <AlertTriangle className="h-4 w-4 mr-2" />
                Warning Toast
              </Button>
              <p className="text-sm text-muted-foreground">
                Yellow accent for warnings
              </p>
            </div>

            <div className="space-y-2">
              <Button
                onClick={showInfoToast}
                className="w-full bg-blue-600 hover:bg-blue-700">
                <Info className="h-4 w-4 mr-2" />
                Info Toast
              </Button>
              <p className="text-sm text-muted-foreground">
                Blue accent for informational messages
              </p>
            </div>

            <div className="space-y-2">
              <Button
                onClick={showErrorToast}
                variant="destructive"
                className="w-full">
                <X className="h-4 w-4 mr-2" />
                Error Toast
              </Button>
              <p className="text-sm text-muted-foreground">
                Red accent for errors and failures
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Implementation Examples</CardTitle>
          <CardDescription>
            Here are examples of where these toast variants are now used
            throughout the application:
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="border-l-4 border-green-500 pl-4">
              <h4 className="font-semibold text-green-800">Success Toasts</h4>
              <ul className="text-sm text-green-700 space-y-1">
                <li>
                  • Student notification sent (ApplicationDetails &
                  StudentDetails)
                </li>
                <li>• Successful login (Login page)</li>
                <li>• Account creation (Signup page)</li>
                <li>• University added to wishlist</li>
              </ul>
            </div>

            <div className="border-l-4 border-yellow-500 pl-4">
              <h4 className="font-semibold text-yellow-800">Warning Toasts</h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• University removed from wishlist</li>
              </ul>
            </div>

            <div className="border-l-4 border-blue-500 pl-4">
              <h4 className="font-semibold text-blue-800">Info Toasts</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• New application guidance (Applications page)</li>
                <li>• Google OAuth coming soon messages</li>
              </ul>
            </div>

            <div className="border-l-4 border-red-500 pl-4">
              <h4 className="font-semibold text-red-800">Error Toasts</h4>
              <ul className="text-sm text-red-700 space-y-1">
                <li>• Login failures</li>
                <li>• Signup failures</li>
                <li>• Password mismatch errors</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
