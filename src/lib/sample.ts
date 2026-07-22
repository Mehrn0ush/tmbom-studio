import type { CycloneDxBom } from '../types/cyclonedx'
import {
  createAsset,
  createBoundary,
  createFlow,
  createRisk,
  createScenario,
  createThreat,
  createZone,
  toExportBom,
} from './bom'
import { computeRiskLevel } from './catalog'

const STABLE = {
  serial: 'urn:uuid:a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  component: 'component-checkout-api',
  blueprint: 'blueprint-checkout-dfd',
  internet: 'zone-internet',
  dmz: 'zone-dmz',
  private: 'zone-private-vpc',
  customer: 'asset-customer-browser',
  gateway: 'asset-api-gateway',
  checkout: 'asset-checkout-service',
  ordersDb: 'asset-orders-db',
  payment: 'asset-payment-provider',
  edgeBoundary: 'boundary-internet-dmz',
  appBoundary: 'boundary-dmz-private',
  flowPlace: 'flow-place-order',
  flowForward: 'flow-forward-request',
  flowPersist: 'flow-persist-order',
  flowCharge: 'flow-charge-card',
  assumptionTls: 'assumption-tls',
  assumptionToken: 'assumption-tokenization',
  tSpoof: 'threat-api-spoofing',
  tTamper: 'threat-order-tampering',
  tDisclose: 'threat-db-disclosure',
  tDos: 'threat-checkout-dos',
  tEop: 'threat-iam-eop',
  scSpoof: 'scenario-spoofed-callbacks',
  scInsider: 'scenario-insider-exfil',
  riskFraud: 'risk-fraudulent-orders',
  riskPii: 'risk-pii-breach',
  respMtls: 'response-mtls-tokens',
  respIam: 'response-least-privilege',
  respInsure: 'response-cyber-insurance',
} as const

