import prisma from "@/lib/prisma";
import Board from "./board";
import Form from "./form";

export default async function OrganizationIdPage() {
  const boards = await prisma.board.findMany();

  return (
    <div>
      <Form />
      <div className="space-y-2">
        {boards.map((board) => (
          <Board key={board.id} id={board.id} title={board.title} />
        ))}
      </div>
    </div>
  );
}
