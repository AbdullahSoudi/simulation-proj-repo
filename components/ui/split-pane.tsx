type SplitPaneProps = {
  left: React.ReactNode
  right: React.ReactNode
}

export function SplitPane({ left, right }: SplitPaneProps) {
  return (
    <div className="grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
      <div className="min-w-0">{left}</div>
      <div className="min-w-0">{right}</div>
    </div>
  )
}

