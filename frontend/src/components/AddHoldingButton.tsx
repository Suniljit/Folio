export function AddHoldingButton({ onOpen }: { onOpen: () => void }) {
  return (
    <div className="add-holding-row">
      <button type="button" className="add-holding-button" onClick={onOpen}>
        + Add holding
      </button>
    </div>
  );
}
