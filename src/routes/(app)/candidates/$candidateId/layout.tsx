import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Outlet, createFileRoute, useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/(app)/candidates/$candidateId")({
  component: RouteComponent,
  loader: async ({ context: { queryClient, trpc }, params }) => {
    const candidate = await queryClient.fetchQuery(
      trpc.candidate.getOne.queryOptions({ candidateId: params.candidateId }),
    );

    return { candidate };
  },
});

function RouteComponent() {
  const { candidate } = Route.useLoaderData();

  const nav = useNavigate();

  return (
    <div className="h-full">
      <div className="-mx-6 -mt-6">
        <img
          src="/agency-profile.webp"
          className="h-52 w-full object-cover"
          alt="profile"
        />
      </div>
      <div className="-mx-6 h-full bg-background">
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
              <h1 className="font-bold text-3xl">{`${candidate?.name} ${candidate?.surname}`}</h1>
              <div className="mt-auto flex gap-4">
                <Tabs
                  defaultValue="profile"
                  onValueChange={(value) => {
                    const val = value as "profile" | "matching-criteria";
                    nav({ to: `/candidates/$candidateId/${val}` });
                  }}
                >
                  <TabsList>
                    <TabsTrigger value="profile">Profile</TabsTrigger>
                    <TabsTrigger value="matching-criteria">
                      Matching criteria
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </div>
            <div className="col-span-4 flex flex-col items-end justify-between gap-8">
              <div className="flex flex-col">
                <Button>Valido invite</Button>
              </div>
            </div>
          </div>
          <Separator className="bg-gray-400/50" />
          <Outlet />
        </div>
      </div>
    </div>
  );
}
