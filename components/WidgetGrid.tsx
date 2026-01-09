import ClockWidget from "./ClockWidget";
import TransitWidget from "./TransitWidget";
import SpotifyWidget from "./SpotifyWidget";

const WidgetGrid: React.FC = () => {
  return (
    <div className="WidgetGrid" style={{ fontFamily: "-apple-system, monospace" }}>
      <ClockWidget />
      <TransitWidget />
      <SpotifyWidget />
    </div>
  );
};

export default WidgetGrid;

