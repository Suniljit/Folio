export function SaveButton({ onSave, disabled }: { onSave: () => void; disabled: boolean }) {
  return (
    <div className="save-row">
      <button type="button" className="save-button" onClick={onSave} disabled={disabled}>
        Save Changes
      </button>
    </div>
  );
}
