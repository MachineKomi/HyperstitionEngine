import React from "react";

export default function SectionNavigation() {
  return <>
    <nav className="section-navigation" aria-label="Instrument sections">
      {[["automatic", "01", "DRIVE"], ["geometry", "02", "GEOMETRY"], ["sprawl", "03", "TREE"], ["flow", "04", "ARCHIVE"], ["manual-console", "05", "ORACLE"]].map(([id, number, label]) =>
        <a key={id} href={`#${id}`}><span>{number}</span>{label}</a>)}
    </nav>
    <div className="page-scroll-lane" aria-hidden="true"><span>↕ PAGE SCROLL</span></div>
  </>;
}
