import ClockWidget from "./ClockWidget";
import TransitWidget from "./TransitWidget";

const WidgetGrid: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col items-center bg-[#121212] text-[#e0e0e0]"
         style={{ fontFamily: "-apple-system, monospace" }}>
      <ClockWidget />
      <div className="mt-[15px]">
        <TransitWidget />
      </div>
    </div>
  );
};

export default WidgetGrid;

