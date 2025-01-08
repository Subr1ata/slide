import { currentUser } from "@clerk/nextjs/server";

export async function GET() {
  const user = await currentUser();
  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }

  return new Response(JSON.stringify(user), { status: 200 });
}
