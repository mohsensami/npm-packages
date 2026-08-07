import { PrintSectionDemo } from './PrintSectionDemo'
import { TableToXlsxDemo } from './TableToXlsxDemo'

export default function App() {
  return (
    <main style={{ padding: 32, fontFamily: 'sans-serif', maxWidth: 640, margin: '0 auto' }}>
      <h1>Package examples</h1>
      <p>This playground consumes the local workspace packages via npm workspaces.</p>

      <PrintSectionDemo />
      <TableToXlsxDemo />
    </main>
  )
}
