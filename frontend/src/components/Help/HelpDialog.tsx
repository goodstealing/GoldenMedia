import { HELP_CONTENT } from "../../help/helpContent";
import { HELP_TITLES, type HelpSection } from "../../help/helpSections";
import { HelpMarkdown } from "./HelpMarkdown";

type HelpDialogProps = {
  open: boolean;
  onClose: () => void;
  section: HelpSection;
};

export function HelpDialog({ open, onClose, section }: HelpDialogProps) {
  if (!open) return null;

  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <div
        className="dialog help-dialog"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="help-dialog-title"
      >
        <div className="dialog-header">
          <h2 className="dialog-title" id="help-dialog-title">
            {HELP_TITLES[section]}
          </h2>
          <button
            type="button"
            className="dialog-close"
            aria-label="Закрыть справку"
            onClick={onClose}
          />
        </div>
        <div className="help-dialog-body">
          <HelpMarkdown content={HELP_CONTENT[section]} />
        </div>
        <div className="dialog-actions help-dialog-actions">
          <button type="button" className="primary-btn" onClick={onClose}>
            Понятно
          </button>
        </div>
      </div>
    </div>
  );
}
