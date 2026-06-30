window.SymphonyPolicy = {
  brand: {
    name: 'Symphony Fleet',
    tagline: 'Driver Assist',
    version: '1.0'
  },

  contacts: {
    emergency: '999',
    support: { display: '0800-SYMPHONY', digits: '0800-7967426', international: '+44 20 4538 7700' },
    breakdown: { display: '0800-SYMPHONY-1', digits: '0800-79674261', international: '+44 20 4538 7799' },
    chargeCardHelpline: '0800 028 9393',
    finance: 'finance.ops@symphonyfleet.co.uk',
    dispatch: 'dispatch@symphonyfleet.co.uk'
  },

  greetings: [
    "Hi, I'm Symphony Assist. I'm here to help with your shift. What do you need?",
    "Hey — Symphony Assist here. What can I help with today?",
    "Hi, I'm here for the shift. Ask me about charging, routes, or deliveries."
  ],

  emergencySafety: {
    response: "<p>If this is a safety emergency, call <strong>999</strong> immediately. Once you and others are safe, call Symphony on <strong>0800-SYMPHONY</strong> to log the incident and arrange a replacement vehicle.</p>",
    followupChips: []
  },

  emergencyPatterns: [
    /\b(crash\w*|collid\w*|smash\w*|accident\w*)/i,
    /\b(fire\w*|burn\w*|smoke\w*)/i,
    /\b(hurt|injured|injur\w*|bleed\w*|wound\w*)/i,
    /\b(medical\w*|ambulance\w*|hospital\w*|paramedic\w*)/i,
    /\b(police\w*)/i,
    /\b(999)\b/,
    /\b(in danger|life[\s-]?threatening)/i,
    /\b(trapped\w*)/i
  ],

  categories: [
    {
      id: 'handover-battery',
      title: 'Handover and battery',
      keywords: [
        'handover', 'hand over', 'hand-over',
        'battery', 'charge', 'soc', 'state of charge',
        'next shift', 'next driver', 'shift change', 'changeover',
        'walk around', 'walk-around', 'walkaround',
        'vehicle condition', 'end shift', 'start shift',
        'rear', 'dashboard', 'open boot', 'show-ready', 'show ready',
        'reject', 'pause',
        'low-battery', 'low battery',
        'stratford', 'brent cross',
        'photos', 'photo', 'rubbish', 'cables', 'spills', 'warning',
        'minimum', 'leave', 'return', 'end of shift',
        'investigation', 'review', 'fee', 'deduction', '35'
      ],
      triggers: [
        /minimum.*(battery|soc|charge)/i,
        /(battery|soc|charge).*minimum/i,
        /state of charge/i,
        /low[\s-]?battery.*(fee|deduction|handover)/i,
        /(fee|deduction).*low[\s-]?battery/i,
        /walk[\s-]?around/i,
        /vehicle condition/i,
        /(reject|pause).*handover/i,
        /handover.*(reject|pause)/i,
        /shift.*change|changeover|next.*shift/i,
        /skip[\s-]?shift|driver.*no[\s-]?show/i,
        /how many.*photos?|photos?.*required/i,
        /what.*(battery|charge|soc).*(leave|return|hand)/i,
        /leave.*(battery|charge|soc)/i,
        /hand.*over|handed/i,
        /how much.*(battery|charge)/i,
        /£\s?35|35.*fee/i
      ],
      response: "<p>Hand the van back at <strong>30% State of Charge</strong> or above. <strong>40%</strong> is recommended so the next driver can take a peak-hour Heathrow run without stopping.</p><p>If you hand back below 20%, Symphony takes an automatic <strong>£35 low-battery fee</strong> from your handover pay and you'll need to top up before you leave. Below 10% triggers an Ops review.</p><p>Complete the mandatory <strong>8-photo walk-around</strong> (front, rear, both sides, all four corners, dashboard, open boot), remove your cables and rubbish, then tap <strong>End Shift</strong>.</p>",
      followupChips: [
        'What if the battery is below 20%?',
        'How do I reject a handover?',
        'What if the previous driver left it low?',
        'Different question'
      ]
    },

    {
      id: 'charging-networks',
      title: 'Approved charging networks',
      keywords: [
        'charge', 'charging', 'charger', 'network', 'networks',
        'bp pulse', 'bp', 'pulse',
        'ionity', 'shell', 'shell recharge', 'gridserve',
        'osprey', 'instavolt', 'geniepoint', 'genie point',
        'pod point', 'pod',
        'charge card', 'fuel card', 'allstar', 'allstar plus',
        'tesla', 'supercharger', 'super charger',
        'idle', 'idle fee', 'idle fees',
        'kw', 'speed', 'fast', 'rapid'
      ],
      triggers: [
        /bp[\s-]?pulse/i,
        /ionity/i,
        /shell[\s-]?recharge/i,
        /gridserve/i,
        /\bosprey\b/i,
        /instavolt/i,
        /genie[\s-]?point/i,
        /pod[\s-]?point/i,
        /tesla[\s-]?super[\s-]?charger/i,
        /charge[\s-]?card|fuel[\s-]?card|allstar/i,
        /approved.*(network|charger|station)/i,
        /(network|charger|station).*approved/i,
        /where.*(charge|charger|station)/i,
        /idle[\s-]?fee/i,
        /how.*charge/i
      ],
      response: "<p>Use the Symphony charge card on: <strong>bp pulse, Shell Recharge, GRIDSERVE, Ionity, Osprey, InstaVolt, GeniePoint,</strong> and <strong>Pod Point</strong>.</p><p>Two important rules: <strong>Ionity</strong> must be paid via the Ionity app, not the card (card payments add a £1.50 surcharge that is not refunded). <strong>Tesla Supercharger</strong> is not approved under the card — only use it in a genuine emergency, and only with an authorisation code from Symphony Ops.</p><p>Check live availability in the <strong>Allstar Plus</strong> app or the Symphony Driver App charging tab.</p>",
      followupChips: [
        'What if a charger is offline?',
        'Tesla Supercharger rules',
        'What are the idle fees?',
        'Different question'
      ]
    },

    {
      id: 'damage-condition',
      title: 'Vehicle damage and condition',
      keywords: [
        'damage', 'damaged', 'scratch', 'scratched', 'dent', 'dented',
        'scuff', 'scuffed', 'broken', 'crack', 'cracked', 'smashed',
        'report', 'reporting', 'reported',
        'pre-existing', 'pre existing', 'preexisting',
        'previous driver', 'previous shift', 'last driver', 'last shift',
        'dirty', 'filthy', 'messy', 'mess', 'rubbish', 'stain', 'stained', 'smelly',
        'liability', 'liable', 'blame', 'blamed',
        'photo', 'photos', 'evidence', 'video',
        'inspection', 'inspect',
        'condition', 'interior', 'exterior', 'warning light',
        'dashcam', 'dash cam',
        'exif', 'timestamp', 'geo', 'geotag',
        'log', 'logged', 'submit', 'submitted'
      ],
      triggers: [
        /report.*damage|damage.*report/i,
        /pre[\s-]?existing/i,
        /previous[\s-]?(driver|shift)/i,
        /(car|van|interior).*(dirty|filthy|messy|smelly|dirty|stained)/i,
        /(dirty|filthy|messy|smelly|stained).*(car|van|interior)/i,
        /photo[\s-]?evidence/i,
        /(liability|blame|blamed)/i,
        /dispute/i,
        /mid[\s-]?shift.*damage/i,
        /damage.*mid[\s-]?shift/i,
        /inspection/i,
        /walk[\s-]?around.*video/i,
        /(car|van).*(when|that).*(i|we).*(pick|got|receive)/i
      ],
      response: "<p>Open the app and go to <strong>Vehicle</strong> → <strong>Report Damage</strong>. You'll take <strong>6 photos</strong> (front, rear, driver-side, passenger-side, dashboard, charging port) in good light with original EXIF timestamps.</p><p>If the damage was there at the start of your shift, file a <strong>Pre-existing Condition</strong> report before you drive — that's what protects you from being blamed for the previous driver's mess. Add <strong>3 photos and a 10-second walk-around video</strong>.</p><p>Discovered mid-shift: stop safely, photograph, then file a <strong>Mid-Shift Damage</strong> report. Telematics plus your photo time establish the discovery window. To dispute a charge against you, raise a <strong>Liability Dispute</strong> in the app within 72 hours.</p>",
      followupChips: [
        'How do I dispute a damage charge?',
        'What if the car was dirty when I got it?',
        'How many photos do I need?',
        'Different question'
      ]
    },

    {
      id: 'tolls-fees',
      title: 'Tolls and fees',
      keywords: [
        'heathrow', 't5', 't2', 't3', 't4', 'terminal',
        'drop-off', 'drop off', 'dropoff',
        'airport',
        'congestion', 'congestion charge', 'cc', 'central london',
        'dartford', 'dart', 'dart charge', 'crossing',
        'ulez', 'clean air', 'caz',
        'reimburs', 'reimburse', 'reimbursement',
        'claim', 'expense', 'receipt', 'receipts',
        'bolt', 'uber', 'freenow', 'via', 'ola',
        'anpr', 'barrier', 'toll', 'tolls', 'fee', 'fees',
        'blackwall', 'silvertown', 'tunnel',
        'stratford city'
      ],
      triggers: [
        /heathrow/i,
        /\bt[2-5]\b/i,
        /drop[\s-]?off/i,
        /airport/i,
        /congestion|central[\s-]?london/i,
        /dartford|dart[\s-]?charge/i,
        /\bulez\b|clean[\s-]?air/i,
        /reimburs|claim.*back|expense/i,
        /\bbolt\b/i,
        /\buber\b/i,
        /freenow|via\b|\bola\b/i,
        /blackwall|silvertown/i,
        /submit.*receipt|receipt.*submit/i
      ],
      response: "<p>Heathrow T5 (and T2/3/4) drop-off is <strong>£5.50 per visit</strong>. You pay at the barrier or it's auto-charged via ANPR. It's <strong>reimbursable</strong> — submit the receipt in the app under <strong>Receipts → New Claim</strong> within <strong>14 days</strong>.</p><p>Platform rules: on <strong>Uber</strong>, the £5.50 is paid by Uber directly via the Uber Driver app — do not claim from Symphony. On <strong>Bolt, FreeNow,</strong> and <strong>Via</strong>, you pay and submit the receipt within 14 days.</p><p>The <strong>Congestion Charge</strong> is auto-reconciled via ANPR (don't pay yourself). <strong>ULEZ</strong> costs nothing — all Symphony EVs are compliant. <strong>Dartford Crossing</strong> is £2.50, reimbursable on receipt.</p>",
      followupChips: [
        'Dartford Crossing',
        'Congestion Charge rules',
        'How do I submit a receipt?',
        'Different question'
      ]
    },

    {
      id: 'emergency',
      title: 'Low battery or stranded',
      keywords: [
        'low battery', 'low charge', 'almost flat', 'nearly flat',
        '5%', '4%', '3%', '2%', '1%', '0%',
        '10%', 'nine percent', 'eight percent',
        'battery dead', 'ran out', 'out of charge', 'no charge',
        'stranded',
        'broken charger', 'charger broken', 'charger fault',
        'non-approved', 'non approved', 'unapproved',
        'emergency charging', 'emergency charge',
        'abandoned', 'abandonment',
        'mobile charger', 'rac', 'breakdown', 'break down',
        'flat', 'no power', 'out of power'
      ],
      triggers: [
        /low[\s-]?battery/i,
        /\b[0-9]{1,2}\s?%/i,
        /battery[\s-]?dead|ran[\s-]?out|out[\s-]?of[\s-]?charge/i,
        /stranded/i,
        /broken[\s-]?charger|charger[\s-]?(broken|fault)/i,
        /non[\s-]?approved|unapproved/i,
        /emergency[\s-]?charge/i,
        /abandon/i,
        /mobile[\s-]?charger/i,
        /(broken|won't start|not starting).*charger/i,
        /no[\s-]?(power|charge)|run[\s-]?out/i
      ],
      response: "<p>If your battery is critical and there's no approved station within range, <strong>stop safely</strong> in a well-lit legal spot, hazards on, and call Symphony on <strong>0800-SYMPHONY</strong> (+44 20 4538 7700). Have your driver number, reg, postcode, and current SoC% ready.</p><p>A <strong>mobile charger</strong> is dispatched free of charge — within 45 minutes inside the M25, 90 minutes outside. <strong>Do not leave the vehicle</strong> to walk to a charger; the abandonment fee is <strong>£250</strong> and recovery is at your cost.</p><p>After you're moving, submit an <strong>Emergency Charge</strong> report in the app within 24 hours with the controller's authorisation code. The maximum reimbursed amount in an emergency is <strong>£40 per session</strong> without Manager sign-off.</p>",
      followupChips: [
        'Calling dispatch now',
        'What counts as a non-approved charger?',
        'Authorisation codes',
        'Different question'
      ]
    }
  ],

  outOfScopeFallback: {
    response: "<p>I'm not sure about that one. Please call dispatch on <strong>0800-SYMPHONY</strong> (0800-7967426) and they'll help you out.</p>",
    followupChips: [
      'Call dispatch',
      'Find a charger',
      'Different question'
    ]
  },

  starterChips: [
    'Minimum battery at handover',
    'Approved charging networks',
    'Reporting vehicle damage',
    'Heathrow T5 drop-off fee',
    'Low battery emergency'
  ]
};
