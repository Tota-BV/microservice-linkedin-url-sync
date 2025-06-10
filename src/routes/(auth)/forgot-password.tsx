import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Link, createFileRoute } from "@tanstack/react-router";
import ForgotPasswordForm from "./-components/forgot-password";

export const Route = createFileRoute("/(auth)/forgot-password")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div>
      <Card className="min-w-md gap-6">
        <CardHeader>
          <CardTitle className="font-display text-2xl">
            Forgot Password
          </CardTitle>
          <CardDescription className="text-balance text-muted-foreground text-sm">
            Enter your email to recieve a link to reset your password
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <ForgotPasswordForm />
        </CardContent>
      </Card>
      <div className="mt-4 text-center text-sm">
        Dont have a account?{" "}
        <Link to="/login" className="underline">
          Login
        </Link>
      </div>
    </div>
  );
}
