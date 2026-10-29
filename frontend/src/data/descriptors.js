// Plain-language meaning of the 20 descriptors the model uses
export const DESCRIPTORS = {
  SMR_VSA10: 'Surface area of highly polarizable atoms',
  SlogP_VSA10: 'Surface area of mildly water-repelling atoms',
  PEOE_VSA8: 'Surface area of atoms with a slight positive charge',
  MinEStateIndex: 'Lowest electronic state of any atom',
  BalabanJ: 'How branched and compact the structure is',
  SlogP_VSA1: 'Surface area of strongly water-loving atoms',
  EState_VSA4: 'Surface area in electronic-state band 4',
  SlogP_VSA5: 'Surface area of slightly water-repelling atoms',
  MaxPartialCharge: 'Largest positive charge on any atom',
  PEOE_VSA2: 'Surface area of clearly negative atoms',
  PEOE_VSA6: 'Surface area of slightly negative atoms',
  PEOE_VSA7: 'Surface area of nearly neutral, slightly negative atoms',
  PEOE_VSA9: 'Surface area of mildly positive atoms',
  FractionCSP3: 'Share of carbons that are saturated (sp3)',
  EState_VSA1: 'Surface area in electronic-state band 1',
  MinAbsEStateIndex: 'Electronic state closest to zero',
  Kappa3: 'Overall molecular shape and branching',
  SMR_VSA5: 'Surface area of moderately polarizable atoms',
  MinAbsPartialCharge: 'Partial charge closest to zero',
  SMR_VSA6: 'Surface area of atoms in the next polarizability band',
}

// Well-known drugs for the demo
export const KNOWN_DRUGS = [
  { name: 'Paracetamol', note: 'Common painkiller', smiles: 'CC(=O)Nc1ccc(O)cc1' },
  { name: 'Ibuprofen', note: 'Common anti-inflammatory', smiles: 'CC(C)Cc1ccc(cc1)C(C)C(=O)O' },
]

// The one DIA-positive test-set drug shown in the demo: a known false negative
export const FALSE_NEGATIVE = {
  name: 'Venlafaxine',
  smiles: 'COc1ccc(cc1)[C@H](CN(C)C)C2(O)CCCCC2',
  note: 'Known DIA-positive. The model misses this one (false negative).',
}
