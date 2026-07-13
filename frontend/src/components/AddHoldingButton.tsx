import { Button } from "./ui/button";

export function AddHoldingButton({ onOpen }: { onOpen: () => void }) {
  return (
    <div className="add-holding-row">
      <Button type="button" variant="goldOutline" size="sm" onClick={onOpen}>
        + Add holding
      </Button>
    </div>
  );
}
