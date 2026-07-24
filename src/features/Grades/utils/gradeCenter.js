export const SCHOOL_ASSESSMENT_TYPES = [
  'Quiz',
  'Assignment',
  'Class Test',
  'Term Exam',
  'Project',
  'Practical'
];

export const UNI_ASSESSMENT_TYPES = [
  'Assignment',
  'Quiz',
  'Mid Exam',
  'Final Exam',
  'Lab',
  'Presentation',
  'Project'
];

export const getEducationMode = (settings) => {
  return settings?.mode || 'university'; // fallback
};

export const isSchoolMode = (settings) => {
  return getEducationMode(settings) === 'school';
};

export const getTermLabel = (settings) => {
  return getEducationMode(settings) === 'school' ? 'Term' : 'Semester';
};

export const getGradeLabel = (settings) => {
  return getEducationMode(settings) === 'school' ? 'Average' : 'GPA';
};

export const getAssessmentTypes = (settings) => {
  return getEducationMode(settings) === 'school' 
    ? SCHOOL_ASSESSMENT_TYPES 
    : UNI_ASSESSMENT_TYPES;
};
