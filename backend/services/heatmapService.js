// Mock regional heatmap data for India
const MOCK_REGIONS = [
  { region: 'Bihar Rural North', state: 'Bihar', coordinates: { lat: 25.5941, lng: 85.1376 }, totalMothers: 842, highRiskCount: 312, moderateRiskCount: 285, lowRiskCount: 245, activeNurses: 24, activeDoctors: 8, hospitalizationRate: 18.2, preventedComplications: 94, avgDistanceToHospital: 34, biasAdjustmentFactor: 1.4 },
  { region: 'Jharkhand Tribal Belt', state: 'Jharkhand', coordinates: { lat: 23.6102, lng: 85.2799 }, totalMothers: 523, highRiskCount: 228, moderateRiskCount: 165, lowRiskCount: 130, activeNurses: 15, activeDoctors: 4, hospitalizationRate: 22.1, preventedComplications: 67, avgDistanceToHospital: 48, biasAdjustmentFactor: 1.5 },
  { region: 'Rajasthan Desert Zone', state: 'Rajasthan', coordinates: { lat: 26.9124, lng: 70.9024 }, totalMothers: 687, highRiskCount: 198, moderateRiskCount: 234, lowRiskCount: 255, activeNurses: 19, activeDoctors: 6, hospitalizationRate: 15.4, preventedComplications: 78, avgDistanceToHospital: 42, biasAdjustmentFactor: 1.35 },
  { region: 'UP Eastern District', state: 'Uttar Pradesh', coordinates: { lat: 26.7606, lng: 83.3732 }, totalMothers: 1124, highRiskCount: 387, moderateRiskCount: 342, lowRiskCount: 395, activeNurses: 38, activeDoctors: 12, hospitalizationRate: 16.8, preventedComplications: 143, avgDistanceToHospital: 28, biasAdjustmentFactor: 1.3 },
  { region: 'Mumbai Urban', state: 'Maharashtra', coordinates: { lat: 19.0760, lng: 72.8777 }, totalMothers: 2341, highRiskCount: 312, moderateRiskCount: 587, lowRiskCount: 1442, activeNurses: 67, activeDoctors: 34, hospitalizationRate: 8.2, preventedComplications: 189, avgDistanceToHospital: 4, biasAdjustmentFactor: 1.0 },
  { region: 'Odisha Coastal', state: 'Odisha', coordinates: { lat: 20.2961, lng: 85.8245 }, totalMothers: 445, highRiskCount: 156, moderateRiskCount: 148, lowRiskCount: 141, activeNurses: 14, activeDoctors: 5, hospitalizationRate: 19.3, preventedComplications: 52, avgDistanceToHospital: 31, biasAdjustmentFactor: 1.35 },
  { region: 'Himachal Hill District', state: 'Himachal Pradesh', coordinates: { lat: 31.1048, lng: 77.1734 }, totalMothers: 234, highRiskCount: 89, moderateRiskCount: 78, lowRiskCount: 67, activeNurses: 9, activeDoctors: 3, hospitalizationRate: 21.4, preventedComplications: 34, avgDistanceToHospital: 52, biasAdjustmentFactor: 1.45 },
  { region: 'Tamil Nadu Semi-Urban', state: 'Tamil Nadu', coordinates: { lat: 11.1271, lng: 78.6569 }, totalMothers: 876, highRiskCount: 145, moderateRiskCount: 278, lowRiskCount: 453, activeNurses: 29, activeDoctors: 11, hospitalizationRate: 9.8, preventedComplications: 112, avgDistanceToHospital: 12, biasAdjustmentFactor: 1.1 },
  { region: 'Delhi NCR', state: 'Delhi', coordinates: { lat: 28.6139, lng: 77.2090 }, totalMothers: 3245, highRiskCount: 412, moderateRiskCount: 897, lowRiskCount: 1936, activeNurses: 89, activeDoctors: 45, hospitalizationRate: 7.4, preventedComplications: 267, avgDistanceToHospital: 3, biasAdjustmentFactor: 1.0 },
  { region: 'Assam Tea Garden', state: 'Assam', coordinates: { lat: 26.2006, lng: 92.9376 }, totalMothers: 312, highRiskCount: 134, moderateRiskCount: 98, lowRiskCount: 80, activeNurses: 10, activeDoctors: 3, hospitalizationRate: 24.1, preventedComplications: 41, avgDistanceToHospital: 38, biasAdjustmentFactor: 1.45 }
];

function getHeatmapData() {
  return MOCK_REGIONS.map(r => ({
    ...r,
    riskDensity: Math.round((r.highRiskCount / r.totalMothers) * 100),
    coverageGap: Math.max(0, 100 - Math.round((r.activeNurses / (r.totalMothers / 30)) * 100))
  }));
}

function getRegionStats() {
  const data = getHeatmapData();
  return {
    totalRegions: data.length,
    totalMothers: data.reduce((a, b) => a + b.totalMothers, 0),
    totalHighRisk: data.reduce((a, b) => a + b.highRiskCount, 0),
    totalPrevented: data.reduce((a, b) => a + b.preventedComplications, 0),
    avgHospitalDistance: Math.round(data.reduce((a, b) => a + b.avgDistanceToHospital, 0) / data.length),
    regions: data
  };
}

module.exports = { getHeatmapData, getRegionStats };
