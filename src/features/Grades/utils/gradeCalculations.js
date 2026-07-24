export const GRADE_SCALE = [
  { min: 90, letter: 'A+', gpa: 4.0 },
  { min: 85, letter: 'A', gpa: 4.0 },
  { min: 80, letter: 'A-', gpa: 3.7 },
  { min: 75, letter: 'B+', gpa: 3.3 },
  { min: 70, letter: 'B', gpa: 3.0 },
  { min: 65, letter: 'B-', gpa: 2.7 },
  { min: 60, letter: 'C+', gpa: 2.3 },
  { min: 50, letter: 'C', gpa: 2.0 },
  { min: 0, letter: 'F', gpa: 0.0 }
];

export const parseScore = (scoreStr) => {
  if (!scoreStr) return 0;
  
  if (typeof scoreStr === 'number') return scoreStr;
  
  if (scoreStr.includes('/')) {
    const [earned, total] = scoreStr.split('/').map(Number);
    if (!isNaN(earned) && !isNaN(total) && total > 0) {
      return (earned / total) * 100;
    }
  } else {
    const num = Number(scoreStr.replace(/[^0-9.]/g, ''));
    if (!isNaN(num)) return num;
  }
  return 0;
};

export const getGradeFromPercentage = (percentage) => {
  const grade = GRADE_SCALE.find(g => percentage >= g.min) || GRADE_SCALE[GRADE_SCALE.length - 1];
  return {
    letter: grade.letter,
    gpaValue: grade.gpa
  };
};

export const calculateCourseGrade = (courseId, assignments) => {
  const courseAssignments = assignments.filter(a => a.courseId === courseId);
  
  let totalScore = 0;
  let totalWeight = 0;

  courseAssignments.forEach(a => {
    // If weight isn't provided, guess it evenly (fallback for MVP data)
    const weight = a.weight || Math.round(100 / (courseAssignments.length || 1));
    const parsedScore = parseScore(a.marks);
    
    if (parsedScore > 0 || (a.marks && a.marks.includes('/'))) {
       totalScore += parsedScore * (weight / 100);
       totalWeight += weight;
    }
  });

  let currentGrade = '--';
  let gpaValue = 0;
  let rawPercentage = 0;

  if (totalWeight > 0) {
    rawPercentage = (totalScore / totalWeight) * 100;
    const { letter, gpaValue: gpa } = getGradeFromPercentage(rawPercentage);
    currentGrade = letter;
    gpaValue = gpa;
  }

  return {
    totalScore,
    totalWeight,
    rawPercentage,
    currentGrade,
    gpaValue,
    currentMarks: totalWeight > 0 ? `${Math.round(rawPercentage)}%` : '--',
    courseAssignments
  };
};

export const calculateAverage = (courseId, assignments) => {
  const courseAssignments = assignments.filter(a => a.courseId === courseId);
  if (courseAssignments.length === 0) return 0;
  const total = courseAssignments.reduce((acc, curr) => acc + parseScore(curr.marks), 0);
  return total / courseAssignments.length;
};

export const simulateGPA = (realCourses, assignments, futureCourses = []) => {
  let totalCredits = 0;
  let totalGradePoints = 0;

  // Process real courses
  realCourses.forEach(course => {
    const { gpaValue, totalWeight } = calculateCourseGrade(course.id, assignments);
    if (totalWeight > 0) {
      const credits = course.credits || 3;
      totalCredits += credits;
      totalGradePoints += gpaValue * credits;
    }
  });

  // Process future simulated courses
  futureCourses.forEach(fc => {
    if (fc.simulatedGrade) {
      const scaleMatch = GRADE_SCALE.find(g => g.letter === fc.simulatedGrade);
      const gpaVal = scaleMatch ? scaleMatch.gpa : 0;
      const credits = fc.credits || 3;
      totalCredits += credits;
      totalGradePoints += gpaVal * credits;
    }
  });

  return totalCredits > 0 ? (totalGradePoints / totalCredits).toFixed(2) : '0.00';
};

export const checkPrerequisites = (courseId, semesterId, allCourses, allSemesters) => {
  const course = allCourses.find(c => c.id === courseId);
  if (!course || !course.prerequisites || course.prerequisites.length === 0) {
    return { met: true, missing: [] };
  }

  const currentSem = allSemesters.find(s => s.id === semesterId);
  if (!currentSem) return { met: true, missing: [] };

  // Helper to find chronological order or index of semester
  const sortedSemesters = [...allSemesters].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  const currentSemIdx = sortedSemesters.findIndex(s => s.id === semesterId);

  const missing = [];
  course.prerequisites.forEach(prereqId => {
    const prereqCourse = allCourses.find(c => c.id === prereqId);
    if (!prereqCourse) return;

    // Check if prerequisite is completed in an earlier semester
    if (!prereqCourse.semesterId) {
      missing.push(prereqCourse.title);
      return;
    }

    const prereqSemIdx = sortedSemesters.findIndex(s => s.id === prereqCourse.semesterId);
    if (prereqSemIdx === -1 || prereqSemIdx >= currentSemIdx) {
      missing.push(prereqCourse.title);
    }
  });

  return {
    met: missing.length === 0,
    missing
  };
};
