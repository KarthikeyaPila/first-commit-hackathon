import { useState } from "react";
import { MapHome } from "./components/MapHome";

function App() {
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [pressOpen, setPressOpen] = useState(false);

  return (
    <div className="app-root">
      <MapHome
        selectedState={selectedState}
        onSelectState={setSelectedState}
        onOpenPress={() => setPressOpen(true)}
      />
      {pressOpen && (
        <div className="foundation-notice" role="dialog" aria-modal="true" aria-label="Pipeline preview">
          <div className="foundation-notice-card">
            <span className="micro">Pipeline foundation</span>
            <h2>The machine is next.</h2>
            <p>The live AWS pipeline will replace this foundation preview in the next frontend milestone.</p>
            <button type="button" className="text-button" onClick={() => setPressOpen(false)}>Return to map <span>→</span></button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
