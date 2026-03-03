/**
 * Sheon AI - Bias-Calibrated Risk Engine
 * Custom weighted scoring logic - NO Gemini used here
 */

// Bias adjustment multipliers by region (accounts for underreporting, access disparities)
const REGION_BIAS_FACTORS = {
  'rural': 1.35,
  'semi-urban': 1.15,
  'urban': 1.0,
  'tribal': 1.5,
  'hilly': 1.4,
  'default': 1.2
};

// Weights for each risk factor (must sum to ~1.0)
const WEIGHTS = {
  bp: 0.28,
  hemoglobin: 0.22,
  bloodSugar: 0.20,
  age: 0.15,
  distance: 0.15
};

function scoreBP(systolic, diastolic) {
  if (!systolic || !diastolic) return { score: 50, status: 'unknown' };
  if (systolic >= 160 || diastolic >= 110) return { score: 100, status: 'severe-hypertension' };
  if (systolic >= 140 || diastolic >= 90) return { score: 80, status: 'hypertension' };
  if (systolic >= 130 || diastolic >= 80) return { score: 55, status: 'elevated' };
  if (systolic < 90 || diastolic < 60) return { score: 65, status: 'hypotension' };
  if (systolic < 100) return { score: 40, status: 'low-normal' };
  return { score: 10, status: 'normal' };
}

function scoreHemoglobin(hb) {
  if (!hb) return { score: 50, status: 'unknown' };
  if (hb < 7) return { score: 100, status: 'severe-anemia' };
  if (hb < 10) return { score: 75, status: 'moderate-anemia' };
  if (hb < 11) return { score: 45, status: 'mild-anemia' };
  if (hb >= 11 && hb <= 14) return { score: 10, status: 'normal' };
  return { score: 15, status: 'elevated' };
}

function scoreBloodSugar(sugar) {
  if (!sugar) return { score: 50, status: 'unknown' };
  if (sugar > 200) return { score: 95, status: 'severe-hyperglycemia' };
  if (sugar > 140) return { score: 70, status: 'gestational-diabetes' };
  if (sugar > 126) return { score: 50, status: 'pre-diabetic' };
  if (sugar < 70) return { score: 60, status: 'hypoglycemia' };
  return { score: 10, status: 'normal' };
}

function scoreAge(age) {
  if (!age) return { score: 30, status: 'unknown' };
  if (age < 18) return { score: 80, status: 'adolescent-high-risk' };
  if (age > 40) return { score: 75, status: 'advanced-maternal-age' };
  if (age > 35) return { score: 45, status: 'elevated-maternal-age' };
  if (age < 20) return { score: 50, status: 'young-mother' };
  return { score: 10, status: 'optimal' };
}

function scoreDistance(km) {
  if (!km) return { score: 30, status: 'unknown' };
  if (km > 50) return { score: 90, status: 'critically-remote' };
  if (km > 30) return { score: 65, status: 'remote' };
  if (km > 15) return { score: 40, status: 'semi-remote' };
  if (km > 5) return { score: 20, status: 'accessible' };
  return { score: 5, status: 'proximate' };
}

function detectSilentRisk(symptoms = [], vitals = {}) {
  const flags = [];
  const s = symptoms.map(x => x.toLowerCase());

  // Silent preeclampsia pattern
  if (s.includes('headache') && s.includes('swelling')) {
    flags.push('⚠️ Headache + swelling may indicate early preeclampsia');
  }
  if (s.includes('blurred vision') || s.includes('visual disturbance')) {
    flags.push('⚠️ Visual disturbance — possible hypertensive crisis');
  }
  if (s.includes('epigastric pain') && vitals.bloodPressureSystolic > 130) {
    flags.push('⚠️ Upper abdominal pain + elevated BP — HELLP syndrome risk');
  }
  if (s.includes('decreased fetal movement')) {
    flags.push('⚠️ Reduced fetal movement — requires immediate assessment');
  }
  if (s.includes('vaginal bleeding')) {
    flags.push('🔴 Vaginal bleeding — emergency referral may be needed');
  }
  if (s.includes('severe headache') && vitals.bloodPressureSystolic >= 140) {
    flags.push('🔴 Severe headache + hypertension — eclampsia precursor');
  }
  if (s.includes('chest pain') || s.includes('difficulty breathing')) {
    flags.push('🔴 Cardiopulmonary symptoms — urgent evaluation needed');
  }
  // Postpartum depression signals
  if (s.includes('persistent sadness') || s.includes('inability to bond')) {
    flags.push('💜 Postpartum depression indicators detected');
  }

  return { detected: flags.length > 0, flags };
}

