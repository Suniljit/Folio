import { Button } from "./ui/button";

export function SaveButton({ onSave, disabled }: { onSave: () => void; disabled: boolean }) {
  return (
    <div className="save-row">
      <Button type="button" variant="gold" onClick={onSave} disabled={disabled}>
        Save Changes
      </Button>
    </div>
  );
}
