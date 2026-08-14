import type { ReactNode } from 'react'

type EntityCrudViewProps<T extends { 'bom-ref': string; name?: string }> = {
  title: string
  description?: string
  items: T[]
  selectedRef: string | null
  onSelect: (ref: string | null) => void
  getLabel: (item: T) => string
  getSubtitle?: (item: T) => string
  onAdd: () => void
  onRemove: (ref: string) => void
  renderInspector: (item: T) => ReactNode
  addLabel?: string
  emptyLabel?: string
}

export function EntityCrudView<T extends { 'bom-ref': string; name?: string }>({
  title,
  description,
  items,
  selectedRef,
  onSelect,
  getLabel,
  getSubtitle,
  onAdd,
  onRemove,
  renderInspector,
  addLabel = 'Add',
  emptyLabel = 'Nothing here yet.',
}: EntityCrudViewProps<T>) {
  const selected = items.find((i) => i['bom-ref'] === selectedRef)

  return (
    <div className="split">
      <div className="stack">
        <div className="panel panel-pad stack">
          <h3 style={{ margin: 0, fontFamily: 'var(--font-display)' }}>{title}</h3>
          {description && (
            <p className="muted" style={{ margin: 0 }}>
              {description}
            </p>
          )}
          <button className="btn btn-primary" type="button" onClick={onAdd}>
            {addLabel}
          </button>
        </div>
        <div className="list">
          {items.length === 0 && <div className="panel empty">{emptyLabel}</div>}
          {items.map((item) => (
            <button
              key={item['bom-ref']}
              type="button"
              className={`list-item${selectedRef === item['bom-ref'] ? ' selected' : ''}`}
              onClick={() => onSelect(item['bom-ref'])}
            >
              <div>
                <h4>{getLabel(item)}</h4>
                {getSubtitle && <p>{getSubtitle(item)}</p>}
              </div>
            </button>
          ))}
        </div>
      </div>
      <aside className="panel inspector">
        {!selected ? (
          <div className="empty">Select an item</div>
        ) : (
          <div className="stack">
            {renderInspector(selected)}
            <button
              className="btn btn-danger"
              type="button"
              onClick={() => onRemove(selected['bom-ref'])}
            >
              Delete
            </button>
          </div>
        )}
      </aside>
    </div>
  )
}

export function Field({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <div className="field">
      <label>{label}</label>
      {children}
    </div>
  )
}

export function RefMultiSelect({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: Array<{ ref: string; label: string }>
  value: string[]
  onChange: (values: string[]) => void
}) {
  return (
    <Field label={label}>
      <select
        multiple
        value={value}
        onChange={(e) =>
          onChange(Array.from(e.target.selectedOptions).map((o) => o.value))
        }
      >
        {options.map((o) => (
          <option key={o.ref} value={o.ref}>
            {o.label}
          </option>
        ))}
      </select>
    </Field>
  )
}
