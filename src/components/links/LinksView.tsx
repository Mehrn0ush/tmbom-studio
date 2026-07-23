import { useMemo, useState } from 'react'
import { useThreatModelStore } from '../../store/useThreatModelStore'
import { LINK_REFERENCE_TYPES } from '../../lib/catalog'
import { buildBomLink, isBomLink } from '../../lib/session'
import { getPrimaryBlueprint } from '../../lib/bom'

export function LinksView() {
  const bom = useThreatModelStore((s) => s.bom)
  const addExternalReference = useThreatModelStore((s) => s.addExternalReference)
  const removeExternalReference = useThreatModelStore((s) => s.removeExternalReference)

  const refs = bom.externalReferences ?? []
  const assets = getPrimaryBlueprint(bom).assets ?? []

  const [type, setType] = useState<string>('bom')
  const [url, setUrl] = useState('')
  const [comment, setComment] = useState('')
  const [elementRef, setElementRef] = useState('')

  const selfBomLink = useMemo(() => {
    if (!bom.serialNumber) return ''
    return buildBomLink(bom.serialNumber, bom.version ?? 1)
  }, [bom.serialNumber, bom.version])

  const add = () => {
    if (!url.trim()) return
    addExternalReference({
      type,
      url: url.trim(),
      comment: comment.trim() || undefined,
    })
    setUrl('')
    setComment('')
  }

  const fillSelfLink = () => {
    if (!bom.serialNumber) return
    setType('bom')
    setUrl(
      buildBomLink(
        bom.serialNumber,
        bom.version ?? 1,
        elementRef || undefined,
      ),
    )
    setComment(
      elementRef
        ? `BOM-Link to element ${elementRef} in this TM-BOM`
        : 'BOM-Link to this TM-BOM document',
    )
  }

  return (
    <div className="stack">
      <div className="panel panel-pad">
        <h3 style={{ marginTop: 0, fontFamily: 'var(--font-display)' }}>
          BOM-Link &amp; supply-chain references
        </h3>
        <p className="muted" style={{ marginTop: 0 }}>
          Attach CycloneDX{' '}
          <a
            href="https://cyclonedx.org/capabilities/bomlink/"
            target="_blank"
            rel="noreferrer"
          >
            BOM-Link
          </a>{' '}
          URNs and URLs for related SBOMs, VEX/VDR assertions, and docs. These
          become <span className="mono">externalReferences</span> on the TM-BOM.
        </p>

        <div className="stack">
          <div className="field">
            <label>This document’s BOM-Link</label>
            <input className="mono" readOnly value={selfBomLink || 'Missing serialNumber'} />
          </div>
          <div className="btn-row" style={{ alignItems: 'end' }}>
            <div className="field" style={{ flex: 1 }}>
              <label>Optional element bom-ref</label>
              <select
                value={elementRef}
                onChange={(e) => setElementRef(e.target.value)}
              >
                <option value="">(document only)</option>
                {assets.map((a) => (
                  <option key={a['bom-ref']} value={a['bom-ref']}>
                    {a.name} — {a['bom-ref']}
                  </option>
                ))}
              </select>
            </div>
            <button className="btn" type="button" onClick={fillSelfLink}>
              Use as new reference
            </button>
          </div>
        </div>
      </div>

      <div className="panel panel-pad stack">
        <h3 style={{ margin: 0, fontFamily: 'var(--font-display)' }}>
          Add reference
        </h3>
        <div className="field">
          <label>Type</label>
          <select value={type} onChange={(e) => setType(e.target.value)}>
            {LINK_REFERENCE_TYPES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
          <span className="muted" style={{ fontSize: '0.8rem' }}>
            {LINK_REFERENCE_TYPES.find((t) => t.id === type)?.hint}
          </span>
        </div>
        <div className="field">
          <label>URL or BOM-Link URN</label>
          <input
            className="mono"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="urn:cdx:…/1 or https://…/sbom.cdx.json"
          />
        </div>
        <div className="field">
          <label>Comment</label>
          <input
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="e.g. Production SBOM for Checkout API 1.2.0"
          />
        </div>
        <button className="btn btn-primary" type="button" onClick={add}>
          Add external reference
        </button>
      </div>

      <div className="panel panel-pad">
        <h3 style={{ marginTop: 0, fontFamily: 'var(--font-display)' }}>
          Linked artifacts
        </h3>
        <div className="list">
          {refs.length === 0 && (
            <div className="empty">No external references yet</div>
          )}
          {refs.map((r, idx) => (
            <div key={`${r.type}-${r.url}-${idx}`} className="list-item" style={{ cursor: 'default' }}>
              <div>
                <h4>
                  {r.type}{' '}
                  {isBomLink(r.url) && <span className="badge">BOM-Link</span>}
                </h4>
                <p className="mono">{r.url}</p>
                {r.comment && <p>{r.comment}</p>}
              </div>
              <button
                className="btn btn-danger"
                type="button"
                onClick={() => removeExternalReference(idx)}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
