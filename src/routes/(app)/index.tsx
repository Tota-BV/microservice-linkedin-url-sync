import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createFileRoute } from "@tanstack/react-router";
import {
  Building2Icon,
  CalendarCheckIcon,
  MessageCircleMoreIcon,
  MoveDownLeftIcon,
  MoveUpIcon,
  MoveUpRightIcon,
  ReceiptTextIcon,
  StarIcon,
  UserRoundSearchIcon,
} from "lucide-react";

export const Route = createFileRoute("/(app)/")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="container grid gap-8">
      <h1 className="text-4xl">Dashboard</h1>

      <div className="grid grid-cols-12 gap-4">
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle className="flex items-end gap-2">
              <Building2Icon />
              Company Views
            </CardTitle>
          </CardHeader>
          <CardContent className="flex gap-2 items-center">
            <span className="text-3xl font-bold">789</span>
            <MoveUpRightIcon size={20} color="green" />
          </CardContent>
        </Card>
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle className="flex items-end gap-2">
              <UserRoundSearchIcon />
              Candidate Views
            </CardTitle>
          </CardHeader>
          <CardContent className="flex gap-2 items-center">
            <span className="text-3xl font-bold">529</span>
            <MoveDownLeftIcon size={20} color="red" />
          </CardContent>
        </Card>
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle className="flex items-end gap-2">
              <CalendarCheckIcon />
              Schedule checks
            </CardTitle>
          </CardHeader>
          <CardContent className="flex gap-2 items-center">
            <span className="text-3xl font-bold">149</span>
            <MoveUpRightIcon size={20} color="green" />
          </CardContent>
        </Card>
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle className="flex items-end gap-2">
              <MessageCircleMoreIcon />
              Chats
            </CardTitle>
          </CardHeader>
          <CardContent className="flex gap-2 items-center">
            <span className="text-3xl font-bold">79</span>
            <MoveDownLeftIcon size={20} color="red" />
          </CardContent>
        </Card>
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle className="flex items-end gap-2">
              <ReceiptTextIcon />
              Contracts
            </CardTitle>
          </CardHeader>
          <CardContent className="flex gap-2 items-center">
            <span className="text-3xl font-bold">55</span>
            <MoveUpRightIcon size={20} color="green" />
          </CardContent>
        </Card>
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle className="flex items-end gap-2">
              <StarIcon />
              Reviews
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 items-center">
              <span className="text-3xl font-bold">1259</span>
              <MoveUpRightIcon size={20} color="green" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-12 gap-4">
        <div className="grid gap-2 col-span-6">
          <h2 className="text-2xl">Candidates</h2>
          <Card>
            <CardHeader>
              <CardTitle>Card 1</CardTitle>
            </CardHeader>
            <CardContent>
              General information push / newsletter vibe
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-2 col-span-6">
          <h2 className="text-2xl">Actions</h2>
          <Card>
            <CardHeader>
              <CardTitle>Card 3</CardTitle>
            </CardHeader>
            <CardContent>
              Actions per company Verlengstuk van hierboven (onboardings steps
              or schedule checks etc.)
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4">
        <div className="grid gap-2 col-span-6">
          <h2 className="text-2xl">New job posts</h2>
          <Card>
            <CardHeader>
              <CardTitle>Card 1</CardTitle>
            </CardHeader>
            <CardContent>
              General information push / newsletter vibe
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-2 col-span-6">
          <h2 className="text-2xl">Articles and blogs</h2>
          <Card>
            <CardHeader>
              <CardTitle>Card 3</CardTitle>
            </CardHeader>
            <CardContent>
              Actions per company Verlengstuk van hierboven (onboardings steps
              or schedule checks etc.)
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
