import { create } from "@/actions/create-board";
import { Button } from "@/components/ui/button";
import prisma from "@/lib/prisma";
import Board from "./board";

export default async function OrganizationIdPage() {
  const boards = await prisma.board.findMany();

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
        <Button type="submit">Submit</Button>
      </form>
      <div className="space-y-2">
        {boards.map((board) => (
          <Board key={board.id} id={board.id} title={board.title} />
        ))}
      </div>
    </div>
  );
}
