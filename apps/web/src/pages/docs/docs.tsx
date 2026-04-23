import React, { useState } from "react";
import "./docs.css";

import DashboardLayout from "../../layout/Layout";
import docsData from "../../data/docsData.json";

const Docs: React.FC = () => {
  const [activeSectionId, setActiveSectionId] = useState<string>("introduction");

  const handleSectionChange = (sectionId: string) => {
    setActiveSectionId(sectionId);
    // Optionally update URL hash or scroll to top
    window.scrollTo(0, 0);
  };

  // Find the active section data
  const activeSection = docsData.sections.find(s => s.id === activeSectionId) || docsData.sections[0];

  return (
    <DashboardLayout sidebarSections={docsData.sections} onSectionChange={handleSectionChange}>
      <div className="docs-content">
        <div key={activeSection.id} className="docs-section">
          <h2>{activeSection.title}</h2>
          {activeSection.subsections.map((subsection) => (
            <div key={subsection.id} id={subsection.id} className="docs-subsection">
              <h3>{subsection.title}</h3>
              <div
                className="docs-subsection-content"
                dangerouslySetInnerHTML={{ __html: subsection.content }}
              />
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Docs;