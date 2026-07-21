import { calculateInheritance, HeirPresence } from '../lib/inheritance/inheritance-calculator';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ TEST FAILED: ${message}`);
    throw new Error(message);
  }
}

console.log('🧪 Starting Islamic Inheritance Calculation Legal Engine Tests...\n');

// Test 1: Al-Minbariyya (المسألة المنبرية)
// Wife + 2 Daughters + Father + Mother
// Base problem: 24. Shares: Wife 3/24 (1/8), 2 Daughters 16/24 (2/3), Father 4/24 (1/6), Mother 4/24 (1/6). Sum = 27 (Awl = 27).
{
  console.log('Testing Test 1: Al-Minbariyya (Awl from 24 to 27)...');
  const presence: HeirPresence[] = [
    { heirId: 'wife', count: 1, isPresent: true },
    { heirId: 'daughter', count: 2, isPresent: true },
    { heirId: 'father', count: 1, isPresent: true },
    { heirId: 'mother', count: 1, isPresent: true },
  ];

  const results = calculateInheritance(presence, 270000, 0, 0, 0, false, []);
  const problemBase = results[0].problemBase;
  const isAwl = results[0].calculationType === 'awl';

  assert(problemBase === 27, `Expected problemBase 27 due to Awl, got ${problemBase}`);
  assert(isAwl === true, 'Expected calculationType to be "awl"');

  const wife = results.find(r => r.heirId === 'wife');
  assert(wife?.amount === 30000, `Expected wife share 30,000, got ${wife?.amount}`);

  console.log('✅ Test 1 Passed!');
}

// Test 2: Al-Gharawain / Umariyatain (الغراوان - زوج وأبوان)
// Husband + Mother + Father
// Husband gets 1/2. Mother gets 1/3 of remainder (which is 1/6 of total). Father gets rest (1/3 of total).
{
  console.log('\nTesting Test 2: Al-Gharawain (Husband + Mother + Father)...');
  const presence: HeirPresence[] = [
    { heirId: 'husband', count: 1, isPresent: true },
    { heirId: 'mother', count: 1, isPresent: true },
    { heirId: 'father', count: 1, isPresent: true },
  ];

  const results = calculateInheritance(presence, 600000, 0, 0, 0, false, []);
  const husband = results.find(r => r.heirId === 'husband');
  const mother = results.find(r => r.heirId === 'mother');
  const father = results.find(r => r.heirId === 'father');

  assert(husband?.amount === 300000, `Husband should get 300,000 (1/2), got ${husband?.amount}`);
  assert(mother?.amount === 100000, `Mother should get 100,000 (1/3 of remainder), got ${mother?.amount}`);
  assert(father?.amount === 200000, `Father should get 200,000 (asabah rest), got ${father?.amount}`);

  console.log('✅ Test 2 Passed!');
}

// Test 3: Radd Case (الرد)
// Daughter + Mother. Daughter gets 1/2 (3/6), Mother gets 1/6 (1/6). Total = 4/6.
// Remainder 2/6 is redistributed proportionally to Daughter and Mother (Base becomes 4).
{
  console.log('\nTesting Test 3: Radd (Daughter + Mother)...');
  const presence: HeirPresence[] = [
    { heirId: 'daughter', count: 1, isPresent: true },
    { heirId: 'mother', count: 1, isPresent: true },
  ];

  const results = calculateInheritance(presence, 400000, 0, 0, 0, false, []);
  const daughter = results.find(r => r.heirId === 'daughter');
  const mother = results.find(r => r.heirId === 'mother');

  assert(daughter?.amount === 300000, `Daughter should get 3/4 after Radd (300,000), got ${daughter?.amount}`);
  assert(mother?.amount === 100000, `Mother should get 1/4 after Radd (100,000), got ${mother?.amount}`);

  console.log('✅ Test 3 Passed!');
}

// Test 4: Blocking Rules (حجب الحرمان)
// Son blocks Grandson, Full Brother, Paternal Uncle
{
  console.log('\nTesting Test 4: Blocking Rules (Son blocks Grandson & Brother)...');
  const presence: HeirPresence[] = [
    { heirId: 'son', count: 1, isPresent: true },
    { heirId: 'son_son', count: 1, isPresent: true },
    { heirId: 'full_brother', count: 1, isPresent: true },
  ];

  const results = calculateInheritance(presence, 100000, 0, 0, 0, false, []);
  const son = results.find(r => r.heirId === 'son');
  const grandson = results.find(r => r.heirId === 'son_son');
  const brother = results.find(r => r.heirId === 'full_brother');

  assert(son?.amount === 100000, `Son should take entire estate (100,000), got ${son?.amount}`);
  assert(grandson?.isBlocked === true, 'Grandson must be blocked by Son');
  assert(brother?.isBlocked === true, 'Full Brother must be blocked by Son');

  console.log('✅ Test 4 Passed!');
}

// Test 5: Wasiyya Wajiba (الوصية الواجبة)
// Deceased Son had children (1 grandson) before father passed away.
{
  console.log('\nTesting Test 5: Mandatory Bequest (الوصية الواجبة)...');
  const presence: HeirPresence[] = [
    { heirId: 'son', count: 1, isPresent: true },
    { heirId: 'wife', count: 1, isPresent: true },
  ];

  const results = calculateInheritance(
    presence,
    1200000,
    0,
    0,
    0,
    true, // hasMandatoryBequest enabled
    [{ type: 'son', count: 1 }] // 1 pre-deceased son
  );

  const mandatoryBequest = results.find(r => r.heirId === 'mandatory_bequest');
  assert(mandatoryBequest !== undefined && mandatoryBequest.amount > 0, 'Mandatory bequest must be calculated and > 0');

  console.log('✅ Test 5 Passed!');
}

console.log('\n🎉 ALL 5 LEGAL ENGINE UNIT TESTS PASSED SUCCESSFULLY!');