function getBiasAdjustment(profile) {
  const region = (profile.region || '').toLowerCase();
  let multiplier = REGION_BIAS_FACTORS.default;
  let reason = 'Standard regional adjustment applied';

  if (region.includes('rural')) { multiplier = REGION_BIAS_FACTORS.rural; reason = 'Rural area: increased under-reporting of complications'; }
  else if (region.includes('tribal') || region.includes('adivasi')) { multiplier = REGION_BIAS_FACTORS.tribal; reason = 'Tribal area: significant healthcare access disparity'; }
  else if (region.includes('hill') || region.includes('mountain')) { multiplier = REGION_BIAS_FACTORS.hilly; reason = 'Hilly terrain: emergency access severely limited'; }
  else if (region.includes('urban') || region.includes('city') || region.includes('metro')) { multiplier = REGION_BIAS_FACTORS.urban; reason = 'Urban area: standard calibration'; }
  else if (region.includes('semi')) { multiplier = REGION_BIAS_FACTORS['semi-urban']; reason = 'Semi-urban: moderate access disparity'; }

  // Additional bias for age-related under-diagnosis
  if (profile.age && profile.age < 20) {
    multiplier = Math.min(multiplier + 0.1, 1.6);
    reason += ' + adolescent care bias adjustment';
  }

  return { multiplier, reason, region: profile.region || 'Unknown' };
}

function getRiskLevel(score) {
  if (score >= 65) return 'high';
  if (score >= 35) return 'moderate';
  return 'low';
}

/**
 * Main risk calculation function
 */
function calculateRisk(profile) {
  const bp = scoreBP(profile.bloodPressureSystolic, profile.bloodPressureDiastolic);
  const hb = scoreHemoglobin(profile.hemoglobin);
  const sugar = scoreBloodSugar(profile.bloodSugar);
  const age = scoreAge(profile.age);
  const distance = scoreDistance(profile.distanceToHospital);
  const silentRisk = detectSilentRisk(profile.symptoms || [], profile);
  const biasAdjustment = getBiasAdjustment(profile);

  // Weighted raw score
  const rawScore = Math.round(
    bp.score * WEIGHTS.bp +
    hb.score * WEIGHTS.hemoglobin +
    sugar.score * WEIGHTS.bloodSugar +
    age.score * WEIGHTS.age +
    distance.score * WEIGHTS.distance
  );

  // Silent risk boost
  const silentBoost = silentRisk.flags.length * 8;
  const uncalibratedScore = Math.min(100, rawScore + silentBoost);

  // Apply bias calibration
  const calibratedScore = Math.min(100, Math.round(uncalibratedScore * biasAdjustment.multiplier));
  const riskLevel = getRiskLevel(calibratedScore);

  const breakdown = {
    bp: { ...bp, weight: WEIGHTS.bp, contribution: Math.round(bp.score * WEIGHTS.bp) },
    hemoglobin: { ...hb, weight: WEIGHTS.hemoglobin, contribution: Math.round(hb.score * WEIGHTS.hemoglobin) },
    bloodSugar: { ...sugar, weight: WEIGHTS.bloodSugar, contribution: Math.round(sugar.score * WEIGHTS.bloodSugar) },
    age: { ...age, weight: WEIGHTS.age, contribution: Math.round(age.score * WEIGHTS.age) },
    distance: { ...distance, weight: WEIGHTS.distance, contribution: Math.round(distance.score * WEIGHTS.distance) },
    silentRisk
  };

  return {
    rawScore,
    uncalibratedScore,
    calibratedScore,
    riskScore: calibratedScore,
    riskLevel,
    breakdown,
    biasAdjustment,
    recommendations: getRecommendations(riskLevel, breakdown, profile)
  };
}

function getRecommendations(level, breakdown, profile) {
  const recs = [];
  if (level === 'high') {
    recs.push('Immediate medical consultation required');
    recs.push('Do not delay — contact your assigned doctor today');
  }
  if (breakdown.bp.status === 'hypertension' || breakdown.bp.status === 'severe-hypertension') {
    recs.push('Monitor blood pressure every 4 hours');
    recs.push('Reduce sodium intake; rest in left lateral position');
  }
  if (breakdown.hemoglobin.status.includes('anemia')) {
    recs.push('Iron-rich foods: green leafy vegetables, lentils, dates');
    recs.push('Consider iron supplementation — discuss with doctor');
  }
  if (breakdown.bloodSugar.status.includes('diabetes')) {
    recs.push('Reduce refined carbohydrates; monitor glucose daily');
    recs.push('Schedule gestational diabetes counseling');
  }
  if (breakdown.distance.status === 'remote' || breakdown.distance.status === 'critically-remote') {
    recs.push('Identify nearest referral hospital in advance');
    recs.push('Keep emergency contact of local ASHA worker ready');
  }
  if (breakdown.silentRisk.detected) {
    recs.push('Silent risk patterns detected — do not ignore mild symptoms');
  }
  return recs;
}

module.exports = { calculateRisk, detectSilentRisk, getBiasAdjustment };
