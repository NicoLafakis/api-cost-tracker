import { useTheme } from '../contexts/ThemeContext';

interface HeaderProps {
  onAddKey: () => void;
  onShowAlerts: () => void;
}

export default function Header({ onAddKey, onShowAlerts }: HeaderProps) {
  const { theme, setTheme } = useTheme();

  const cycleTheme = () => {
    if (theme === 'light') setTheme('dark');
    else if (theme === 'dark') setTheme('system');
    else setTheme('light');
  };

  const getThemeIcon = () => {
    if (theme === 'light') return '☀️';
    if (theme === 'dark') return '🌙';
    return '💻';
  };

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
              <span className="text-white text-xl font-bold">$</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                API Cost Tracker
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                OpenAI & Anthropic Usage Monitor
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={onShowAlerts}
              className="btn btn-secondary"
              title="Manage Alerts"
            >
              <span className="text-lg">🔔</span>
            </button>

            <button
              onClick={cycleTheme}
              className="btn btn-secondary"
              title={`Theme: ${theme}`}
            >
              <span className="text-lg">{getThemeIcon()}</span>
            </button>

            <button onClick={onAddKey} className="btn btn-primary">
              <span className="mr-2">+</span>
              Add API Key
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
