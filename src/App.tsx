import { AppProviders } from "./app/providers/AppProvider";
import { AppRouter } from "./app/routes/AppRouter";

export function App() {
  return (
    <AppProviders>
      <AppRouter />
    </AppProviders>
  );
}

export default App;
