import type { CycloneDxBom } from '../types/cyclonedx'
import { writeThreatInScope } from '../types/cyclonedx'
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
  ctrlMtls: 'control-mtls',
  ctrlWaf: 'control-waf',
  ctrlIam: 'control-iam-least-priv',
  ctrlToken: 'control-tokenization',
  tbEdge: 'trust-boundary-edge',
  tbApp: 'trust-boundary-app',
  pathSpoof: 'attack-path-spoof',
  abuseRefund: 'abuse-case-fraudulent-refund',
  reqPci: 'requirement-pci-dss',
  objRevenue: 'objective-revenue-protection',
  ucCheckout: 'use-case-place-order',
  profileOpportunist: 'profile-opportunistic-attacker',
  tLogging: 'threat-logging-tamper',
  scopeCheckout: 'scope-checkout-api',
  compCheckoutLib: 'component-checkout-lib',
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
    origin: 'adversarial',
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
  const tLogging = createThreat({
    'bom-ref': STABLE.tLogging,
    name: 'Centralized logging pipeline tampering',
    description:
      'Attacker alters or deletes audit logs in the organization-wide SIEM. The logging platform is owned by the platform team and is outside the Checkout API responsibility boundary.',
    origin: 'adversarial',
    categories: [{ taxonomy: 'STRIDE', category: 'repudiation' }],
    properties: writeThreatInScope(undefined, false),
  })

  const controls = [
    {
      'bom-ref': STABLE.ctrlMtls,
      name: 'Mutual TLS between services',
      description: 'Require mTLS and short-lived tokens for service-to-service calls.',
      category: 'preventive' as const,
      status: 'implemented' as const,
      appliesTo: [STABLE.gateway, STABLE.checkout],
    },
    {
      'bom-ref': STABLE.ctrlWaf,
      name: 'WAF and rate limiting',
      description: 'Edge WAF rules and per-IP rate limits at the API gateway.',
      category: 'preventive' as const,
      status: 'implemented' as const,
      appliesTo: [STABLE.gateway],
    },
    {
      'bom-ref': STABLE.ctrlIam,
      name: 'Least-privilege IAM',
      description: 'Scoped database roles and deny-by-default service policies.',
      category: 'preventive' as const,
      status: 'in-progress' as const,
      appliesTo: [STABLE.checkout, STABLE.ordersDb],
    },
    {
      'bom-ref': STABLE.ctrlToken,
      name: 'Payment tokenization',
      description: 'PAN never stored; only provider tokens persisted in Orders DB.',
      category: 'preventive' as const,
      status: 'verified' as const,
      appliesTo: [STABLE.checkout, STABLE.ordersDb],
    },
  ]

  const trustBoundaries = [
    {
      'bom-ref': STABLE.tbEdge,
      boundary: STABLE.edgeBoundary,
      name: 'Internet → DMZ trust drop',
      trustLevel: 'untrusted' as const,
      threatsAtBoundary: [STABLE.tDos, STABLE.tSpoof],
      controlsAtBoundary: [STABLE.ctrlWaf],
    },
    {
      'bom-ref': STABLE.tbApp,
      boundary: STABLE.appBoundary,
      name: 'DMZ → Private trust drop',
      trustLevel: 'semi-trusted' as const,
      threatsAtBoundary: [STABLE.tEop, STABLE.tDisclose],
      controlsAtBoundary: [STABLE.ctrlIam],
    },
  ]

  const attackPaths = [
    {
      'bom-ref': STABLE.pathSpoof,
      name: 'Credential theft to API impersonation',
      description: 'Phished gateway credentials used to call checkout APIs as a trusted peer.',
      steps: [
        {
          'bom-ref': 'path-step-phish',
          description: 'Phish developer or leak API key from repository',
          attackPattern: STABLE.apTrustedId,
          technique: {
            id: 'T1078',
            name: 'Valid Accounts',
            tactic: 'initial-access',
          },
        },
        {
          'bom-ref': 'path-step-call',
          description: 'Invoke checkout endpoints with stolen credentials',
          boundaryCrossed: STABLE.edgeBoundary,
          mitigations: [STABLE.ctrlMtls],
        },
      ],
    },
  ]

  const abuseCases = [
    {
      'bom-ref': STABLE.abuseRefund,
      name: 'Fraudulent refund via spoofed callbacks',
      description:
        'Abuser triggers refund webhooks without a valid order by impersonating the payment provider.',
      abuser: STABLE.customer,
      targets: [STABLE.checkout],
      realizes: [STABLE.tSpoof],
      mainFlow: [
        { number: 1, description: 'Obtain or guess webhook signing secret' },
        { number: 2, description: 'POST forged refund callback to checkout service' },
      ],
    },
  ]

  // Official CAPEC List 3.9 names/descriptions/ATT&CK mappings (subset used by sample)
  const attackPatterns = [
    {
      'bom-ref': STABLE.apAuthBypass,
      name: 'Authentication Bypass',
      capecId: 115,
      description:
        'An attacker gains access to application, service, or device with the privileges of an authorized or privileged user by evading or circumventing an authentication mechanism. The attacker is therefore able to access protected data without authentication ever having taken place.',
      techniques: [
        { id: 'T1548', name: 'Abuse Elevation Control Mechanism' },
      ],
    },
    {
      'bom-ref': STABLE.apFlood,
      name: 'Flooding',
      capecId: 125,
      description:
        'An adversary consumes the resources of a target by rapidly engaging in a large number of interactions with the target. This type of attack generally exposes a weakness in rate limiting or flow. When successful this attack prevents legitimate users from accessing the service and can cause the target to crash.',
      techniques: [
        {
          id: 'T1498.001',
          name: 'Network Denial of Service: Direct Network Flood',
        },
        { id: 'T1499', name: 'Endpoint Denial of Service' },
      ],
    },
    {
      'bom-ref': STABLE.apSqli,
      name: 'SQL Injection',
      capecId: 66,
      description:
        'This attack exploits target software that constructs SQL statements based on user input. An attacker crafts input strings so that when the target software constructs SQL statements based on the input, the resulting SQL statement performs actions other than those the application intended.',
    },
    {
      'bom-ref': STABLE.apTrustedId,
      name: 'Exploitation of Trusted Identifiers',
      capecId: 21,
      description:
        'An adversary guesses, obtains, or rides a trusted identifier (e.g. session ID, resource ID, cookie, etc.) to perform authorized actions under the guise of an authenticated user or service.',
      techniques: [
        { id: 'T1134', name: 'Access Token Manipulation' },
        { id: 'T1528', name: 'Steal Application Access Token' },
        { id: 'T1539', name: 'Steal Web Session Cookie' },
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
      description: 'Fraudulent fulfillment and chargebacks.',
    },
    riskScore: {
      level: computeRiskLevel('medium', 'major'),
      methodology: 'qualitative-matrix',
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
      description: 'Large-scale PII exposure and regulatory impact.',
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
      description: 'Revenue loss per order; detectable in reconciliation.',
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
      description: 'Lost sales and SLA breach during peak.',
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
      description: 'Privacy harm and possible GDPR Article 5/6 issues.',
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
        scope: {
          'bom-ref': STABLE.scopeCheckout,
          name: 'Checkout API application boundary',
          description:
            'In-scope: Checkout Service, API Gateway configuration, Orders DB schema. Out-of-scope: corporate SIEM/logging platform, payment provider internals.',
          boundaries: [STABLE.edgeBoundary, STABLE.appBoundary],
        },
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
    components: [
      {
        'bom-ref': STABLE.compCheckoutLib,
        type: 'application',
        name: 'checkout-api',
        version: '1.2.0',
        description: 'Checkout API deployable (related SBOM subject)',
        scope: 'required',
      },
    ],
    controls,
    definitions: {
      requirements: [
        {
          'bom-ref': STABLE.reqPci,
          id: 'REQ-PCI-01',
          name: 'PCI-DSS scope minimization',
          description: 'Cardholder data must not persist in Orders DB; tokenization only.',
          priority: 'high',
          status: 'approved',
        },
      ],
      businessObjectives: [
        {
          'bom-ref': STABLE.objRevenue,
          name: 'Protect checkout revenue',
          description: 'Prevent fraudulent or tampered orders from being fulfilled.',
          criticality: 'high',
        },
      ],
      useCases: [
        {
          'bom-ref': STABLE.ucCheckout,
          name: 'Place order',
          description: 'Customer submits cart and payment; order is persisted and charged.',
        },
      ],
    },
    profiles: {
      threatProfiles: [
        {
          'bom-ref': STABLE.profileOpportunist,
          name: 'Opportunistic external attacker',
          description: 'Commodity tooling, no insider access, profit-motivated.',
          sophistication: 'minimal',
          resources: 'limited',
          skillSet: ['web-app', 'credential-theft'],
        },
      ],
    },
    threats: {
      methodologies: ['STRIDE', 'LINDDUN', 'attack-tree'],
      threats: [tSpoof, tTamper, tDisclose, tDos, tEop, tLink, tLogging],
      scenarios: [scSpoof, scInsider, scTamper, scDos, scLink],
      attackPatterns,
      attackTrees,
      attackPaths,
      abuseCases,
      trustBoundaries,
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
            },
            rationale: 'ISO 31000-aligned qualitative assessment in workshop.',
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
              controls: [STABLE.ctrlMtls],
            },
          ],
          status: 'mitigated',
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
              controls: [STABLE.ctrlIam],
            },
            {
              'bom-ref': STABLE.respInsure,
              strategy: 'transfer',
              description:
                'Maintain cyber insurance covering privacy incidents (ISO 31000 risk transfer).',
              cost: 'medium',
            },
          ],
          status: 'assessed',
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
              controls: [STABLE.ctrlWaf],
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
