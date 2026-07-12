export function AddHoldingButton({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="add-holding-row">
      <button type="button" className="add-holding-button" onClick={onAdd}>
        + Add holding
      </button>
    </div>
  );
}
