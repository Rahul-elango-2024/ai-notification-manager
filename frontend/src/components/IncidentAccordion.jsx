import React, { useId, useState } from "react";
import { ChevronDown } from "lucide-react";

export default function IncidentAccordion({
  title,
  subtitle,
  icon,
  defaultOpen = true,
  children,
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const panelId = useId();

  return (
    <section className={`incident-accordion ${isOpen ? "open" : ""}`}>
      <button
        type="button"
        className="incident-accordion-header"
        onClick={() => setIsOpen((current) => !current)}
        aria-expanded={isOpen}
        aria-controls={panelId}
      >
        <span className="incident-accordion-left">
          <span className="incident-accordion-icon" aria-hidden="true">
            {icon}
          </span>

          <span className="incident-accordion-copy">
            <span className="incident-accordion-title">{title}</span>
            {subtitle && (
              <span className="incident-accordion-subtitle">{subtitle}</span>
            )}
          </span>
        </span>

        <ChevronDown
          size={20}
          strokeWidth={2.25}
          className="incident-accordion-chevron"
          aria-hidden="true"
        />
      </button>

      <div
        id={panelId}
        className="incident-accordion-panel"
        aria-hidden={!isOpen}
      >
        <div className="incident-accordion-panel-inner">{children}</div>
      </div>
    </section>
  );
}
