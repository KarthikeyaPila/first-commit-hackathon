import { useEffect, useRef } from 'react';
import { HOME_MARKUP } from './homeMarkup';
import { initLegacy } from './legacyRuntime';
import './styles.css';

export default function App() {
  const rootRef = useRef(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    const previousBodyClass = document.body.className;
    const previousTitle = document.title;
    document.title = 'SUTRADHAR — India, state by state';

    // The original site is mounted as a React-controlled DOM island.
    // Its existing map/navigation/pipeline logic is initialized only after
    // React has rendered the markup, preserving the current UI behavior.
    initLegacy();

    return () => {
      document.body.className = previousBodyClass;
      document.title = previousTitle;
    };
  }, []);

  return <div ref={rootRef} dangerouslySetInnerHTML={{ __html: HOME_MARKUP }} />;
}
