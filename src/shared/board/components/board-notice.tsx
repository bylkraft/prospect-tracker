type Props = {
  title: string
  hint: string
}

export function BoardNotice({ title, hint }: Props) {
  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-1 px-4 py-14 text-center">
      <span className="font-semibold">{title}</span>
      <span className="text-muted-foreground text-xs">{hint}</span>
    </div>
  )
}
