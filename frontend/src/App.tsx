import { BrowserRouter, Routes, Route } from 'react-router-dom'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-accent mb-4">Nexus do Mestre</h1>
            <p className="text-muted">Ferramenta para Mestres de Ordem Paranormal</p>
            <p className="text-sm text-muted mt-8">Setup inicial completo. Execute os próximos prompts para continuar.</p>
          </div>
        </div>} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
