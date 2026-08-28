const fs = require('fs');
const path = require('path');

const filePath = path.resolve('c:/Users/VanDinh/OneDrive/Máy tính/hsk-learning/app/components/GameMap/WorldMap.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Remove STAGE_TEMPLATES_BY_LEVEL definition
const startMarker = "// Predefined thematic stages (ải) for all HSK 3.0 Bậc and HSK 2.0 levels";
const endMarker = "export function WorldMap({ lessons, user }: WorldMapProps) {";

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker);

if (startIndex !== -1 && endIndex !== -1) {
  content = content.slice(0, startIndex) + content.slice(endIndex);
  console.log('Successfully removed STAGE_TEMPLATES_BY_LEVEL definition.');
} else {
  console.error('Could not find markers for STAGE_TEMPLATES_BY_LEVEL.');
}

// 2. Clean up usage in realmsData
const oldRealmsData = `  // Build lessons list for each realm
  const realmsData = activeRealms.map((realm, rIdx) => {
    const list = filteredLessons.filter(
      (l) => normalizeLevel(l.level) === normalizeLevel(realm.level)
    );

    const templates = STAGE_TEMPLATES_BY_LEVEL[realm.level] || STAGE_TEMPLATES_BY_LEVEL["Bậc 1"] || [];

    const realmLessons: MapLesson[] =
      list.length > 0
        ? list.map((l) => {
            const isDone = Boolean(l.completed) || localCompletedIds.includes(l.id);
            return {
              ...l,
              completed: isDone,
              stars: l.stars || (isDone ? 3 : 0),
            };
          })
        : templates.map((st, sIdx) => ({
            id: \`template-\${realm.id}-\${sIdx + 1}\`,
            title: st.title,
            description: st.desc,
            level: realm.level,
            source: selectedStandard,
            orderNo: sIdx + 1,
            vocabCount: st.vocabCount,
            grammarCount: st.grammarCount,
            quizCount: st.quizCount,
            sampleVocabs: st.vocabs,
            completed: rIdx === 0 && sIdx < 2,
            score: rIdx === 0 && sIdx < 2 ? (sIdx === 0 ? 100 : 85) : 0,
            stars: rIdx === 0 && sIdx < 2 ? 3 : 0,
          }));

    const totalStars = realmLessons.reduce((s, l) => s + (l.stars || (l.completed ? 3 : 0)), 0);
    const maxStars = realmLessons.length * 3;
    const progressPercent = Math.min(100, Math.round((totalStars / maxStars) * 100));

    return {
      ...realm,
      lessons: realmLessons,
      totalStars,
      maxStars,
      progressPercent,
      isUnlocked: true,
    };
  });`;

const newRealmsData = `  // Build lessons list for each realm directly from database lessons
  const realmsData = activeRealms.map((realm) => {
    const list = filteredLessons.filter(
      (l) => normalizeLevel(l.level) === normalizeLevel(realm.level)
    );

    const realmLessons: MapLesson[] = list.map((l) => {
      const isDone = Boolean(l.completed) || localCompletedIds.includes(l.id);
      return {
        ...l,
        completed: isDone,
        stars: l.stars || (isDone ? 3 : 0),
      };
    });

    const totalStars = realmLessons.reduce((s, l) => s + (l.stars || (l.completed ? 3 : 0)), 0);
    const maxStars = Math.max(realmLessons.length * 3, 1);
    const progressPercent = Math.min(100, Math.round((totalStars / maxStars) * 100));

    return {
      ...realm,
      lessons: realmLessons,
      totalStars,
      maxStars,
      progressPercent,
      isUnlocked: true,
    };
  });`;

if (content.includes('const templates = STAGE_TEMPLATES_BY_LEVEL')) {
  // Replace the block
  const blockStart = content.indexOf('  // Build lessons list for each realm');
  const blockEnd = content.indexOf('  const { pushToast } = useToast();');
  if (blockStart !== -1 && blockEnd !== -1) {
    content = content.slice(0, blockStart) + newRealmsData + '\n\n' + content.slice(blockEnd);
    console.log('Successfully updated realmsData.');
  }
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Done!');
