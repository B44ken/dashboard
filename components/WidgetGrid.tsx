import HeaderWidget from "./HeaderWidget";
import TransitWidget from "./TransitWidget";
import SpotifyWidget from "./SpotifyWidget";
import TasksWidget from "./TasksWidget";

const WidgetGrid: React.FC = () => {
  return (
    <div className="WidgetGrid" style={{ fontFamily: "-apple-system, monospace" }}>
      <HeaderWidget />
      <TransitWidget />
      <SpotifyWidget />
      <TasksWidget />
    </div>
  );
};

export default WidgetGrid;

