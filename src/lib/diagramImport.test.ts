import { describe, expect, it } from 'vitest'
import { emptyBom, getPrimaryBlueprint } from './bom'
import {
  applyDiagramImport,
  importDrawio,
  importThreatDragon,
} from './diagramImport'

describe('importThreatDragon', () => {
  it('maps process/store/actor/boundary and flows', () => {
    const td = {
      version: '2.0',
      detail: {
        diagrams: [
          {
            cells: [
              {
                type: 'tm.Process',
                id: 'p1',
                attrs: { text: { text: 'Web App' } },
              },
              {
                type: 'tm.Store',
                id: 's1',
                attrs: { text: { text: 'DB' } },
              },
              {
                type: 'tm.Actor',
                id: 'a1',
                attrs: { text: { text: 'User' } },
              },
              {
                type: 'tm.Boundary',
                id: 'b1',
                attrs: { text: { text: 'Internet' } },
              },
              {
                type: 'tm.Flow',
                id: 'f1',
                attrs: { text: { text: 'HTTPS' } },
                source: { id: 'a1' },
                target: { id: 'p1' },
              },
              {
                type: 'tm.Flow',
                id: 'f2',
                source: { id: 'p1' },
                target: { id: 's1' },
              },
              { type: 'unknown.Shape', id: 'x1', attrs: { text: { text: 'Skip' } } },
            ],
          },
        ],
      },
    }

    const result = importThreatDragon(td)
    expect(result.assets).toHaveLength(3)
    expect(result.zones).toHaveLength(1)
    expect(result.zones[0].name).toBe('Internet')
    expect(result.flows).toHaveLength(2)
    expect(result.flows.some((f) => f.name === 'HTTPS')).toBe(true)
  })

  it('accepts diagram.cells at the root', () => {
    const result = importThreatDragon({
      diagram: {
        cells: [
          { type: 'tm.Process', id: '1', attrs: { text: { text: 'API' } } },
        ],
      },
    })
    expect(result.assets).toHaveLength(1)
    expect(result.assets[0].name).toBe('API')
  })
})

describe('importDrawio', () => {
  it('maps vertices and edges from mxGraphModel XML', () => {
    const xml = `<?xml version="1.0"?>
<mxGraphModel>
  <root>
    <mxCell id="0"/>
    <mxCell id="1" parent="0"/>
    <mxCell id="2" value="Gateway" vertex="1" parent="1"/>
    <mxCell id="3" value="Service" vertex="1" parent="1"/>
    <mxCell id="4" value="calls" edge="1" parent="1" source="2" target="3"/>
  </root>
</mxGraphModel>`

    const result = importDrawio(xml)
    expect(result.assets).toHaveLength(2)
    expect(result.assets.map((a) => a.name).sort()).toEqual(['Gateway', 'Service'])
    expect(result.flows).toHaveLength(1)
    expect(result.flows[0].name).toBe('calls')
  })

  it('accepts JSON wrapping mxfile XML', () => {
    const mxfile = `<mxfile><diagram><mxGraphModel><root>
      <mxCell id="0"/>
      <mxCell id="1" value="A" vertex="1"/>
      <mxCell id="2" value="B" vertex="1"/>
      <mxCell id="3" edge="1" source="1" target="2"/>
    </root></mxGraphModel></diagram></mxfile>`
    const result = importDrawio(JSON.stringify({ mxfile }))
    expect(result.assets).toHaveLength(2)
    expect(result.flows).toHaveLength(1)
  })
})

describe('applyDiagramImport', () => {
  it('merges into the primary blueprint', () => {
    const bom = emptyBom()
    const patch = importThreatDragon({
      detail: {
        diagrams: [
          {
            cells: [
              { type: 'tm.Process', id: 'p', attrs: { text: { text: 'Imported' } } },
            ],
          },
        ],
      },
    })
    const next = applyDiagramImport(bom, patch)
    const bp = getPrimaryBlueprint(next)
    expect(bp.assets!.some((a) => a.name === 'Imported')).toBe(true)
    expect(next.version).toBe((bom.version ?? 1) + 1)
  })
})
