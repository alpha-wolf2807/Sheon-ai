
const templates = {
  babyWeek: (w) => {
    if (w <= 4) return `Tiny seed alert! At week ${w} your little sprout is just beginning — a magical cellular party is happening.`;
    if (w <= 12) return `Week ${w}: Your baby is developing major organs. Soon there will be tiny hiccups you can chuckle at.`;
    if (w <= 20) return `Week ${w}: Your baby is practicing stretches — getting ready for football tryouts in nine months!`;
    if (w <= 28) return `Week ${w}: Kicks and somersaults incoming. Your baby may be plotting a tiny prank.`;
    if (w <= 36) return `Week ${w}: Cute and crowded — your baby is doing yoga moves. Time for comfortable shoes!`;
    return `Week ${w}: Any day now — baby is almost ready for the big debut. Keep snacks handy for labor stamina!`;
  }
};

function generateBabyGrowthUpdate(week = 12) {
  const w = Math.max(1, Math.min(42, Number(week || 12)));
  const sizeInfo = (() => {
    if (w <= 12) return 'about the size of a lime';
    if (w <= 16) return 'about the size of an avocado';
    if (w <= 20) return 'about the size of a banana';
    if (w <= 24) return 'about the size of an ear of corn';
    if (w <= 28) return 'about the size of a large eggplant';
    if (w <= 32) return 'about the size of a squash';
    if (w <= 36) return 'about the size of a papaya';
    return 'about the size of a pumpkin';
  })();

  const facts = [];
  if (w < 12) facts.push('Major organs begin forming');
  else if (w < 20) facts.push('Facial features and limbs become more defined');
  else if (w < 28) facts.push('Sleeping and waking cycles develop');
  else if (w < 36) facts.push('Lungs are maturing and the baby gains weight quickly');
  else facts.push('Baby is preparing for birth and settling into position');

  return {
    week: w,
    playful: templates.babyWeek(w),
    size: sizeInfo,
    facts,
    tip: `Tip: at week ${w} try gentle walking, hydration and a short rest after meals.`
  };
}

function generateNutritionPlan(profile = {}) {
  const week = Number(profile.weekOfPregnancy) || 20;
  const trimester = week <= 13 ? 1 : week <= 26 ? 2 : 3;
  const recs = [];

  recs.push('Include a variety of whole grains, pulses, fresh fruits and vegetables every day.');
  recs.push('Daily iron-rich foods: spinach, lentils, beetroot, and dates.');
  recs.push('Protein target: include eggs, dals, fish (if permitted), chicken or paneer daily.');

  if (trimester === 1) {
    recs.push('First trimester: manage nausea with small frequent meals; try ginger tea and dry crackers.');
  } else if (trimester === 2) {
    recs.push('Second trimester: increase calories modestly (+250 kcal/day) and focus on calcium-rich foods like milk and yogurt.');
  } else {
    recs.push('Third trimester: prioritize iron and protein; include healthy snacks to manage energy.');
  }

  if (profile.hemoglobin && Number(profile.hemoglobin) < 11) {
    recs.push('Your hemoglobin is low — increase iron intake and consider discussing supplementation with your doctor.');
  }

  if (profile.bloodSugar && Number(profile.bloodSugar) > 140) {
    recs.push('Elevated blood sugar detected — reduce refined carbs and coordinate with your clinician for glucose monitoring.');
  }

  const mealPlan = {
    breakfast: 'Poha/upma with peanuts + glass of milk or curd',
    midMorning: 'Fruit (banana or apple) + handful of nuts',
    lunch: 'Roti/ rice + dal + vegetable + salad + curd',
    evening: 'Sprouted moong chaat or roasted chana',
    dinner: 'Light vegetable curry + chapati + a protein (eggs/paneer)',
    bedtime: 'Warm milk with a date or two'
  };

  return { trimester, week, recommendations: recs, mealPlan };
}

function generateExercisePlan(trimester = 1, phase = 'prenatal', weight) {
  trimester = Number(trimester) || 1;
  const exercises = [];
  if (phase === 'postnatal') {
    exercises.push('Pelvic floor squeezes (Kegels) — 3 sets of 10 daily');
    exercises.push('Gentle walking: start 10-15 minutes and increase gradually');
  } else {
    if (trimester === 1) {
      exercises.push('Gentle yoga: cat-cow, child\'s pose, pelvic tilts');
      exercises.push('Short brisk walks 15-20 minutes daily');
    } else if (trimester === 2) {
      exercises.push('Prenatal yoga: hip openers, seated stretches, wall squats');
      exercises.push('Swimming or water aerobics if available — low impact cardio');
    } else {
      exercises.push('Gentle walking and breathing exercises; avoid supine positions and heavy lifting');
      exercises.push('Pelvic floor relaxation and gentle squats near support');
    }
  }

  const safety = [];
  safety.push('Stop if you feel dizziness, vaginal bleeding, chest pain or severe breathlessness. Contact your clinician.');
  safety.push('Keep hydrated and avoid overheating. Modify intensity based on energy levels.');

  return { trimester, exercises, safety };
}

function generateMedicationGuidance(currentMedications = [], trimester = 1) {
  const guidance = [];
  guidance.push('Always check medications with your prescribing doctor before continuing during pregnancy.');
  if (!currentMedications || currentMedications.length === 0) guidance.push('No medications recorded. If prescribed, list them to get tailored guidance.');

  guidance.push('Generally safe: prenatal vitamins, folic acid, iron supplements (as prescribed).');
  guidance.push('Use caution / consult doctor: NSAIDs like ibuprofen (often avoided especially in later pregnancy).');

  if (currentMedications.length) {
    currentMedications.forEach(m => {
      guidance.push(`Medication noted: ${m} — please confirm safety with your provider.`);
    });
  }

  if (trimester >= 3) {
    guidance.push('Third trimester note: some medicines may affect labor — consult before taking new prescriptions.');
  }

  return { trimester, guidance };
}

function generateEmotionalSupport(moodScore = 5, notes = '') {
  const tips = [];
  const s = Number(moodScore || 5);
  if (s <= 3) {
    tips.push('It sounds tough — prioritize small daily routines, talk to a trusted person, and consider professional help.');
  } else if (s <= 6) {
    tips.push('Some low days are normal; keep a simple gratitude list and short walks to lift mood.');
  } else {
    tips.push('You seem to be coping well; continue self-care and reach out if things change.');
  }
  if (notes) tips.push(`You mentioned: "${notes}" — that matters. Share this with your clinician if worrying persists.`);
  tips.push('If thoughts of self-harm appear, seek immediate help or call local emergency services.');
  return { moodScore: s, tips };
}

module.exports = { generateBabyGrowthUpdate, generateNutritionPlan, generateExercisePlan, generateMedicationGuidance, generateEmotionalSupport };
