import { useTheme, ACCENT_OPTIONS } from '@/theme/ThemeProvider'

export function Topbar({ title }: { title: string }) {
  const { mode, setMode, accent, setAccent } = useTheme()

  return (
    <header className="flex items-center justify-between border-b border-chrome-border bg-chrome px-6 py-4 transition-colors">
      <h1 className="text-xl font-semibold text-chrome-text">{title}</h1>

      <div className="flex items-center gap-4">
        {/* Accent color presets */}
        <div className="flex items-center gap-1">
          {ACCENT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              title={opt.label}
              onClick={() => setAccent(opt.value)}
              className={`flex h-7 w-7 items-center justify-center rounded-full text-sm transition-transform hover:scale-110 ${
                accent === opt.value ? 'ring-2 ring-offset-2 ring-primary ring-offset-chrome' : ''
              }`}
            >
              {opt.emoji}
            </button>
          ))}
        </div>

        {/* Dark / light toggle */}
        <button
          onClick={() => setMode(mode === 'dark' ? 'light' : 'dark')}
          className="flex items-center gap-2 rounded-full border border-chrome-border px-3 py-1.5 text-sm text-chrome-text hover:bg-chrome-hover"
        >
          {mode === 'dark' ? <>🌙 Dark</> : <>☀️ Light</>}
        </button>
      </div>
    </header>
  )
}
