import { useState } from 'react'
import { useThreatModelStore } from '../../store/useThreatModelStore'
import { getPrimaryBlueprint } from '../../lib/bom'
import type { WorkspaceView } from '../../types/cyclonedx'

const HIDE_KEY = 'tmbom-studio:hide-getting-started'

function readHidden(): boolean {
  try {
    return localStorage.getItem(HIDE_KEY) === '1'
  } catch {
    return false
  }
}

export function GettingStartedGuide() {
  const bom = useThreatModelStore((s) => s.bom)
  const setView = useThreatModelStore((s) => s.setView)
  const updateMetadataName = useThreatModelStore((s) => s.updateMetadataName)
  const addZone = useThreatModelStore((s) => s.addZone)
  const addAsset = useThreatModelStore((s) => s.addAsset)
  const suggestThreatsForAsset = useThreatModelStore(
    (s) => s.suggestThreatsForAsset,
  )

  const [hidden, setHidden] = useState(readHidden)
  const [draftName, setDraftName] = useState(
    () => bom.metadata?.component?.name ?? '',
  )

  const bp = getPrimaryBlueprint(bom)
  const name = bom.metadata?.component?.name ?? 'Untitled System'
  const hasCustomName = name.trim() !== '' && name !== 'Untitled System'
  const hasZone = (bp.zones?.length ?? 0) > 0
  const hasAsset = (bp.assets?.length ?? 0) > 0
  const hasThreat = (bom.threats?.threats?.length ?? 0) > 0

  const go = (view: WorkspaceView) => setView(view)

  const steps = [
    {
      id: 'name' as const,
      title: 'Name your system',
      detail: 'Give the TM-BOM a clear product or service name.',
      done: hasCustomName,
      cta: hasCustomName ? 'Edit name' : 'Apply name',
      action: () => {
        const next = draftName.trim() || 'My system'
        updateMetadataName(next)
        setDraftName(next)
      },
    },
    {
      id: 'zone' as const,
      title: 'Add a trust zone',
      detail: 'Zones group assets (for example Internet, DMZ, Private).',
      done: hasZone,
      cta: hasZone ? 'Open blueprint' : 'Create a zone',
      action: () => {
        if (!hasZone) {
          addZone({
            name: 'Private',
            type: 'trust',
            description: 'Internal zone',
          })
        }
        go('blueprint')
      },
    },
    {
      id: 'asset' as const,
      title: 'Add an asset',
      detail: 'Place a service, data store, or actor on the blueprint.',
      done: hasAsset,
      cta: hasAsset ? 'Open blueprint' : 'Create an asset',
      action: () => {
        if (!hasAsset) {
          const zone = bp.zones?.[0]?.['bom-ref']
          addAsset({
            name: 'Primary service',
            type: 'service',
            zone,
            _position: { x: 280, y: 180 },
          })
        }
        go('blueprint')
      },
    },
    {
      id: 'threat' as const,
      title: 'Catalog a threat',
      detail:
        'Add a STRIDE threat manually, or generate suggestions for an asset.',
      done: hasThreat,
      cta: hasThreat ? 'Open threats' : 'Suggest STRIDE threats',
      action: () => {
        const assetRef = bp.assets?.[0]?.['bom-ref']
        if (!hasThreat && assetRef) {
          suggestThreatsForAsset(assetRef, 'STRIDE')
        } else {
          go('threats')
        }
      },
    },
    {
      id: 'save' as const,
      title: 'Save a project file',
      detail:
        'Export a .cdx.json and commit it under projects/ — browser storage is only a draft.',
      done: false,
      cta: 'Open Projects',
      action: () => go('export'),
    },
  ]

  const completed = steps.filter((s) => s.done).length
  const next = steps.find((s) => !s.done) ?? steps[steps.length - 1]

  if (hidden) {
    return (
      <div className="panel panel-pad guide-collapsed">
        <button
          className="btn btn-ghost"
          type="button"
          onClick={() => {
            localStorage.removeItem(HIDE_KEY)
            setHidden(false)
          }}
        >
          Show getting-started guide
        </button>
      </div>
    )
  }

  return (
    <div className="panel panel-pad guide">
      <div className="guide-header">
        <div>
          <h3 style={{ margin: 0, fontFamily: 'var(--font-display)' }}>
            Getting started
          </h3>
          <p className="muted" style={{ margin: '0.35rem 0 0' }}>
            A short path to your first TM-BOM · {completed}/4 modeling steps
            done · next: {next.title}
          </p>
        </div>
        <button
          className="btn btn-ghost"
          type="button"
          onClick={() => {
            localStorage.setItem(HIDE_KEY, '1')
            setHidden(true)
          }}
        >
          Hide
        </button>
      </div>

      <ol className="guide-steps">
        {steps.map((step, index) => (
          <li
            key={step.id}
            className={`guide-step${step.done ? ' is-done' : ''}${
              next.id === step.id ? ' is-next' : ''
            }`}
          >
            <div className="guide-step-index" aria-hidden>
              {step.done ? '✓' : index + 1}
            </div>
            <div className="guide-step-body">
              <h4>{step.title}</h4>
              <p>{step.detail}</p>
              {step.id === 'name' && (
                <div
                  className="field"
                  style={{ maxWidth: 360, marginTop: '0.5rem' }}
                >
                  <label htmlFor="guide-system-name">System name</label>
                  <input
                    id="guide-system-name"
                    value={draftName}
                    onChange={(e) => setDraftName(e.target.value)}
                    placeholder="e.g. Checkout API"
                  />
                </div>
              )}
              <div className="btn-row" style={{ marginTop: '0.65rem' }}>
                <button
                  className={`btn${next.id === step.id ? ' btn-primary' : ''}`}
                  type="button"
                  onClick={step.action}
                >
                  {step.cta}
                </button>
              </div>
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}
