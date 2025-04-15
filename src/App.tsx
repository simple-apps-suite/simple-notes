import { ThemeProvider } from '@/components/theme-provider'
import { MatrixProvider } from './components/matrix-provider'
import { AuthenticationPage } from './pages/authentication'
import { ExamplePage } from './pages/example'

export function App() {
  return (
    <ThemeProvider>
      <MatrixProvider defaultBaseUrl="http://localhost:8008">
        <ExamplePage />
        <AuthenticationPage />
      </MatrixProvider>
    </ThemeProvider>
  )
}
