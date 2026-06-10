import { useState, useMemo, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { authService } from "@/services/authService";
import { Loader2, UserPlus, ArrowRight, Check, X, Eye, EyeOff } from "lucide-react";
import { toast } from "react-hot-toast";

export default function RegisterPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Password requirements validation
  const passwordRules = useMemo(() => {
    const pw = formData.password;
    const cpw = formData.confirmPassword;
    return [
      { label: "At least 8 characters", met: pw.length >= 8 },
      { label: "One uppercase letter (A-Z)", met: /[A-Z]/.test(pw) },
      { label: "One lowercase letter (a-z)", met: /[a-z]/.test(pw) },
      {
        label: "One special character (@, #, $, etc.)",
        met: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(pw),
      },
      {
        label: "Passwords match",
        met: pw.length > 0 && pw === cpw,
      },
    ];
  }, [formData.password, formData.confirmPassword]);

  const allRulesMet = passwordRules.every((r) => r.met);
  const hasStartedPassword = formData.password.length > 0;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!allRulesMet) return;
    setLoading(true);

    try {
      const { name, email, password } = formData;
      const response = await authService.register({ name, email, password });
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.user));
      toast.success(`Welcome to TaskFlow, ${response.data.user.name}!`);
      navigate("/dashboard");
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      const errMsg =
        axiosError.response?.data?.message ||
        "Registration failed. Please try again.";
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/40 p-4">
      {/* Decorative background elements */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="w-full max-w-md relative">
        {/* Logo / Brand */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary text-primary-foreground mb-4">
            <UserPlus className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            Create an account
          </h1>
          <p className="text-muted-foreground mt-1">
            Get started with your Task Manager
          </p>
        </div>

        <Card className="shadow-lg shadow-black/5 border-border/60">
          <CardHeader>
            <CardTitle>Register</CardTitle>
            <CardDescription>
              Fill in your details to create your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="register-name">Full Name</Label>
                <Input
                  id="register-name"
                  type="text"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                  disabled={loading}
                  className="h-10"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="register-email">Email</Label>
                <Input
                  id="register-email"
                  type="email"
                  placeholder="john@example.com"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  required
                  disabled={loading}
                  className="h-10"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="register-password">Password</Label>
                <div className="relative">
                  <Input
                    id="register-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    required
                    disabled={loading}
                    className="h-10 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="register-confirm-password">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="register-confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        confirmPassword: e.target.value,
                      })
                    }
                    required
                    disabled={loading}
                    className="h-10 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmPassword(!showConfirmPassword)
                    }
                    disabled={loading}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none transition-colors"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Password Requirements Checklist */}
              {hasStartedPassword && (
                <div className="mt-3 space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
                  {passwordRules.map((rule) => (
                    <div
                      key={rule.label}
                      className={`flex items-center gap-2 text-xs transition-colors duration-300 ${
                        rule.met ? "text-emerald-600" : "text-red-500"
                      }`}
                    >
                      <div
                        className={`flex items-center justify-center w-4 h-4 rounded-full transition-all duration-300 ${
                          rule.met
                            ? "bg-emerald-100 text-emerald-600"
                            : "bg-red-100 text-red-500"
                        }`}
                      >
                        {rule.met ? (
                          <Check className="w-3 h-3" />
                        ) : (
                          <X className="w-3 h-3" />
                        )}
                      </div>
                      {rule.label}
                    </div>
                  ))}
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-10 mt-2"
                disabled={loading || (hasStartedPassword && !allRulesMet)}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating account…
                  </>
                ) : (
                  <>
                    Create Account
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link
                to="/login"
                className="text-primary font-medium hover:underline underline-offset-4 transition-colors"
              >
                Sign in
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
