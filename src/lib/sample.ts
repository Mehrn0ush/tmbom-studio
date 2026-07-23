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
  tLink: 'threat-order-linkability',
  apAuthBypass: 'capec-115-auth-bypass',
  apFlood: 'capec-125-flooding',
  apSqli: 'capec-66-sqli',
  apTrustedId: 'capec-21-trusted-ids',
  atSpoof: 'attack-tree-spoof-api',
  atSpoofRoot: 'at-node-spoof-goal',
  atSpoofPhish: 'at-node-phish-keys',
  atSpoofLeak: 'at-node-repo-leak',
  atSpoofReuse: 'at-node-reuse-key',
  atDos: 'attack-tree-dos-checkout',
  atDosRoot: 'at-node-dos-goal',
  atDosFlood: 'at-node-http-flood',
  atDosSlow: 'at-node-slowloris',
  atDosLogic: 'at-node-expensive-ops',
  atDisclose: 'attack-tree-exfil-orders',
  atDiscloseRoot: 'at-node-exfil-goal',
  atDiscloseSqli: 'at-node-inject-query',
  atDiscloseIam: 'at-node-abuse-role',
  atDiscloseBackup: 'at-node-backup-access',
  scSpoof: 'scenario-spoofed-callbacks',
  scInsider: 'scenario-insider-exfil',
  scTamper: 'scenario-price-tampering',
  scDos: 'scenario-checkout-flood',
  scLink: 'scenario-cross-order-linkage',
  riskFraud: 'risk-fraudulent-orders',
  riskPii: 'risk-pii-breach',
  riskAvail: 'risk-checkout-outage',
  riskIntegrity: 'risk-order-integrity',
  riskPrivacyLink: 'risk-customer-profiling',
  respMtls: 'response-mtls-tokens',
  respIam: 'response-least-privilege',
  respInsure: 'response-cyber-insurance',
  respWaf: 'response-waf-rate-limit',
  respSign: 'response-signed-payloads',
  respAcceptDos: 'response-accept-residual-dos',
  respMinimize: 'response-data-minimization',
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
      'Stolen gateway credentials allow an attacker to impersonate trusted callers (STRIDE Spoofing; CAPEC-115 / ATT&CK Valid Accounts).',
    categories: [
      { taxonomy: 'STRIDE', category: 'spoofing' },
      { taxonomy: 'MITRE-ATTACK', category: 'credential-access' },
    ],
    affectedAssets: [STABLE.gateway, STABLE.checkout],
    attackTrees: [STABLE.atSpoof],
    attackPatterns: [STABLE.apAuthBypass, STABLE.apTrustedId],
  })
  const tTamper = createThreat({
    'bom-ref': STABLE.tTamper,
    name: 'Order amount tampering in transit',
    description:
      'An attacker modifies order totals between the browser and checkout service (STRIDE Tampering).',
    categories: [
      { taxonomy: 'STRIDE', category: 'tampering' },
      { taxonomy: 'MITRE-ATTACK', category: 'collection' },
    ],
    affectedAssets: [STABLE.checkout, STABLE.customer],
  })
  const tDisclose = createThreat({
    'bom-ref': STABLE.tDisclose,
    name: 'Orders DB data disclosure',
    description:
      'Unauthorized query access exposes customer PII and order history (STRIDE Information Disclosure; CAPEC-66).',
    categories: [
      { taxonomy: 'STRIDE', category: 'information-disclosure' },
      { taxonomy: 'MITRE-ATTACK', category: 'exfiltration' },
    ],
    affectedAssets: [STABLE.ordersDb],
    attackTrees: [STABLE.atDisclose],
    attackPatterns: [STABLE.apSqli],
  })
  const tDos = createThreat({
    'bom-ref': STABLE.tDos,
    name: 'Checkout service exhaustion',
    description:
      'Flooding or expensive operations deny order placement (STRIDE Denial of Service; CAPEC-125).',
    categories: [
      { taxonomy: 'STRIDE', category: 'denial-of-service' },
      { taxonomy: 'MITRE-ATTACK', category: 'impact' },
    ],
    affectedAssets: [STABLE.checkout, STABLE.gateway],
    attackTrees: [STABLE.atDos],
    attackPatterns: [STABLE.apFlood],
  })
  const tEop = createThreat({
    'bom-ref': STABLE.tEop,
    name: 'Privilege escalation via misconfigured IAM',
    description:
      'Over-privileged service roles allow lateral movement into Orders DB (STRIDE Elevation of Privilege).',
    categories: [
      { taxonomy: 'STRIDE', category: 'elevation-of-privilege' },
      { taxonomy: 'MITRE-ATTACK', category: 'privilege-escalation' },
    ],
    affectedAssets: [STABLE.checkout, STABLE.ordersDb],
  })
  const tLink = createThreat({
    'bom-ref': STABLE.tLink,
    name: 'Cross-order customer linkability',
    description:
      'Stable identifiers in order records allow linking purchases to the same individual across merchants or partners (LINDDUN Linkability).',
    categories: [{ taxonomy: 'LINDDUN', category: 'linkability' }],
    affectedAssets: [STABLE.ordersDb, STABLE.checkout],
  })

  const attackPatterns = [
    {
      'bom-ref': STABLE.apAuthBypass,
      name: 'Authentication Bypass',
      capecId: 115,
      description: 'An adversary bypasses authentication to access a target.',
      techniques: [
        { id: 'T1078', name: 'Valid Accounts', tactic: 'initial-access' },
      ],
    },
    {
      'bom-ref': STABLE.apFlood,
      name: 'Flooding',
      capecId: 125,
      description: 'An adversary overwhelms a target with excessive traffic or requests.',
      techniques: [
        { id: 'T1498', name: 'Network Denial of Service', tactic: 'impact' },
      ],
    },
    {
      'bom-ref': STABLE.apSqli,
      name: 'SQL Injection',
      capecId: 66,
      description: 'An adversary exploits insufficient input validation to inject SQL.',
      techniques: [
        {
          id: 'T1190',
          name: 'Exploit Public-Facing Application',
          tactic: 'initial-access',
        },
      ],
    },
    {
      'bom-ref': STABLE.apTrustedId,
      name: 'Exploitation of Trusted Identifiers',
      capecId: 21,
      description: 'An adversary abuses trusted identifiers or credentials.',
      techniques: [
        {
          id: 'T1550',
          name: 'Use Alternate Authentication Material',
          tactic: 'defense-evasion',
        },
      ],
    },
  ]

  /** Schneier-style attack trees (CycloneDX attack-tree methodology, AND/OR nodes) */
  const attackTrees = [
    {
      'bom-ref': STABLE.atSpoof,
      name: 'Spoof trusted API caller',
      description:
        'Attack tree for obtaining credentials that impersonate a trusted service (goal decomposition).',
      root: STABLE.atSpoofRoot,
      nodes: [
        {
          'bom-ref': STABLE.atSpoofRoot,
          name: 'Obtain valid API credentials',
          operator: 'or' as const,
          children: [
            STABLE.atSpoofPhish,
            STABLE.atSpoofLeak,
            STABLE.atSpoofReuse,
          ],
          skill: 'intermediate' as const,
          cost: 'moderate' as const,
        },
        {
          'bom-ref': STABLE.atSpoofPhish,
          name: 'Phish operator or CI secrets',
          description: 'Social engineering against staff with access to keys.',
          skill: 'basic' as const,
          cost: 'low' as const,
        },
        {
          'bom-ref': STABLE.atSpoofLeak,
          name: 'Recover key from leaked repository or logs',
          skill: 'intermediate' as const,
          cost: 'low' as const,
        },
        {
          'bom-ref': STABLE.atSpoofReuse,
          name: 'Reuse long-lived static API key',
          skill: 'basic' as const,
          cost: 'negligible' as const,
        },
      ],
    },
    {
      'bom-ref': STABLE.atDos,
      name: 'Deny checkout availability',
      description: 'Attack tree for reducing checkout availability.',
      root: STABLE.atDosRoot,
      nodes: [
        {
          'bom-ref': STABLE.atDosRoot,
          name: 'Make checkout unavailable',
          operator: 'or' as const,
          children: [
            STABLE.atDosFlood,
            STABLE.atDosSlow,
            STABLE.atDosLogic,
          ],
        },
        {
          'bom-ref': STABLE.atDosFlood,
          name: 'Volumetric HTTP flood at gateway',
          skill: 'basic' as const,
          cost: 'low' as const,
        },
        {
          'bom-ref': STABLE.atDosSlow,
          name: 'Slowloris / connection exhaustion',
          skill: 'intermediate' as const,
          cost: 'low' as const,
        },
        {
          'bom-ref': STABLE.atDosLogic,
          name: 'Trigger expensive checkout operations repeatedly',
          skill: 'intermediate' as const,
          cost: 'moderate' as const,
        },
      ],
    },
    {
      'bom-ref': STABLE.atDisclose,
      name: 'Exfiltrate order PII',
      description:
        'Attack tree for unauthorized disclosure of Orders DB contents.',
      root: STABLE.atDiscloseRoot,
      nodes: [
        {
          'bom-ref': STABLE.atDiscloseRoot,
          name: 'Read customer order PII',
          operator: 'or' as const,
          children: [
            STABLE.atDiscloseSqli,
            STABLE.atDiscloseIam,
            STABLE.atDiscloseBackup,
          ],
        },
        {
          'bom-ref': STABLE.atDiscloseSqli,
          name: 'Inject malicious query via checkout API',
          skill: 'advanced' as const,
          cost: 'moderate' as const,
        },
        {
          'bom-ref': STABLE.atDiscloseIam,
          name: 'Abuse over-privileged service role',
          operator: 'and' as const,
          children: [],
          skill: 'intermediate' as const,
          cost: 'low' as const,
          description: 'Requires obtaining a role that can SELECT from Orders DB.',
        },
        {
          'bom-ref': STABLE.atDiscloseBackup,
          name: 'Access unencrypted backup or replica',
          skill: 'advanced' as const,
          cost: 'high' as const,
        },
      ],
    },
  ]

  const scSpoof = createScenario({
    'bom-ref': STABLE.scSpoof,
    name: 'Attacker spoofs merchant callbacks',
    description:
      'External attacker uses leaked API credentials to forge payment callbacks (realizes spoofing threat).',
    threats: [STABLE.tSpoof],
    intent: 'targeted',
    accessLevel: 'external',
    affectedAssets: [STABLE.gateway, STABLE.checkout],
    likelihood: {
      level: 'medium',
      rationale: 'Credential leaks in CI/logs are common; requires reachability to callback API.',
    },
    impact: {
      level: 'major',
      polarity: 'harm',
      rationale: 'Fraudulent fulfillment and chargebacks.',
    },
    riskScore: {
      level: computeRiskLevel('medium', 'major'),
      methodology: 'qualitative-matrix',
      rationale: 'CycloneDX qualitative likelihood × impact matrix (workshop scale).',
    },
  })
  const scInsider = createScenario({
    'bom-ref': STABLE.scInsider,
    name: 'Insider exfiltrates order records',
    description:
      'Privileged insider queries Orders DB and exports PII (disclosure + elevation).',
    threats: [STABLE.tDisclose, STABLE.tEop],
    intent: 'opportunistic',
    accessLevel: 'privileged',
    affectedAssets: [STABLE.ordersDb],
    likelihood: {
      level: 'low',
      rationale: 'Requires privileged access; fewer actors but higher capability.',
    },
    impact: {
      level: 'catastrophic',
      polarity: 'harm',
      rationale: 'Large-scale PII exposure and regulatory impact.',
    },
    riskScore: {
      level: computeRiskLevel('low', 'catastrophic'),
      methodology: 'qualitative-matrix',
    },
  })
  const scTamper = createScenario({
    'bom-ref': STABLE.scTamper,
    name: 'Client-side price manipulation',
    description:
      'Attacker alters order amount in browser requests before gateway validation.',
    threats: [STABLE.tTamper],
    intent: 'opportunistic',
    accessLevel: 'external',
    affectedAssets: [STABLE.customer, STABLE.checkout],
    likelihood: { level: 'high', rationale: 'Trivial to attempt without signed server prices.' },
    impact: {
      level: 'moderate',
      polarity: 'harm',
      rationale: 'Revenue loss per order; detectable in reconciliation.',
    },
    riskScore: {
      level: computeRiskLevel('high', 'moderate'),
      methodology: 'qualitative-matrix',
    },
  })
  const scDos = createScenario({
    'bom-ref': STABLE.scDos,
    name: 'Sustained checkout flood during peak sale',
    description:
      'Botnet floods place-order endpoint during a campaign, degrading availability.',
    threats: [STABLE.tDos],
    intent: 'targeted',
    accessLevel: 'external',
    affectedAssets: [STABLE.gateway, STABLE.checkout],
    likelihood: { level: 'medium' },
    impact: {
      level: 'major',
      polarity: 'harm',
      rationale: 'Lost sales and SLA breach during peak.',
    },
    riskScore: {
      level: computeRiskLevel('medium', 'major'),
      methodology: 'qualitative-matrix',
    },
  })
  const scLink = createScenario({
    'bom-ref': STABLE.scLink,
    name: 'Partner correlates orders to profiles',
    description:
      'Analytics partner joins order identifiers with other datasets to profile customers.',
    threats: [STABLE.tLink],
    intent: 'opportunistic',
    accessLevel: 'internal',
    affectedAssets: [STABLE.ordersDb],
    likelihood: { level: 'medium' },
    impact: {
      level: 'moderate',
      polarity: 'harm',
      rationale: 'Privacy harm and possible GDPR Article 5/6 issues.',
    },
    riskScore: {
      level: computeRiskLevel('medium', 'moderate'),
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
      authors: [
        { name: 'Alex Facilitator', email: 'alex@example.com' },
        { name: 'Sam Architect', email: 'sam@example.com' },
        { name: 'Riley AppSec', email: 'riley@example.com' },
      ],
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
    properties: [
      {
        name: 'tmbom-studio:session-title',
        value: 'Checkout API design review workshop',
      },
      { name: 'tmbom-studio:session-date', value: '2026-07-22' },
      {
        name: 'tmbom-studio:session-notes',
        value:
          'Standards used: STRIDE, LINDDUN, attack trees, ISO 31000-style treatments (reduce/transfer/accept). Ratings use CycloneDX qualitative likelihood/impact levels.',
      },
    ],
    externalReferences: [
      {
        type: 'bom',
        url: 'urn:cdx:a1b2c3d4-e5f6-7890-abcd-ef1234567890/1',
        comment: 'BOM-Link to this TM-BOM document',
      },
      {
        type: 'bom',
        url: 'https://example.com/boms/checkout-api-1.2.0.cdx.json',
        comment: 'Related SBOM for Checkout API 1.2.0 (example URL)',
      },
      {
        type: 'vulnerability-assertion',
        url: 'https://example.com/vex/checkout-api-1.2.0.vex.json',
        comment: 'Related VEX assertions for known CVEs (example URL)',
      },
    ],
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
      methodologies: ['STRIDE', 'LINDDUN', 'attack-tree'],
      threats: [tSpoof, tTamper, tDisclose, tDos, tEop, tLink],
      scenarios: [scSpoof, scInsider, scTamper, scDos, scLink],
      attackPatterns,
      attackTrees,
    },
    risks: {
      risks: [
        createRisk({
          'bom-ref': STABLE.riskFraud,
          name: 'Fraudulent order fulfillment',
          statement:
            'If an attacker spoofs trusted API callers, then fraudulent orders may be fulfilled, resulting in financial loss and customer distrust.',
          domains: [{ type: 'security' }, { type: 'financial' }],
          relatedThreats: [STABLE.tSpoof, STABLE.scSpoof],
          affects: [STABLE.checkout],
          inherentRisk: {
            likelihood: { level: 'medium' },
            impact: { level: 'major', polarity: 'harm' },
            score: {
              level: 'high',
              methodology: 'qualitative-matrix',
              rationale: 'ISO 31000-aligned qualitative assessment in workshop.',
            },
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
                'Require mTLS and short-lived signed tokens for service-to-service calls; rotate keys automatically (NIST SP 800-57 key management practices).',
              cost: 'medium',
              addresses: [STABLE.tSpoof],
            },
          ],
        }),
        createRisk({
          'bom-ref': STABLE.riskPii,
          name: 'Customer PII breach',
          statement:
            'If Orders DB access controls fail, then customer PII may be disclosed, resulting in regulatory penalties and reputational harm.',
          domains: [{ type: 'privacy' }, { type: 'security' }, { type: 'compliance' }],
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
                'Maintain cyber insurance covering privacy incidents (ISO 31000 risk transfer).',
              cost: 'medium',
            },
          ],
        }),
        createRisk({
          'bom-ref': STABLE.riskAvail,
          name: 'Checkout unavailability during peak',
          statement:
            'If volumetric or application-layer floods overwhelm the gateway, then checkout becomes unavailable, resulting in lost revenue and SLA breach.',
          domains: [{ type: 'security' }, { type: 'operational' }],
          relatedThreats: [STABLE.tDos, STABLE.scDos],
          affects: [STABLE.gateway, STABLE.checkout],
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
              'bom-ref': STABLE.respWaf,
              strategy: 'reduce',
              description:
                'Deploy WAF, rate limiting, and autoscaling; rehearse capacity for peak events.',
              cost: 'medium',
              addresses: [STABLE.tDos],
            },
            {
              'bom-ref': STABLE.respAcceptDos,
              strategy: 'accept',
              description:
                'Accept residual risk of extreme volumetric attacks beyond contracted CDN/WAF capacity; document in risk register.',
              cost: 'trivial',
            },
          ],
        }),
        createRisk({
          'bom-ref': STABLE.riskIntegrity,
          name: 'Order amount integrity failure',
          statement:
            'If clients can alter prices without server-side binding, then underpriced orders may be accepted, resulting in revenue leakage.',
          domains: [{ type: 'security' }, { type: 'financial' }],
          relatedThreats: [STABLE.tTamper, STABLE.scTamper],
          affects: [STABLE.checkout],
          inherentRisk: {
            likelihood: { level: 'high' },
            impact: { level: 'moderate', polarity: 'harm' },
            score: { level: 'high', methodology: 'qualitative-matrix' },
          },
          residualRisk: {
            likelihood: { level: 'very-low' },
            impact: { level: 'low', polarity: 'harm' },
            score: { level: 'low', methodology: 'qualitative-matrix' },
          },
          responses: [
            {
              'bom-ref': STABLE.respSign,
              strategy: 'reduce',
              description:
                'Bind prices server-side; reject client-supplied amounts; use signed cart payloads.',
              cost: 'low',
              addresses: [STABLE.tTamper],
            },
          ],
        }),
        createRisk({
          'bom-ref': STABLE.riskPrivacyLink,
          name: 'Unlawful customer profiling via linkability',
          statement:
            'If order identifiers enable cross-dataset linkage without a lawful basis, then customers may be profiled, resulting in privacy non-compliance.',
          domains: [{ type: 'privacy' }, { type: 'compliance' }],
          relatedThreats: [STABLE.tLink, STABLE.scLink],
          affects: [STABLE.ordersDb],
          inherentRisk: {
            likelihood: { level: 'medium' },
            impact: { level: 'moderate', polarity: 'harm' },
            score: { level: 'medium', methodology: 'qualitative-matrix' },
          },
          residualRisk: {
            likelihood: { level: 'low' },
            impact: { level: 'low', polarity: 'harm' },
            score: { level: 'low', methodology: 'qualitative-matrix' },
          },
          responses: [
            {
              'bom-ref': STABLE.respMinimize,
              strategy: 'reduce',
              description:
                'Apply data minimization and pseudonymization for partner exports; review lawful basis (LINDDUN / GDPR-aligned control).',
              cost: 'medium',
              addresses: [STABLE.tLink],
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
