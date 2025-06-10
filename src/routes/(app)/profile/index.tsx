import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import { TextViewEdit } from "@/features/agency-profile/ui/TextViewEdit";
import { VerificationAndComplaince } from "@/features/agency-profile/ui/VerificationAndComplaince";
import { Skills } from "@/features/agency-profile/ui/skills";
import { TitleAndDescription } from "@/features/agency-profile/ui/title-description";
import { Avatar, AvatarFallback, AvatarImage } from "@radix-ui/react-avatar";
import { createFileRoute } from "@tanstack/react-router";
import { CalendarDaysIcon, MapPinIcon } from "lucide-react";

export const Route = createFileRoute("/(app)/profile/")({
  component: RouteComponent,
  loader: async ({ context: { queryClient, trpc } }) => {
    const profile = await queryClient.fetchQuery(
      trpc.agency.getProfile.queryOptions(),
    );

    return { profile };
  },
});

function RouteComponent() {
  const { profile } = Route.useLoaderData();

  return (
    <div className="h-full">
      <div className="-mx-6 -mt-6">
        <img
          src="/agency-profile.webp"
          className="h-52 w-full object-cover"
          alt="profile"
        />
      </div>
      <div className="bg-background -mx-6 h-full">
        <div className="container grid gap-2">
          <div className="flex justify-between">
            <div className="-mt-15 z-10 size-30">
              <Avatar>
                <AvatarImage
                  className="rounded-lg border-4 border-white"
                  src="https://github.com/shadcn.png"
                />
                <AvatarFallback>UN</AvatarFallback>
              </Avatar>
            </div>
          </div>

          <div className="grid grid-cols-12">
            <div className="col-span-8 flex flex-col gap-10">
              <TitleAndDescription />
              <div className="flex gap-4 mt-auto">
                <div className="flex items-center gap-2">
                  <MapPinIcon size={16} />
                  <span className="text-sm text-gray-500">
                    {`${profile?.city}, ${profile?.country.name}`}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <CalendarDaysIcon size={16} />
                  <span className="text-sm text-gray-500">
                    founded April 2022
                  </span>
                </div>
              </div>
            </div>

            <div className="col-span-4 flex flex-col items-end gap-8">
              <div className="flex flex-col">
                <div className="flex items-center text-sm">
                  <span>0 Reviews (average: 0.0/5.0)</span>
                </div>
              </div>
            </div>
          </div>

          <Separator className="bg-gray-400/50" />

          <div className="grid grid-cols-12 gap-4 -mx-6">
            <div className="col-span-8 flex flex-col">
              <TextViewEdit title="Overview" name="overview" />
              <Skills />
              <VerificationAndComplaince />
              <TextViewEdit
                title="Projects and references"
                name="referencesAndProjects"
              />
            </div>

            <div className="col-span-4 flex flex-col">
              <Card>
                <CardHeader>
                  <CardTitle className="flex justify-between">
                    Office locations
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-2">
                  <div className="flex flex-col">
                    <span className="font-bold">Rotterdam, Netherlands</span>
                    <span className="text-sm text-gray-600">
                      15:30 pm GMT+1 Primary location
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex justify-between">
                    Laguages
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-2">
                  <div className="flex flex-col">
                    <span className="font-bold">Dutch</span>
                    <span className="text-sm text-gray-600">Native</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold">English</span>
                    <span className="text-sm text-gray-600">
                      Fluent, Intermediate
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Agency information</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-2">
                  <div className="flex flex-col">
                    <span className="text-sm text-gray-600">
                      Candidates on Tota
                    </span>
                    <span className="font-bold">0 candidates</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm text-gray-600">Joined</span>
                    <span className="font-bold">2025</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
