import { deleteBoard } from "@/actions/delete-board";
import { Button } from "@/components/ui/button";

interface BoardProps {
  id: string;
  title: string;
}

export default function Board({ id, title }: BoardProps) {
  const deleteBoardWithId = deleteBoard.bind(null, id);

  return (
    <form className="flex items-center gap-x-2" action={deleteBoardWithId}>
      <p>Board title: {title}</p>
      <Button variant="destructive" size="sm">
        Delete
      </Button>
    </form>
  );
}