/** Sample TM-BOM: online checkout API with STRIDE threats and risks (stable bom-refs). */
export function createSampleBom(): CycloneDxBom {
  const internet = createZone({
    'bom-ref': STABLE.internet,
    name: 'Internet',
    type: 'network',
    description: 'Untrusted public network',
  })
  const dmz = createZone({
    'bom-ref': STABLE.dmz,
    name: 'DMZ',
    type: 'trust',
    description: 'Public-facing application tier',
  })
  const privateZone = createZone({
    'bom-ref': STABLE.private,
    name: 'Private VPC',
    type: 'trust',
    description: 'Internal services and data stores',
  })

  const customer = createAsset({
    'bom-ref': STABLE.customer,
    name: 'Customer Browser',
    type: 'actor',
    zone: STABLE.internet,
    description: 'End-user browser client',
    _position: { x: 40, y: 180 },
  })
  const apiGateway = createAsset({
    'bom-ref': STABLE.gateway,
    name: 'API Gateway',
    type: 'gateway',
    zone: STABLE.dmz,
    description: 'Edge gateway terminating TLS',
    _position: { x: 320, y: 180 },
  })
  const checkout = createAsset({
    'bom-ref': STABLE.checkout,
    name: 'Checkout Service',
    type: 'service',
    zone: STABLE.private,
    description: 'Order and payment orchestration',
    _position: { x: 620, y: 120 },
  })
  const ordersDb = createAsset({
    'bom-ref': STABLE.ordersDb,
    name: 'Orders DB',
    type: 'data-store',
    zone: STABLE.private,
    description: 'Persistent order records',
    _position: { x: 900, y: 120 },
  })
  const payment = createAsset({
    'bom-ref': STABLE.payment,
    name: 'Payment Provider',
    type: 'service',
    zone: STABLE.internet,
    description: 'External PCI payment processor',
    _position: { x: 620, y: 320 },
  })

  const edgeBoundary = createBoundary({
    'bom-ref': STABLE.edgeBoundary,
    name: 'Internet → DMZ',
    type: 'trust',
    zones: [STABLE.internet, STABLE.dmz],
  })
  const appBoundary = createBoundary({
    'bom-ref': STABLE.appBoundary,
    name: 'DMZ → Private',
    type: 'network',
    zones: [STABLE.dmz, STABLE.private],
  })

  const flows = [
    createFlow({
      'bom-ref': STABLE.flowPlace,
      name: 'Place order',
      type: 'data',
      source: STABLE.customer,
      destination: STABLE.gateway,
      encrypted: true,
      protocols: ['HTTPS'],
    }),
    createFlow({
      'bom-ref': STABLE.flowForward,
      name: 'Forward request',
      type: 'data',
      source: STABLE.gateway,
      destination: STABLE.checkout,
      encrypted: true,
      protocols: ['HTTPS'],
    }),
    createFlow({
      'bom-ref': STABLE.flowPersist,
      name: 'Persist order',
      type: 'data',
      source: STABLE.checkout,
      destination: STABLE.ordersDb,
      encrypted: true,
      protocols: ['TLS'],
    }),
    createFlow({
      'bom-ref': STABLE.flowCharge,
      name: 'Charge card',
      type: 'financial',
      source: STABLE.checkout,
      destination: STABLE.payment,
      encrypted: true,
      protocols: ['HTTPS'],
    }),
  ]

  const tSpoof = createThreat({
    'bom-ref': STABLE.tSpoof,
    name: 'API key theft enables service spoofing',
    description:
      'Stolen gateway credentials allow an attacker to impersonate trusted callers.',
    categories: [{ taxonomy: 'STRIDE', category: 'spoofing' }],
    affectedAssets: [STABLE.gateway, STABLE.checkout],
  })
  const tTamper = createThreat({
    'bom-ref': STABLE.tTamper,
    name: 'Order amount tampering in transit',
    description:
      'An attacker modifies order totals between the browser and checkout service.',
    categories: [{ taxonomy: 'STRIDE', category: 'tampering' }],
    affectedAssets: [STABLE.checkout, STABLE.customer],
  })
  const tDisclose = createThreat({
    'bom-ref': STABLE.tDisclose,
    name: 'Orders DB data disclosure',
    description:
      'Unauthorized query access exposes customer PII and order history.',
    categories: [{ taxonomy: 'STRIDE', category: 'information-disclosure' }],
    affectedAssets: [STABLE.ordersDb],
  })
  const tDos = createThreat({
    'bom-ref': STABLE.tDos,
    name: 'Checkout service exhaustion',
    description: 'Flooding the checkout API degrades or denies order placement.',
    categories: [{ taxonomy: 'STRIDE', category: 'denial-of-service' }],
    affectedAssets: [STABLE.checkout, STABLE.gateway],
  })
  const tEop = createThreat({
    'bom-ref': STABLE.tEop,
    name: 'Privilege escalation via misconfigured IAM',
    description:
      'Over-privileged service roles allow lateral movement into Orders DB.',
    categories: [{ taxonomy: 'STRIDE', category: 'elevation-of-privilege' }],
    affectedAssets: [STABLE.checkout, STABLE.ordersDb],
  })

  const scSpoof = createScenario({
    'bom-ref': STABLE.scSpoof,
    name: 'Attacker spoofs merchant callbacks',
    description:
      'External attacker uses leaked API credentials to forge payment callbacks.',
    threats: [STABLE.tSpoof],
    intent: 'targeted',
    accessLevel: 'external',
    affectedAssets: [STABLE.gateway, STABLE.checkout],
    likelihood: { level: 'medium' },
    impact: { level: 'major', polarity: 'harm' },
    riskScore: {
      level: computeRiskLevel('medium', 'major'),
      methodology: 'qualitative-matrix',
    },
  })
  const scInsider = createScenario({
    'bom-ref': STABLE.scInsider,
    name: 'Insider exfiltrates order records',
    description: 'Privileged insider queries Orders DB and exports PII.',
    threats: [STABLE.tDisclose, STABLE.tEop],
    intent: 'opportunistic',
    accessLevel: 'privileged',
    affectedAssets: [STABLE.ordersDb],
    likelihood: { level: 'low' },
    impact: { level: 'catastrophic', polarity: 'harm' },
    riskScore: {
      level: computeRiskLevel('low', 'catastrophic'),
      methodology: 'qualitative-matrix',
    },
  })

  const bom: CycloneDxBom = {
    $schema: 'https://cyclonedx.org/schema/2.0/cyclonedx-2.0.schema.json',
    specFormat: 'CycloneDX',
    specVersion: '2.0',
    serialNumber: STABLE.serial,
    version: 1,
    metadata: {
      timestamp: '2026-07-22T00:00:00Z',
      component: {
        type: 'application',
        name: 'Checkout API',
        version: '1.2.0',
        'bom-ref': STABLE.component,
      },
      authors: [{ name: 'ThreatModeler', email: 'security@example.com' }],
      tools: {
        components: [
          {
            type: 'application',
            name: 'tmbom-studio',
            version: '0.1.0',
          },
        ],
      },
    },
    blueprints: [
      {
        'bom-ref': STABLE.blueprint,
        name: 'Checkout API Data Flow',
        description:
          'Sample data-flow blueprint for an online checkout API (CycloneDX 2.0 TM-BOM)',
        modelTypes: ['data-flow', 'architecture'],
        zones: [internet, dmz, privateZone],
        boundaries: [edgeBoundary, appBoundary],
        assets: [customer, apiGateway, checkout, ordersDb, payment],
        flows,
        assumptions: [
          {
            'bom-ref': STABLE.assumptionTls,
            description:
              'TLS 1.2+ is enforced at the API gateway and payment provider.',
          },
          {
            'bom-ref': STABLE.assumptionToken,
            description:
              'Cardholder data is tokenized; PAN is never stored in Orders DB.',
          },
        ],
      },
    ],
    threats: {
      methodologies: ['STRIDE'],
      threats: [tSpoof, tTamper, tDisclose, tDos, tEop],
      scenarios: [scSpoof, scInsider],
    },
    risks: {
      risks: [
        createRisk({
          'bom-ref': STABLE.riskFraud,
          name: 'Fraudulent order fulfillment',
          statement:
            'If an attacker spoofs trusted API callers, then fraudulent orders may be fulfilled, causing financial loss and customer distrust.',
          relatedThreats: [STABLE.tSpoof, STABLE.scSpoof],
          affects: [STABLE.checkout],
          inherentRisk: {
            likelihood: { level: 'medium' },
            impact: { level: 'major', polarity: 'harm' },
            score: { level: 'high', methodology: 'qualitative-matrix' },
          },
          residualRisk: {
            likelihood: { level: 'low' },
            impact: { level: 'moderate', polarity: 'harm' },
            score: { level: 'medium', methodology: 'qualitative-matrix' },
          },
          responses: [
            {
              'bom-ref': STABLE.respMtls,
              strategy: 'reduce',
              description:
                'Require mTLS and short-lived signed tokens for service-to-service calls; rotate keys automatically.',
              cost: 'medium',
              addresses: [STABLE.tSpoof],
            },
          ],
        }),
        createRisk({
          'bom-ref': STABLE.riskPii,
          name: 'Customer PII breach',
          statement:
            'If Orders DB access controls fail, then customer PII may be disclosed, triggering regulatory penalties.',
          domains: [{ type: 'privacy' }, { type: 'security' }],
          relatedThreats: [STABLE.tDisclose, STABLE.tEop, STABLE.scInsider],
          affects: [STABLE.ordersDb],
          inherentRisk: {
            likelihood: { level: 'low' },
            impact: { level: 'catastrophic', polarity: 'harm' },
            score: { level: 'high', methodology: 'qualitative-matrix' },
          },
          residualRisk: {
            likelihood: { level: 'very-low' },
            impact: { level: 'major', polarity: 'harm' },
            score: { level: 'medium', methodology: 'qualitative-matrix' },
          },
          responses: [
            {
              'bom-ref': STABLE.respIam,
              strategy: 'reduce',
              description:
                'Enforce least-privilege IAM, column-level encryption for PII, and query auditing.',
              cost: 'high',
              addresses: [STABLE.tDisclose],
            },
            {
              'bom-ref': STABLE.respInsure,
              strategy: 'transfer',
              description:
                'Maintain cyber insurance covering privacy incidents.',
              cost: 'medium',
            },
          ],
        }),
      ],
    },
  }

  return bom
}

/** Export-ready sample (positions serialized into properties). */
export function createSampleExportBom(): CycloneDxBom {
  return toExportBom(createSampleBom())
}
