import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getUserLinks } from "@/data/links";
import { Card, CardContent } from "@/components/ui/card";
import { CreateLinkDialog } from "./CreateLinkDialog";
import { LinkItem } from "./LinkItem";

export default async function DashboardPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/");
  }

  const userLinks = await getUserLinks(userId);

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your shortened links
          </p>
        </div>
        <CreateLinkDialog />
      </div>

      {userLinks.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <p className="text-muted-foreground text-lg">
              No links yet. Create your first shortened link to get started!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold mb-4">
            Your Links ({userLinks.length})
          </h2>
          {userLinks.map((link) => (
            <LinkItem key={link.id} link={link} />
          ))}
        </div>
      )}
    </div>
  );
}
