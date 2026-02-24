import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getUserLinks } from "@/data/links";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateLinkDialog } from "./CreateLinkDialog";

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
            <Card key={link.id}>
              <CardHeader>
                <CardTitle className="text-lg truncate">
                  {link.originalUrl}
                </CardTitle>
                <CardDescription>
                  Short code: <span className="font-mono font-semibold">{link.shortCode}</span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                  <div>
                    <span className="font-medium">Created:</span>{" "}
                    {new Date(link.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                  <div>
                    <span className="font-medium">Short URL:</span>{" "}
                    <span className="font-mono">
                      {process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/{link.shortCode}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
