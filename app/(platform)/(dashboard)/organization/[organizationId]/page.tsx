import prisma from "@/lib/prisma";

export default async function OrganizationIdPage() {
  async function create(formData: FormData) {
    "use server";

    const title = formData.get("title") as string;

    await prisma.board.create({
      data: {
        title,
      },
    });
  }

  return (
    <div>
      <form action={create}>
        <input
          id="title"
          name="title"
          required
          placeholder="Enter a board title"
          className="p1 border border-black"
        />
      </form>
    </div>
  );
}
