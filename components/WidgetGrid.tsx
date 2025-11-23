import ClockWidget from "./ClockWidget";
import TransitWidget from "./TransitWidget";
import SpotifyWidget from "./SpotifyWidget";

const WidgetGrid: React.FC = () => {
  return (
    <div className="page-root" style={{ fontFamily: "-apple-system, monospace" }}>
      <ClockWidget />
      <div className="mt-[15px] w-[560px]">
        <TransitWidget />
      </div>
      <div className="mt-[15px] w-[560px]">
        <SpotifyWidget />
      </div>
    </div>
  );
};

export default WidgetGrid;

